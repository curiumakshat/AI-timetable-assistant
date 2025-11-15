import type { DayOfWeek, Schedule, Faculty, Subject, Batch, Classroom } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const SUBJECT_DATA: Subject[] = [
    { id: 'S1', name: 'Advanced Algorithms' },
    { id: 'S2', name: 'Compilers' },
    { id: 'S3', name: 'Data Science' },
    { id: 'S4', name: 'Machine Learning' },
    { id: 'S5', name: 'Software Engineering' },
];

// Fix: Add email addresses to faculty data to match the Faculty type.
export const FACULTY_DATA: Faculty[] = [
    { id: 'ER', name: 'Dr. Evelyn Reed', subjectId: 'S1', email: 'e.reed@university.edu' },
    { id: 'BC', name: 'Dr. Ben Carter', subjectId: 'S3', email: 'b.carter@university.edu' },
    { id: 'IC', name: 'Dr. Isla Chen', subjectId: 'S4', email: 'i.chen@university.edu' },
    { id: 'LM', name: 'Prof. Leo Maxwell', subjectId: 'S5', email: 'l.maxwell@university.edu' },
    { id: 'AJ', name: 'Dr. Alan Johnson', subjectId: 'S2', email: 'a.johnson@university.edu' },
];

export const BATCH_DATA: Batch[] = [
    { id: 'CS-A', name: 'Batch CS-A' },
    { id: 'CS-B', name: 'Batch CS-B' },
];

export const CLASSROOM_DATA: Classroom[] = [
    { id: 'R1', name: '301A', isLab: false },
    { id: 'R2', name: '302B', isLab: false },
    { id: 'R3', name: '401', isLab: false },
    { id: 'R4', name: '202', isLab: false },
    { id: 'L1', name: 'Lab 5', isLab: true },
];

// Helper functions to find data by ID
export const getSubjectById = (id: string) => SUBJECT_DATA.find(s => s.id === id);
export const getFacultyById = (id: string) => FACULTY_DATA.find(f => f.id === id);
export const getBatchById = (id: string) => BATCH_DATA.find(b => b.id === id);
export const getClassroomById = (id: string) => CLASSROOM_DATA.find(c => c.id === id);

export const MASTER_SCHEDULE: Schedule = [
    // Batch CS-A
    { id: 'e1', subjectId: 'S1', facultyId: 'ER', batchId: 'CS-A', classroomId: 'R1', day: 'Monday', startTime: '10:00', endTime: '11:00' },
    { id: 'e2', subjectId: 'S3', facultyId: 'BC', batchId: 'CS-A', classroomId: 'L1', day: 'Monday', startTime: '11:00', endTime: '13:00' },
    { id: 'e3', subjectId: 'S4', facultyId: 'IC', batchId: 'CS-A', classroomId: 'R3', day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
    { id: 'e4', subjectId: 'S1', facultyId: 'ER', batchId: 'CS-A', classroomId: 'R1', day: 'Wednesday', startTime: '09:00', endTime: '10:00' },
    { id: 'e5', subjectId: 'S5', facultyId: 'LM', batchId: 'CS-A', classroomId: 'R4', day: 'Wednesday', startTime: '14:00', endTime: '16:00' },
    { id: 'e6', subjectId: 'S3', facultyId: 'BC', batchId: 'CS-A', classroomId: 'L1', day: 'Thursday', startTime: '10:00', endTime: '12:00' },
    { id: 'e7', subjectId: 'S4', facultyId: 'IC', batchId: 'CS-A', classroomId: 'R3', day: 'Friday', startTime: '09:00', endTime: '11:00' },

    // Batch CS-B
    { id: 'e8', subjectId: 'S2', facultyId: 'AJ', batchId: 'CS-B', classroomId: 'R2', day: 'Monday', startTime: '11:00', endTime: '12:00' },
    { id: 'e9', subjectId: 'S5', facultyId: 'LM', batchId: 'CS-B', classroomId: 'R4', day: 'Monday', startTime: '14:00', endTime: '16:00' },
    { id: 'e10', subjectId: 'S3', facultyId: 'BC', batchId: 'CS-B', classroomId: 'L1', day: 'Tuesday', startTime: '11:00', endTime: '13:00' },
    { id: 'e11', subjectId: 'S4', facultyId: 'IC', batchId: 'CS-B', classroomId: 'R3', day: 'Wednesday', startTime: '10:00', endTime: '12:00' },
    { id: 'e12', subjectId: 'S2', facultyId: 'AJ', batchId: 'CS-B', classroomId: 'R2', day: 'Friday', startTime: '14:00', endTime: '15:00' },
];