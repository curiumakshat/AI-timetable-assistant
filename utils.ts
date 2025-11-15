import type { Schedule, DayOfWeek, ScheduleEvent, Batch } from './types';
import { BATCH_DATA, getFacultyById, getBatchById, getClassroomById } from './database';

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
        
        for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[]) {
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
                if (!facultyCounts[event.facultyId]) facultyCounts[event.facultyId] = [];
                facultyCounts[event.facultyId].push(event);
                
                if (!batchCounts[event.batchId]) batchCounts[event.batchId] = [];
                batchCounts[event.batchId].push(event);

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
                    const faculty = getFacultyById(events[0].facultyId);
                    recordConflict(events, 'Faculty', faculty?.name || events[0].facultyId);
                }
            });
            Object.values(batchCounts).forEach(events => {
                if (events.length > 1) {
                    const batch = getBatchById(events[0].batchId);
                    recordConflict(events, 'Batch', batch?.name || events[0].batchId);
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