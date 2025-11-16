import type { Schedule, DayOfWeek, ScheduleEvent, Batch, ScheduleMetrics } from './types';
import { DAYS_OF_WEEK, BATCH_DATA, getFacultyById, getBatchById, getClassroomById, FACULTY_DATA, CLASSROOM_DATA, TIME_SLOTS } from './database';

const HIGH_WORKLOAD_THRESHOLD = 3; // in hours

interface Conflict {
    type: 'workload' | 'double-booking';
    message: string;
}

/**
 * Finds all workload violations for all student batches in the master schedule.
 */
const findWorkloadViolations = (masterSchedule: Schedule): Map<string, Conflict> => {
    const conflicts = new Map<string, Conflict>();

    BATCH_DATA.forEach(batch => {
        const batchSchedule = masterSchedule.filter(event => event.batchId === batch.id);
        
        for (const day of DAYS_OF_WEEK) {
            const events = batchSchedule
                .filter(e => e.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            if (events.length < 2) continue;

            let currentBlock: ScheduleEvent[] = [events[0]];
            for (let i = 1; i < events.length; i++) {
                const prevEvent = events[i - 1];
                const currentEvent = events[i];

                if (currentEvent.startTime === prevEvent.endTime) {
                    currentBlock.push(currentEvent);
                } else {
                    checkAndRecordWorkloadConflict(currentBlock, batch, conflicts);
                    currentBlock = [currentEvent];
                }
            }
            checkAndRecordWorkloadConflict(currentBlock, batch, conflicts);
        }
    });

    return conflicts;
};

const checkAndRecordWorkloadConflict = (block: ScheduleEvent[], batch: Batch, conflicts: Map<string, Conflict>) => {
    if (block.length <= 1) return;

    const blockStartTime = block[0].startTime;
    const blockEndTime = block[block.length - 1].endTime;
    const startHour = parseInt(blockStartTime.split(':')[0]);
    const endHour = parseInt(blockEndTime.split(':')[0]);
    const duration = endHour - startHour;

    if (duration > HIGH_WORKLOAD_THRESHOLD) {
        const tooltip = `Workload Warning: This class is part of a ${duration}-hour study block for ${batch.name} (${blockStartTime} - ${blockEndTime}).`;
        block.forEach(event => {
            // Don't overwrite a more severe conflict
            if (!conflicts.has(event.id) || conflicts.get(event.id)?.type === 'workload') {
                conflicts.set(event.id, { type: 'workload', message: tooltip });
            }
        });
    }
};

/**
 * Finds all double-booking conflicts in the master schedule.
 */
const findDoubleBookings = (masterSchedule: Schedule): Map<string, Conflict> => {
    const conflicts = new Map<string, Conflict>();
    const timeSlots: { [key: string]: ScheduleEvent[] } = {};

    masterSchedule.forEach(event => {
        const start = parseInt(event.startTime.split(':')[0]);
        const end = parseInt(event.endTime.split(':')[0]);
        for (let hour = start; hour < end; hour++) {
            const key = `${event.day}-${hour}`;
            if (!timeSlots[key]) timeSlots[key] = [];
            timeSlots[key].push(event);
        }
    });

    for (const key in timeSlots) {
        const eventsInSlot = timeSlots[key];
        if (eventsInSlot.length > 1) {
            // Check for faculty, batch, and room conflicts
            const facultyCounts: { [id: string]: ScheduleEvent[] } = {};
            const batchCounts: { [id: string]: ScheduleEvent[] } = {};
            const roomCounts: { [id: string]: ScheduleEvent[] } = {};

            eventsInSlot.forEach(event => {
                if(event.facultyId) {
                    if (!facultyCounts[event.facultyId]) facultyCounts[event.facultyId] = [];
                    facultyCounts[event.facultyId].push(event);
                }
                
                if(event.batchId) {
                    if (!batchCounts[event.batchId]) batchCounts[event.batchId] = [];
                    batchCounts[event.batchId].push(event);
                }

                if (!roomCounts[event.classroomId]) roomCounts[event.classroomId] = [];
                roomCounts[event.classroomId].push(event);
            });
            
            const recordConflict = (conflictingEvents: ScheduleEvent[], resourceType: string, resourceName: string) => {
                 if (conflictingEvents.length > 1) {
                    const message = `Double Booking: ${resourceType} '${resourceName}' is booked for multiple classes at this time.`;
                     conflictingEvents.forEach(e => conflicts.set(e.id, { type: 'double-booking', message }));
                }
            };

            Object.values(facultyCounts).forEach(events => {
                if (events.length > 1) {
                    const faculty = getFacultyById(events[0].facultyId!);
                    recordConflict(events, 'Faculty', faculty?.name || events[0].facultyId!);
                }
            });
            Object.values(batchCounts).forEach(events => {
                if (events.length > 1) {
                    const batch = getBatchById(events[0].batchId!);
                    recordConflict(events, 'Batch', batch?.name || events[0].batchId!);
                }
            });
            Object.values(roomCounts).forEach(events => {
                if (events.length > 1) {
                    const room = getClassroomById(events[0].classroomId);
                    recordConflict(events, 'Room', room?.name || events[0].classroomId);
                }
            });
        }
    }

    return conflicts;
};


/**
 * Analyzes a master schedule to find all types of conflicts.
 * @param masterSchedule The schedule to analyze.
 * @returns A Map where keys are event IDs and values are conflict details.
 */
export const findConflicts = (masterSchedule: Schedule): Map<string, Conflict> => {
    const workloadConflicts = findWorkloadViolations(masterSchedule);
    const bookingConflicts = findDoubleBookings(masterSchedule);
    
    // Merge conflicts, giving precedence to double-bookings as they are more severe
    const allConflicts = new Map(workloadConflicts);
    bookingConflicts.forEach((value, key) => {
        allConflicts.set(key, value);
    });

    return allConflicts;
};

export const isBookableSlot = (day: DayOfWeek, startTime: string): boolean => {
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    // JS getDay(): Sunday = 0, Monday = 1, ..., Saturday = 6
    // We want: Monday = 0, ..., Saturday = 5
    const todayIndex = (today.getDay() + 6) % 7; 

    let dayDiff = dayIndex - todayIndex;
    // If the day is in the past week, move it to the next week
    if (dayDiff < 0) {
        dayDiff += 7;
    }
    
    const slotDate = new Date(today.getTime());
    slotDate.setDate(slotDate.getDate() + dayDiff);
    
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1] || '0');
    slotDate.setHours(startHour, startMinute, 0, 0);

    // Rule 1: The slot must be in the future.
    if (slotDate < now) {
        return false;
    }

    // Rule 2: Saturday is always a valid day for booking.
    if (day === 'Saturday') {
        return true;
    }

    // Rule 3: On weekdays, only bookable from 18:00 onwards.
    if (startHour >= 18) {
        return true;
    }

    // If it's a weekday before 18:00, it's not bookable.
    return false;
};


