import React, { useMemo, useState, useEffect } from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS, getSubjectById, getFacultyById, getClassroomById, getClubById, getCoordinatorById } from '../database';
import type { ScheduleEvent, DayOfWeek, SchedulerProps, UserRole } from '../types';
import { findConflicts, isBookableSlot } from '../utils';
import EventDetailsModal from './EventDetailsModal';

const getEventGridPosition = (event: ScheduleEvent) => {
  const startHour = parseInt(event.startTime.split(':')[0], 10);
  const endHour = parseInt(event.endTime.split(':')[0], 10);
  
  const startRowIndex = TIME_SLOTS.indexOf(`${String(startHour).padStart(2, '0')}:00`);
  
  // Handle cases where start time isn't in our defined slots.
  if (startRowIndex === -1) {
    return {};
  }
  
  // The inner grid for events starts at row 1, and indexOf is 0-based. So we add 1.
  const startRow = startRowIndex + 1;
  const duration = endHour - startHour;

  if (duration <= 0) return {};

  return {
    gridRowStart: startRow,
    gridRowEnd: startRow + duration,
  };
};

const EventCard: React.FC<{ event: ScheduleEvent; conflict?: { type: string; message: string }; onClick: () => void; }> = ({ event, conflict, onClick }) => {
  const isClubEvent = !!event.clubId;
  
  // Academic Info
  const subject = getSubjectById(event.subjectId);
  const faculty = getFacultyById(event.facultyId);
  
  // Club Info
  const club = getClubById(event.clubId);
  const coordinator = getCoordinatorById(event.coordinatorId);
  
  const classroom = getClassroomById(event.classroomId);
  const duration = parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0]);

  const isCancellationRequested = event.status === 'cancellation_requested';
  const isRescheduleRequested = event.status === 'reschedule_requested';

  let baseBgColor = 'bg-blue-100 dark:bg-blue-900/50';
  let baseBorderColor = 'border-blue-400';

  if(isClubEvent) {
    baseBgColor = 'bg-purple-100 dark:bg-purple-900/50';
    baseBorderColor = 'border-purple-400';
  } else if (duration > 1) {
    baseBgColor = 'bg-indigo-100 dark:bg-indigo-900/50';
    baseBorderColor = 'border-indigo-400';
  }
  
  if (isCancellationRequested) {
    baseBorderColor = 'border-red-400 dark:border-red-500';
  } else if (isRescheduleRequested) {
    baseBorderColor = 'border-orange-400 dark:border-orange-500';
  }

  const conflictColors = {
    'workload': 'bg-amber-100 dark:bg-amber-900/50 border-amber-400',
    'double-booking': 'bg-red-100 dark:bg-red-900/50 border-red-400',
  };
  
  const conflictClass = conflict ? conflictColors[conflict.type as keyof typeof conflictColors] || conflictColors['double-booking'] : '';
  
  const eventName = isClubEvent ? (event.eventName || club?.name) : subject?.name;
  let cardTitle = conflict?.message;
  if (isCancellationRequested) cardTitle = `Cancellation Requested for ${eventName}`;
  if (isRescheduleRequested) cardTitle = `Reschedule Requested for ${eventName}`;


  return (
      <button 
        onClick={onClick}
        className={`relative p-2 w-full text-left rounded-lg border-l-4 ${conflict ? conflictClass : `${baseBgColor} ${baseBorderColor}`} text-gray-800 dark:text-gray-200 overflow-hidden text-xs md:text-sm transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800`}
        style={getEventGridPosition(event)}
        title={cardTitle}
        aria-label={`View details for ${eventName || 'event'} at ${event.startTime}`}
      >
        <div className={isCancellationRequested ? 'line-through text-gray-500 dark:text-gray-400' : ''}>
          <p className="font-bold truncate">{eventName || 'Unknown Event'}</p>
          <p className="text-gray-600 dark:text-gray-400">{isClubEvent ? coordinator?.name : faculty?.name || 'Unknown Staff'}</p>
          <p className="text-gray-600 dark:text-gray-400">Room: {classroom?.name || 'N/A'}</p>
          <p className="text-gray-500 dark:text-gray-500 hidden md:block">{event.startTime} - {event.endTime}</p>
        </div>
        {isCancellationRequested && (
           <span className="absolute bottom-1 right-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
             Cancelled
           </span>
        )}
        {isRescheduleRequested && (
           <span className="absolute bottom-1 right-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded">
             Reschedule?
           </span>
        )}
      </button>
  );
};

const MemoizedEventCard = React.memo(EventCard);


