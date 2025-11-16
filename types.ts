export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type UserRole = 'faculty' | 'student' | 'admin' | 'coordinator';

export interface Subject {
  id: string;
  name: string;
  requiresLab: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  subjectId: string;
  email: string;
}

export interface Admin {
  id: string;
  name: string;
}

export interface Coordinator {
  id: string;
  name: string;
  clubId: string;
  email: string;
}

export interface Club {
    id: string;
    name: string;
}

export interface Batch {
  id: string;
  name: string;
  size: number;
}

export interface Classroom {
  id: string;
  name: string;
  isLab: boolean;
  capacity: number;
}

export interface ScheduleEvent {
  id: string;
  // Academic fields
  subjectId?: string;
  facultyId?: string;
  batchId?: string;
  // Club fields
  clubId?: string;
  coordinatorId?: string;
  eventName?: string; // e.g., "Dance Practice"
  
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
  currentUser: { id: string; role: UserRole };
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
  allSubjects: Subject[];
  allBatches: Batch[];
  allClassrooms: Classroom[];
}

export interface AIAssistantProps {
    masterSchedule: Schedule;
    currentUser: {id: string, name: string, role: UserRole};
}

export interface EventDetailsModalProps {
  event: ScheduleEvent;
  currentUser: { id: string, role: UserRole };
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
  userRole: UserRole;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkNotificationsAsRead: () => void;
}

export interface NotificationBellProps {
  notifications: AppNotification[];
  onOpen: () => void;
}

export interface ScheduleMetrics {
  facultyLoadScore: number; // std dev of hours
  roomUtilizationScore: number; // percentage
  studentOverloadInstances: number; // count of blocks > 3h
}

export interface GeneratedTimetable {
  name: string; // e.g., "Best Faculty Utilization"
  schedule: Schedule;
  metrics: ScheduleMetrics;
  reasoning: string;
}

export interface AdminDashboardProps {
  onPublishTimetable: (schedule: Schedule) => void;
  currentUser: Admin;
}

export interface BookClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: { day: DayOfWeek, startTime: string };
    currentUser: Coordinator;
    masterSchedule: Schedule;
    onAddClubEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
}