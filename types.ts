export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface Subject {
  id: string;
  name: string;
}

export interface Faculty {
  id: string;
  name: string;
  subjectId: string;
  // Fix: Add email property to Faculty type to match its usage in FacultyDirectory.tsx.
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
  status?: 'cancellation_requested' | 'reschedule_requested';
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
  onEventStatusUpdate: (eventId: string, status: 'cancellation_requested' | 'reschedule_requested') => void;
  onApproveCancellation: (eventId: string) => void;
  onRejectCancellation: (eventId: string) => void;
  onRejectReschedule: (eventId: string) => void;
  onCancelClass: (eventId: string) => void;
  onFindRescheduleSuggestions: (event: ScheduleEvent) => Promise<AISuggestion[]>;
  onCommitReschedule: (eventId: string, suggestion: AISuggestion) => void;
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

export interface EventDetailsModalProps {
  event: ScheduleEvent;
  currentUser: { id: string, role: 'faculty' | 'student' };
  onClose: () => void;
  onUpdateStatus: (eventId: string, status: 'cancellation_requested' | 'reschedule_requested') => void;
  onApproveCancellation: (eventId: string) => void;
  onRejectCancellation: (eventId: string) => void;
  onRejectReschedule: (eventId: string) => void;
  onCancelClass: (eventId: string) => void;
  onFindRescheduleSuggestions: (event: ScheduleEvent) => Promise<AISuggestion[]>;
  onCommitReschedule: (eventId: string, suggestion: AISuggestion) => void;
}

export interface AppNotification {
  id: number;
  message: string;
  timestamp: Date;
  recipientId: string; // Can be facultyId or batchId
  read: boolean;
}

export interface HeaderProps {
  userName: string;
  userRole: 'faculty' | 'student';
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkNotificationsAsRead: () => void;
}

export interface NotificationBellProps {
  notifications: AppNotification[];
  onOpen: () => void;
}
