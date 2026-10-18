import { google } from 'googleapis';
import { ICalendarProvider, CalendarEventPayload, CalendarEventResult, FreeBusySlot } from './calendar.provider.js';
import { CalendarConnection } from '../../models/CalendarConnection.js';
import { decrypt, encrypt } from '../../utils/encryption.js';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/appError.js';

export class GoogleCalendarAdapter implements ICalendarProvider {
  name: 'GOOGLE' = 'GOOGLE';

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI
    );
  }

  private async getAuthorizedClient(userId: string) {
    const connection = await CalendarConnection.findOne({ userId, provider: 'GOOGLE' });
    if (!connection) {
      throw new AppError('Google Calendar is not connected for this user.', 400, 'CALENDAR_NOT_CONNECTED');
    }

    const oauth2Client = this.getOAuth2Client();
    const accessToken = decrypt(connection.encryptedAccessToken);
    const refreshToken = decrypt(connection.encryptedRefreshToken);

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: connection.tokenExpiresAt.getTime(),
    });

    // Proactive token refresh check (5 min buffer)
    if (Date.now() > connection.tokenExpiresAt.getTime() - 5 * 60 * 1000) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          connection.encryptedAccessToken = encrypt(credentials.access_token);
          if (credentials.expiry_date) {
            connection.tokenExpiresAt = new Date(credentials.expiry_date);
          }
          await connection.save();
          logger.info(`Refreshed Google OAuth token for user ${userId}`);
        }
      } catch (err: any) {
        logger.error(`Failed to refresh Google token for user ${userId}: ${err.message}`);
        connection.syncStatus = 'REVOKED';
        await connection.save();
        throw new AppError('Google Calendar authorization expired. Please reconnect.', 401, 'CALENDAR_AUTH_EXPIRED');
      }
    }

    return oauth2Client;
  }

  async createEvent(userId: string, payload: CalendarEventPayload): Promise<CalendarEventResult> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const requestBody: any = {
      summary: payload.summary,
      description: payload.description,
      start: { dateTime: payload.startTime.toISOString() },
      end: { dateTime: payload.endTime.toISOString() },
      attendees: payload.attendees.map((a) => ({ email: a.email, displayName: a.name })),
      location: payload.location,
    };

    if (payload.createMeetLink !== false) {
      requestBody.conferenceData = {
        createRequest: {
          requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody,
      sendUpdates: 'all',
    });

    const event = response.data;
    const meetingUrl = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;

    return {
      eventId: event.id || '',
      meetingUrl: meetingUrl || undefined,
      status: event.status || 'confirmed',
    };
  }

  async updateEvent(
    userId: string,
    eventId: string,
    payload: Partial<CalendarEventPayload>
  ): Promise<CalendarEventResult> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const patchBody: any = {};
    if (payload.summary) patchBody.summary = payload.summary;
    if (payload.description) patchBody.description = payload.description;
    if (payload.startTime) patchBody.start = { dateTime: payload.startTime.toISOString() };
    if (payload.endTime) patchBody.end = { dateTime: payload.endTime.toISOString() };
    if (payload.attendees) {
      patchBody.attendees = payload.attendees.map((a) => ({ email: a.email, displayName: a.name }));
    }

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: patchBody,
      sendUpdates: 'all',
    });

    const event = response.data;
    const meetingUrl = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;

    return {
      eventId: event.id || eventId,
      meetingUrl: meetingUrl || undefined,
      status: event.status || 'confirmed',
    };
  }

  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });

    return true;
  }

  async getFreeBusy(userId: string, timeMin: Date, timeMax: Date): Promise<FreeBusySlot[]> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    const busy = response.data.calendars?.primary?.busy || [];
    return busy.map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));
  }
}