const Scheduler: React.FC<SchedulerProps> = ({ schedule, allEvents, currentUser, onVacantSlotClick, onEventStatusUpdate, onApproveCancellation, onRejectCancellation, onRejectReschedule, onCancelClass, onFindRescheduleSuggestions, onCommitReschedule }) => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const conflicts = useMemo(() => {
    return findConflicts(allEvents);
  }, [allEvents]);

  useEffect(() => {
    // This effect keeps the data in the modal synchronized with the master schedule.
    // If an event's status changes, it refreshes the modal. If it's deleted, it closes it.
    if (selectedEvent) {
      const updatedEvent = allEvents.find(e => e.id === selectedEvent.id);
      if (!updatedEvent) {
        setSelectedEvent(null); // Event was deleted, so close modal.
      } else if (JSON.stringify(updatedEvent) !== JSON.stringify(selectedEvent)) {
        setSelectedEvent(updatedEvent); // Event data changed, so update modal.
      }
    }
  }, [allEvents, selectedEvent]);

  const today = new Date().toLocaleString('en-US', { weekday: 'long' });

  // Performance Optimization: Memoize a Set of occupied slots for O(1) lookup.
  const occupiedSlots = useMemo(() => {
    const slots = new Set<string>();
    Object.values(schedule).flat().forEach(event => {
        const startHour = parseInt(event.startTime.split(':')[0]);
        const endHour = parseInt(event.endTime.split(':')[0]);
        for (let i = startHour; i < endHour; i++) {
            slots.add(`${event.day}-${i}`);
        }
    });
    return slots;
  }, [schedule]);
  
  const lunchRowIndex = TIME_SLOTS.indexOf('12:00');

  return (
    <>
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          currentUser={currentUser}
          onClose={() => setSelectedEvent(null)}
          onUpdateStatus={onEventStatusUpdate}
          onApproveCancellation={onApproveCancellation}
          onRejectCancellation={onRejectCancellation}
          onRejectReschedule={onRejectReschedule}
          onCancelClass={onCancelClass}
          onFindRescheduleSuggestions={onFindRescheduleSuggestions}
          onCommitReschedule={onCommitReschedule}
        />
      )}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-6" style={{ gridTemplateRows: `auto repeat(${TIME_SLOTS.length}, 4rem)`}}>
          {/* Time column */}
          <div className="col-start-1 row-start-1"></div>
          {TIME_SLOTS.map((time, index) => (
            <div key={time} className="text-right text-xs sm:text-sm text-gray-500 dark:text-gray-400 pr-2" style={{ gridRow: index + 2 }}>
              {time}
            </div>
          ))}

          {/* Header row */}
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className={`text-center font-bold text-gray-700 dark:text-gray-200 pb-2 rounded-t-lg ${day === today ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`} style={{ gridColumn: index + 2 }}>
              {day}
            </div>
          ))}
          
          {/* Grid lines and content */}
          {DAYS_OF_WEEK.map((day, dayIndex) => (
              <div key={day} className={`col-start-2 relative rounded-b-lg ${day === today ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`} style={{ gridColumn: dayIndex + 2, gridRow: `2 / span ${TIME_SLOTS.length}`}}>
                  <div className="grid h-full border-l border-gray-200 dark:border-gray-700" style={{ gridTemplateRows: `repeat(${TIME_SLOTS.length}, 1fr)`}}>
                      {TIME_SLOTS.slice(0, -1).map((_, i) => <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700"></div>)}
                  </div>
                  <div className="absolute inset-0 grid p-1 gap-1" style={{ gridTemplateRows: `repeat(${TIME_SLOTS.length}, 1fr)`}}>
                      {/* Lunch Break Indicator */}
                      {lunchRowIndex !== -1 && (
                          <div
                            style={{ gridRow: lunchRowIndex + 1 }}
                            className="flex items-center justify-center text-xs font-semibold text-gray-400 bg-gray-100/50 dark:bg-gray-900/40 rounded-md"
                          >
                            Lunch Break
                          </div>
                      )}

                      {/* Vacant Slots */}
                      {onVacantSlotClick && (currentUser.role === 'faculty' || currentUser.role === 'coordinator') && TIME_SLOTS.slice(0, -1).map((time, timeIndex) => {
                          if (time === '12:00') return null; // No booking during lunch

                          const slotHour = parseInt(time.split(':')[0]);
                          if (occupiedSlots.has(`${day}-${slotHour}`)) return null;

                          const showForFaculty = currentUser.role === 'faculty';
                          const showForCoordinator = currentUser.role === 'coordinator' && isBookableSlot(day, time);
                          
                          if (!showForFaculty && !showForCoordinator) return null;

                          return (
                              <div key={`${day}-${time}`} style={{ gridRow: timeIndex + 1 }}>
                                  <button
                                      onClick={() => onVacantSlotClick(day, time)}
                                      className="w-full h-full text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md hover:bg-green-100 dark:hover:bg-green-900/60 opacity-60 hover:opacity-100 transition"
                                  >
                                      Available
                                  </button>
                              </div>
                          )
                      })}

                      {/* Scheduled Events */}
                      {(schedule[day] || []).map(event => {
                          const conflict = conflicts.get(event.id);
                          return <MemoizedEventCard key={event.id} event={event} conflict={conflict} onClick={() => setSelectedEvent(event)} />;
                      })}
                  </div>
              </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Scheduler;