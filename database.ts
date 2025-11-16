import type { DayOfWeek, Schedule, Faculty, Subject, Batch, Classroom, Admin, Coordinator, Club } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const SUBJECT_DATA: Subject[] = [
    { id: 'S1', name: 'Chemistry', requiresLab: false },
    { id: 'S2', name: 'Computer progranning', requiresLab: false },
    { id: 'S3', name: 'Engineering graphics', requiresLab: true },
    { id: 'S4', name: 'Electronics', requiresLab: true },
    { id: 'S5', name: 'Calculus', requiresLab: false },
    { id: 'S6', name: 'AOC-112', requiresLab: false },
    { id: 'S7', name: 'AOC-121', requiresLab: false },
    { id: 'S8', name: 'AOC-201', requiresLab: false },
];

export const FACULTY_DATA: Faculty[] = [
    { id: 'ER', name: 'Dr. Amit Verma', subjectId: 'S1', email: 'amitverma@university.edu' },
    { id: 'BC', name: 'Dr. Kavi Arya', subjectId: 'S3', email: 'kaviarya@university.edu' },
    { id: 'IC', name: 'Sujoy Bhore', subjectId: 'S4', email: 'sujoybhoren@university.edu' },
    { id: 'LM', name: 'Parag Kumar Chaudhuri', subjectId: 'S5', email: 'paragkumarchaudhuri@university.edu' },
    { id: 'AJ', name: 'Avishek Ghosh', subjectId: 'S2', email: 'avishekghosh@university.edu' },
    { id: 'AP', name: 'Dr. Anshima Prakash', subjectId: 'S6', email: 'anshimaprakash@university.edu' },
    { id: 'SK', name: 'Dr. Shakti Kundu', subjectId: 'S7', email: 'shaktikundu@university.edu' },
    { id: 'PN', name: 'Prof. Pranshant Nair', subjectId: 'S8', email: 'prasantnair@university.edu' },
];

export const ADMIN_DATA: Admin[] = [
    { id: 'ADM1', name: 'Dr. Admin Head' }
];

export const CLUB_DATA: Club[] = [
    { id: 'C1', name: 'Dance Club' },
    { id: 'C2', name: 'Art Club' },
    { id: 'C3', name: 'Kavishala Club' },
];

export const COORDINATOR_DATA: Coordinator[] = [
    { id: 'CR1', name: 'Aayushi Ranjan', clubId: 'C1', email: 'a.ranjan@university.edu' },
    { id: 'CR2', name: 'Sonakshi Sharma', clubId: 'C2', email: 's.sharma@university.edu' },
    { id: 'CR3', name: 'Aadita Singh', clubId: 'C3', email: 'a.singh@university.edu' },
];

export const BATCH_DATA: Batch[] = [
    { id: 'CS-A', name: 'Batch CS-A', size: 60 },
    { id: 'CS-B', name: 'Batch CS-B', size: 55 },
];

export const CLASSROOM_DATA: Classroom[] = [
    { id: 'R1', name: '301A', isLab: false, capacity: 70 },
    { id: 'R2', name: '302B', isLab: false, capacity: 70 },
    { id: 'R3', name: '401', isLab: false, capacity: 50 },
    { id: 'R4', name: '202', isLab: false, capacity: 50 },
    { id: 'L1', name: 'Lab 5', isLab: true, capacity: 60 },
];

// Helper functions to find data by ID
export const getSubjectById = (id?: string) => SUBJECT_DATA.find(s => s.id === id);
export const getFacultyById = (id?: string) => FACULTY_DATA.find(f => f.id === id);
export const getBatchById = (id?: string) => BATCH_DATA.find(b => b.id === id);
export const getClassroomById = (id?: string) => CLASSROOM_DATA.find(c => c.id === id);
export const getCoordinatorById = (id?: string) => COORDINATOR_DATA.find(c => c.id === id);
export const getClubById = (id?: string) => CLUB_DATA.find(c => c.id === id);

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