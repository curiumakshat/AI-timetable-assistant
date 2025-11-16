import React, { useState, useMemo } from 'react';
import type { BookClubModalProps, ScheduleEvent } from '../types';
import { getClubById, CLASSROOM_DATA } from '../database';
import { SparklesIcon } from './Icons';

const BookClubModal: React.FC<BookClubModalProps> = ({ isOpen, onClose, slot, currentUser, masterSchedule, onAddClubEvent }) => {
    const [duration, setDuration] = useState(1);
    const [classroomId, setClassroomId] = useState(CLASSROOM_DATA[0].id);
    const [error, setError] = useState<string | null>(null);

    const club = getClubById(currentUser.clubId);

    const availableClassrooms = useMemo(() => {
        const endTime = `${String(parseInt(slot.startTime.split(':')[0]) + duration).padStart(2, '0')}:00`;

        return CLASSROOM_DATA.filter(room => {
            return !masterSchedule.some(event => {
                if (event.day !== slot.day || event.classroomId !== room.id) {
                    return false;
                }
                // Check for time overlap
                const existingStart = parseInt(event.startTime.split(':')[0]);
                const existingEnd = parseInt(event.endTime.split(':')[0]);
                const newStart = parseInt(slot.startTime.split(':')[0]);
                const newEnd = parseInt(endTime.split(':')[0]);
                
                return newStart < existingEnd && newEnd > existingStart;
            });
        });
    }, [slot, duration, masterSchedule]);

    // Effect to reset classroom selection if the chosen one becomes unavailable
    useState(() => {
        if (!availableClassrooms.find(c => c.id === classroomId)) {
            setClassroomId(availableClassrooms.length > 0 ? availableClassrooms[0].id : '');
        }
    });


    if (!isOpen) return null;

    const handleSubmit = () => {
        setError(null);
        if (!classroomId) {
            setError('No classroom is selected or available for this time slot.');
            return;
        }

        const newEvent: Omit<ScheduleEvent, 'id'> = {
            clubId: currentUser.clubId,
            coordinatorId: currentUser.id,
            eventName: `${club?.name} Activity`,
            classroomId: classroomId,
            day: slot.day,
            startTime: slot.startTime,
            endTime: `${String(parseInt(slot.startTime.split(':')[0]) + duration).padStart(2, '0')}:00`,
        };
        
        onAddClubEvent(newEvent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Book Club Activity Slot</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    For {club?.name} on {slot.day} at {slot.startTime}
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="duration-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Duration</label>
                        <select
                            id="duration-select"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            <option value={1}>1 Hour</option>
                            <option value={2}>2 Hours</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="room-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Available Classrooms</label>
                        <select
                            id="room-select"
                            value={classroomId}
                            onChange={(e) => setClassroomId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            disabled={availableClassrooms.length === 0}
                        >
                           {availableClassrooms.length > 0 ? (
                                availableClassrooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name} (Capacity: {room.capacity})</option>
                                ))
                           ) : (
                               <option>No rooms available</option>
                           )}
                        </select>
                    </div>
                </div>

                {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} type="button" disabled={!classroomId} className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Book Slot
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookClubModal;