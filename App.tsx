import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Scheduler from './components/Scheduler';
import SchedulePrompt from './components/SchedulePrompt';
import AIAssistant from './components/AIAssistant';
import FacultyDirectory from './components/FacultyDirectory';
import { MASTER_SCHEDULE, FACULTY_DATA, BATCH_DATA } from './database';
import type { Schedule, ScheduleEvent, DayOfWeek, DayGroupedSchedule, Faculty, Batch } from './types';

export type UserRole = 'faculty' | 'student';
type View = 'landing' | 'login' | 'dashboard';
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

  const handleVacantSlotClick = (day: DayOfWeek, startTime: string) => {
    const endTime = `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`;
    const prompt = `I'd like to schedule a 1-hour class for batch [Batch ID] on ${day} from ${startTime} to ${endTime} in classroom [Room ID].`;
    setInitialPrompt(prompt);
    document.getElementById('schedule-prompt')?.focus();
  };
  
  const currentUserSchedule = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'faculty') {
        return masterSchedule.filter(event => event.facultyId === currentUser.id);
    }
    return masterSchedule.filter(event => event.batchId === currentUser.id);
  }, [currentUser, masterSchedule]);

  const dayGroupedCurrentUserSchedule = useMemo(() => groupScheduleByDay(currentUserSchedule), [currentUserSchedule]);

  if (view === 'landing') {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }
  
  if (view === 'login' || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header userName={currentUser.name} userRole={currentUser.role} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold mb-4 capitalize">{currentUser.name}'s Weekly Schedule</h2>
        <Scheduler 
            schedule={dayGroupedCurrentUserSchedule} 
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