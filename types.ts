export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface Subject {
  id: string;
  name: string;
}

export interface Faculty {
  id: string;
  name: string;
  subjectId: string;
  email: string;
}

export interface Batch {
  id: string;
  name: string;
}

export interface Classroom {
  id: string;
  name: string;
  isLab: boolean;
}

export interface ScheduleEvent {
  id: string;
  subjectId: string;
  facultyId: string;
  batchId: string;
  classroomId: string;
  day: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export type Schedule = ScheduleEvent[];

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

export type DayGroupedSchedule = {
  [key in DayOfWeek]?: ScheduleEvent[];
};

export interface SchedulerProps {
  schedule: DayGroupedSchedule;
  allEvents: Schedule;
  currentUser: { id: string; role: 'faculty' | 'student' };
  onVacantSlotClick?: (day: DayOfWeek, startTime: string) => void;
}

export interface SchedulePromptProps {
  masterSchedule: Schedule;
  currentUser: Faculty;
  onScheduleUpdate: (newEvent: ScheduleEvent) => void;
  onBulkScheduleUpdate: (newEvents: Omit<ScheduleEvent, 'id'>[]) => void;
  initialPrompt?: string;
}

export interface AIAssistantProps {
    masterSchedule: Schedule;
    currentUser: {id: string, name: string, role: 'faculty' | 'student'};
}