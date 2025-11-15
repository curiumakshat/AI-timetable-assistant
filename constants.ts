
import type { DayOfWeek, Schedule } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const FACULTY_SCHEDULE: Schedule = {
  Monday: [
    { id: 'f1', subject: 'Advanced Algorithms', faculty: 'Dr. Evelyn Reed', batch: 'CS-A', room: '301A', day: 'Monday', startTime: '10:00', endTime: '11:00' },
    { id: 'f2', subject: 'Compilers', faculty: 'Dr. Evelyn Reed', batch: 'CS-B', room: '302B', day: 'Monday', startTime: '11:00', endTime: '12:00' },
  ],
  Wednesday: [
    { id: 'f3', subject: 'Advanced Algorithms', faculty: 'Dr. Evelyn Reed', batch: 'CS-A', room: '301A', day: 'Wednesday', startTime: '09:00', endTime: '10:00' },
  ],
  Friday: [
     { id: 'f4', subject: 'Compilers', faculty: 'Dr. Evelyn Reed', batch: 'CS-B', room: '302B', day: 'Friday', startTime: '14:00', endTime: '15:00' },
  ]
};

export const STUDENT_SCHEDULE: Schedule = {
  Monday: [
    { id: 's1', subject: 'Advanced Algorithms', faculty: 'Dr. Evelyn Reed', batch: 'CS-A', room: '301A', day: 'Monday', startTime: '10:00', endTime: '11:00' },
    { id: 's2', subject: 'Data Science', faculty: 'Dr. Ben Carter', batch: 'CS-A', room: 'Lab 5', day: 'Monday', startTime: '11:00', endTime: '13:00' },
  ],
  Tuesday: [
    { id: 's3', subject: 'Machine Learning', faculty: 'Dr. Isla Chen', batch: 'CS-A', room: '401', day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
  ],
  Wednesday: [
    { id: 's4', subject: 'Advanced Algorithms', faculty: 'Dr. Evelyn Reed', batch: 'CS-A', room: '301A', day: 'Wednesday', startTime: '09:00', endTime: '10:00' },
    { id: 's5', subject: 'Software Engineering', faculty: 'Prof. Leo Maxwell', batch: 'CS-A', room: '202', day: 'Wednesday', startTime: '14:00', endTime: '16:00' },
  ],
  Thursday: [
     { id: 's6', subject: 'Data Science', faculty: 'Dr. Ben Carter', batch: 'CS-A', room: 'Lab 5', day: 'Thursday', startTime: '10:00', endTime: '12:00' },
  ],
  Friday: [
    { id: 's7', subject: 'Machine Learning', faculty: 'Dr. Isla Chen', batch: 'CS-A', room: '401', day: 'Friday', startTime: '09:00', endTime: '11:00' },
  ]
};
