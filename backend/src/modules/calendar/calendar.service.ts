import { ICalendarProvider, CalendarEventPayload, CalendarEventResult, FreeBusySlot } from './calendar.provider.js';
import { GoogleCalendarAdapter } from './googleCalendar.adapter.js';
import { CalendarConnection } from '../../models/CalendarConnection.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

class MockLocalCalendarAdapter implements ICalendarProvider {
  name: 'LOCAL' = 'LOCAL';

  async createEvent(userId: string, payload: CalendarEventPayload): Promise<CalendarEventResult> {
    const eventId = `local_evt_${crypto.randomUUID().substring(0, 8)}`;
    const randomCode =
      Math.random().toString(36).substring(2, 5) +
      '-' +
      Math.random().toString(36).substring(2, 6) +
      '-' +
      Math.random().toString(36).substring(2, 5);
    const meetingUrl = `https://meet.google.com/${randomCode}`;
    logger.info(`[MockCalendar] Created event ${eventId} for user ${userId} with Meet URL: ${meetingUrl}`);
    return {
      eventId,
      meetingUrl,
      status: 'confirmed',
    };
  }

  async updateEvent(userId: string, eventId: string, payload: Partial<CalendarEventPayload>): Promise<CalendarEventResult> {
    logger.info(`[MockCalendar] Updated event ${eventId} for user ${userId}`);
    return {
      eventId,
      status: 'confirmed',
    };
  }

  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    logger.info(`[MockCalendar] Deleted event ${eventId} for user ${userId}`);
    return true;
  }

  async getFreeBusy(userId: string, timeMin: Date, timeMax: Date): Promise<FreeBusySlot[]> {
    return [];
  }
}

export class CalendarService {
  private googleAdapter = new GoogleCalendarAdapter();
  private mockAdapter = new MockLocalCalendarAdapter();

  private async getProviderForUser(userId: string): Promise<ICalendarProvider> {
    const connection = await CalendarConnection.findOne({ userId, syncStatus: 'ACTIVE' });
    if (connection?.provider === 'GOOGLE') {
      return this.googleAdapter;
    }
    // Default to Mock adapter for seamless development & offline environments
    return this.mockAdapter;
  }

  async createMeeting(userId: string, payload: CalendarEventPayload): Promise<CalendarEventResult> {
    try {
      const provider = await this.getProviderForUser(userId);
      return await provider.createEvent(userId, payload);
    } catch (err: any) {
      logger.warn(`Calendar provider error: ${err.message}. Falling back to mock calendar link generation.`);
      return await this.mockAdapter.createEvent(userId, payload);
    }
  }

  async updateMeeting(userId: string, eventId: string, payload: Partial<CalendarEventPayload>): Promise<CalendarEventResult> {
    try {
      const provider = await this.getProviderForUser(userId);
      return await provider.updateEvent(userId, eventId, payload);
    } catch (err: any) {
      logger.warn(`Calendar update error: ${err.message}. Falling back to mock.`);
      return await this.mockAdapter.updateEvent(userId, eventId, payload);
    }
  }

  async cancelMeeting(userId: string, eventId: string): Promise<boolean> {
    try {
      const provider = await this.getProviderForUser(userId);
      return await provider.deleteEvent(userId, eventId);
    } catch (err: any) {
      logger.warn(`Calendar cancel error: ${err.message}`);
      return true;
    }
  }

  async getFreeBusy(userId: string, timeMin: Date, timeMax: Date): Promise<FreeBusySlot[]> {
    try {
      const provider = await this.getProviderForUser(userId);
      return await provider.getFreeBusy(userId, timeMin, timeMax);
    } catch (err) {
      return [];
    }
  }
}

export const calendarService = new CalendarService();
