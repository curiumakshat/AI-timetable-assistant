
import React from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import type { Schedule, ScheduleEvent, DayOfWeek } from '../types';

interface SchedulerProps {
  schedule: Schedule;
}

const getEventGridPosition = (event: ScheduleEvent) => {
  const startHour = parseInt(event.startTime.split(':')[0], 10);
  const endHour = parseInt(event.endTime.split(':')[0], 10);
  
  const startRow = TIME_SLOTS.indexOf(`${String(startHour).padStart(2, '0')}:00`) + 2;
  const duration = endHour - startHour;

  if (startRow === 1 || duration <= 0) return {};

  return {
    gridRowStart: startRow,
    gridRowEnd: startRow + duration,
  };
};

const EventCard: React.FC<{ event: ScheduleEvent }> = ({ event }) => {
  const duration = parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0]);
  const bgColor = duration > 1 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-blue-100 dark:bg-blue-900/50';
  const borderColor = duration > 1 ? 'border-indigo-400' : 'border-blue-400';

  return (
      <div 
        className={`p-2 rounded-lg border-l-4 ${borderColor} ${bgColor} text-gray-800 dark:text-gray-200 overflow-hidden text-xs md:text-sm`}
        style={getEventGridPosition(event)}
      >
        <p className="font-bold truncate">{event.subject}</p>
        <p className="text-gray-600 dark:text-gray-400">{event.faculty}</p>
        <p className="text-gray-600 dark:text-gray-400">Room: {event.room}</p>
        <p className="text-gray-500 dark:text-gray-500 hidden md:block">{event.startTime} - {event.endTime}</p>
      </div>
  );
};


const Scheduler: React.FC<SchedulerProps> = ({ schedule }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="grid grid-cols-6 grid-rows-[auto_repeat(9,1fr)] gap-2 min-h-[80vh]">
        {/* Time column */}
        <div className="col-start-1 row-start-1"></div>
        {TIME_SLOTS.map((time, index) => (
          <div key={time} className="text-right text-xs sm:text-sm text-gray-500 dark:text-gray-400 pr-2" style={{ gridRow: index + 2 }}>
            {time}
          </div>
        ))}

        {/* Header row */}
        {DAYS_OF_WEEK.map((day, index) => (
          <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-200 pb-2 col-start-2" style={{ gridColumn: index + 2 }}>
            {day}
          </div>
        ))}
        
        {/* Grid lines and content */}
        {DAYS_OF_WEEK.map((day, dayIndex) => (
            <div key={day} className="col-start-2 relative" style={{ gridColumn: dayIndex + 2, gridRow: '2 / span 9'}}>
                 <div className="grid grid-rows-9 h-full border-l border-gray-200 dark:border-gray-700">
                    {TIME_SLOTS.slice(0, -1).map((_, i) => <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700"></div>)}
                </div>
                <div className="absolute inset-0 grid grid-rows-9">
                    {(schedule[day] || []).map(event => <EventCard key={event.id} event={event} />)}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Scheduler;
