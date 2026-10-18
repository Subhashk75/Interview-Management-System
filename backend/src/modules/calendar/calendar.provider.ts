export interface CalendarEventPayload {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: { email: string; name?: string }[];
  location?: string;
  createMeetLink?: boolean;
}

export interface CalendarEventResult {
  eventId: string;
  meetingUrl?: string;
  status: string;
}

export interface FreeBusySlot {
  start: Date;
  end: Date;
}

export interface ICalendarProvider {
  name: 'GOOGLE' | 'MICROSOFT' | 'LOCAL';
  createEvent(userId: string, payload: CalendarEventPayload): Promise<CalendarEventResult>;
  updateEvent(userId: string, eventId: string, payload: Partial<CalendarEventPayload>): Promise<CalendarEventResult>;
  deleteEvent(userId: string, eventId: string): Promise<boolean>;
  getFreeBusy(userId: string, timeMin: Date, timeMax: Date): Promise<FreeBusySlot[]>;
}
