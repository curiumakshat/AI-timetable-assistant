export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface ScheduleEvent {
  id: string;
  subject: string;
  faculty: string;
  batch: string;
  room: string;
  day: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export type Schedule = {
  [key in DayOfWeek]?: ScheduleEvent[];
};

export interface AISuggestion {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export interface AIResponse {
  isFeasible: boolean;
  reasoning: string;
  suggestions: AISuggestion[];
  newSchedule?: Omit<ScheduleEvent, 'id'>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
