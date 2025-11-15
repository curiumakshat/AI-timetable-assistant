import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Scheduler from './components/Scheduler';
import SchedulePrompt from './components/SchedulePrompt';
import AIAssistant from './components/AIAssistant';
import FacultyDirectory from './components/FacultyDirectory';
import { MASTER_SCHEDULE, FACULTY_DATA, BATCH_DATA, CLASSROOM_DATA, getClassroomById, getBatchById } from './database';
import type { Schedule, ScheduleEvent, DayOfWeek, DayGroupedSchedule, Faculty, Batch } from './types';

export type UserRole = 'faculty' | 'student';
type View = 'landing' | 'login' | 'dashboard';
type ScheduleView = 'personal' | 'batch' | 'room';
type CurrentUser = (Faculty & { role: 'faculty' }) | (Batch & { role: 'student' });

const groupScheduleByDay = (schedule: Schedule): DayGroupedSchedule => {
    return schedule.reduce((acc, event) => {
        const day = event.day;
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day]!.push(event);
        return acc;
    }, {} as DayGroupedSchedule);
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [masterSchedule, setMasterSchedule] = useState<Schedule>(MASTER_SCHEDULE);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [scheduleView, setScheduleView] = useState<ScheduleView>('personal');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(CLASSROOM_DATA[0].id);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(BATCH_DATA[0].id);

  const handleLogin = (userId: string, role: UserRole) => {
    if (role === 'faculty') {
        const facultyUser = FACULTY_DATA.find(f => f.id === userId);
        if (facultyUser) setCurrentUser({ ...facultyUser, role });
    } else {
        const studentUser = BATCH_DATA.find(b => b.id === userId);
        if (studentUser) setCurrentUser({ ...studentUser, role });
    }
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('login');
    setCurrentUser(null);
  };
  
  const handleGoToLogin = () => {
    setView('login');
  };

  const handleScheduleUpdate = (newEvent: ScheduleEvent) => {
    setMasterSchedule(prevSchedule => [...prevSchedule, newEvent]);
    alert('New class has been successfully added to the schedule!');
  };

  const handleBulkScheduleUpdate = (newEvents: Omit<ScheduleEvent, 'id'>[]) => {
    const eventsWithIds = newEvents.map((event, index) => ({
        ...event,
        id: `import-${Date.now()}-${index}`
    }));
    setMasterSchedule(prev => [...prev, ...eventsWithIds]);
  };

  const handleVacantSlotClick = (day: DayOfWeek, startTime: string) => {
    const endTime = `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`;
    let prompt;
    if (scheduleView === 'room') {
        const roomName = getClassroomById(selectedRoomId)?.name || 'the selected room';
        prompt = `I'd like to schedule a 1-hour class for batch [Batch Name] on ${day} from ${startTime} to ${endTime} in room ${roomName}.`;
    } else if (scheduleView === 'batch') {
        const batchName = getBatchById(selectedBatchId)?.name || '[Batch Name]';
        prompt = `I'd like to schedule a 1-hour class for ${batchName} on ${day} from ${startTime} to ${endTime} in classroom [Room Name].`;
    }
    else {
        prompt = `I'd like to schedule a 1-hour class for batch [Batch Name] on ${day} from ${startTime} to ${endTime} in classroom [Room Name].`;
    }
    setInitialPrompt(prompt);
    const promptTextarea = document.getElementById('schedule-prompt') as HTMLTextAreaElement;
    if (promptTextarea) {
        promptTextarea.focus();
        promptTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  const currentUserSchedule = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'faculty') {
        return masterSchedule.filter(event => event.facultyId === currentUser.id);
    }
    return masterSchedule.filter(event => event.batchId === currentUser.id);
  }, [currentUser, masterSchedule]);
  
  const roomSchedule = useMemo(() => {
    return masterSchedule.filter(event => event.classroomId === selectedRoomId);
  }, [selectedRoomId, masterSchedule]);

  const batchSchedule = useMemo(() => {
    return masterSchedule.filter(event => event.batchId === selectedBatchId);
  }, [selectedBatchId, masterSchedule]);

  const displayedSchedule = useMemo(() => {
    if (scheduleView === 'room') return roomSchedule;
    if (scheduleView === 'batch') return batchSchedule;
    return currentUserSchedule;
  }, [scheduleView, roomSchedule, batchSchedule, currentUserSchedule]);

  const dayGroupedDisplayedSchedule = useMemo(() => groupScheduleByDay(displayedSchedule), [displayedSchedule]);

  const scheduleTitle = useMemo(() => {
    if (scheduleView === 'room') {
        const roomName = getClassroomById(selectedRoomId)?.name;
        return roomName ? `Schedule for Room ${roomName}` : 'Room Schedule';
    }
    if (scheduleView === 'batch') {
        const batchName = getBatchById(selectedBatchId)?.name;
        return batchName ? `Schedule for ${batchName}` : 'Batch Schedule';
    }
    return currentUser ? `${currentUser.name}'s Weekly Schedule` : 'Weekly Schedule';
  }, [scheduleView, selectedRoomId, selectedBatchId, currentUser]);


  if (view === 'landing') {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }
  
  if (view === 'login' || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }
  
  const tabButtonClass = (isActive: boolean) => 
    `px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        isActive
            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow'
            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header userName={currentUser.name} userRole={currentUser.role} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-3xl font-bold capitalize">{scheduleTitle}</h2>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center text-sm">
                    <button onClick={() => setScheduleView('personal')} className={tabButtonClass(scheduleView === 'personal')}>
                        My Schedule
                    </button>
                    <button onClick={() => setScheduleView('batch')} className={tabButtonClass(scheduleView === 'batch')}>
                        Batch Schedule
                    </button>
                    <button onClick={() => setScheduleView('room')} className={tabButtonClass(scheduleView === 'room')}>
                        Room Schedule
                    </button>
                </div>
                {scheduleView === 'batch' && (
                    <div className="relative">
                        <select
                            id="batch-select"
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow"
                            aria-label="Select a batch"
                        >
                            {BATCH_DATA.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                )}
                {scheduleView === 'room' && (
                    <div className="relative">
                        <select
                            id="room-select"
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow"
                            aria-label="Select a room"
                        >
                            {CLASSROOM_DATA.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <Scheduler 
            schedule={dayGroupedDisplayedSchedule} 
            allEvents={masterSchedule}
            currentUser={{id: currentUser.id, role: currentUser.role}}
            onVacantSlotClick={currentUser.role === 'faculty' ? handleVacantSlotClick : undefined}
        />
        
        {currentUser.role === 'faculty' && (
           <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-1">
                    <SchedulePrompt
                        masterSchedule={masterSchedule}
                        currentUser={currentUser as Faculty}
                        onScheduleUpdate={handleScheduleUpdate}
                        onBulkScheduleUpdate={handleBulkScheduleUpdate}
                        initialPrompt={initialPrompt}
                    />
                </div>
                <div className="lg:col-span-1">
                    <AIAssistant
                        masterSchedule={masterSchedule}
                        currentUser={{id: currentUser.id, name: currentUser.name, role: currentUser.role}}
                    />
                </div>
              </div>
              <FacultyDirectory faculty={FACULTY_DATA} />
           </>
        )}
      </main>
    </div>
  );
};

export default App;