export const calculateScheduleMetrics = (schedule: Schedule): ScheduleMetrics => {
    // 1. Faculty Load Score (Standard Deviation of hours)
    const facultyHours: { [key: string]: number } = {};
    FACULTY_DATA.forEach(f => facultyHours[f.id] = 0);

    schedule.forEach(event => {
        if (!event.facultyId) return; // Skip non-academic events
        const duration = parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0]);
        if (facultyHours[event.facultyId] !== undefined) {
            facultyHours[event.facultyId] += duration;
        }
    });

    const hoursArray = Object.values(facultyHours);
    const totalHours = hoursArray.reduce((sum, h) => sum + h, 0);
    const meanHours = totalHours / hoursArray.length;
    const variance = hoursArray.reduce((sum, h) => sum + Math.pow(h - meanHours, 2), 0) / hoursArray.length;
    const facultyLoadScore = Math.sqrt(variance);

    // 2. Room Utilization Score (Percentage)
    const availableHoursPerDay = TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) < 17).length; // 9-17
    const totalAvailableRoomHours = CLASSROOM_DATA.length * (DAYS_OF_WEEK.length - 1) * availableHoursPerDay; // Exclude Saturday
    
    const totalScheduledHours = schedule.reduce((sum, event) => {
        const duration = parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0]);
        return sum + duration;
    }, 0);

    const roomUtilizationScore = totalAvailableRoomHours > 0 ? (totalScheduledHours / totalAvailableRoomHours) * 100 : 0;

    // 3. Student Overload Instances
    let studentOverloadInstances = 0;
    BATCH_DATA.forEach(batch => {
        for (const day of DAYS_OF_WEEK) {
            const events = schedule
                .filter(e => e.batchId === batch.id && e.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            if (events.length < 2) continue;

            let currentBlock: ScheduleEvent[] = [events[0]];
            for (let i = 1; i < events.length; i++) {
                const prevEvent = events[i - 1];
                const currentEvent = events[i];

                if (currentEvent.startTime === prevEvent.endTime) {
                    currentBlock.push(currentEvent);
                } else {
                    const duration = parseInt(currentBlock[currentBlock.length - 1].endTime.split(':')[0]) - parseInt(currentBlock[0].startTime.split(':')[0]);
                    if (duration > HIGH_WORKLOAD_THRESHOLD) {
                        studentOverloadInstances++;
                    }
                    currentBlock = [currentEvent];
                }
            }
             const duration = parseInt(currentBlock[currentBlock.length - 1].endTime.split(':')[0]) - parseInt(currentBlock[0].startTime.split(':')[0]);
            if (duration > HIGH_WORKLOAD_THRESHOLD) {
                studentOverloadInstances++;
            }
        }
    });
    
    return {
        facultyLoadScore: parseFloat(facultyLoadScore.toFixed(2)),
        roomUtilizationScore: parseFloat(roomUtilizationScore.toFixed(2)),
        studentOverloadInstances,
    };
};