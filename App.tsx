
import React, { useState } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Scheduler from './components/Scheduler';
import SchedulePrompt from './components/SchedulePrompt';
import AIAssistant from './components/AIAssistant';
import { FACULTY_SCHEDULE, STUDENT_SCHEDULE } from './constants';
import type { Schedule, ScheduleEvent } from './types';

export type UserRole = 'faculty' | 'student';
type View = 'landing' | 'login' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [userRole, setUserRole] = useState<UserRole>('faculty');
  const [facultySchedule, setFacultySchedule] = useState<Schedule>(FACULTY_SCHEDULE);
  const [studentSchedule, setStudentSchedule] = useState<Schedule>(STUDENT_SCHEDULE);

  // Derive currentSchedule directly from state. This is cleaner and avoids sync issues.
  const currentSchedule = userRole === 'faculty' ? facultySchedule : studentSchedule;

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('login');
    setUserRole('faculty'); 
  };
  
  const handleGoToLogin = () => {
    setView('login');
  };

  const handleScheduleUpdate = (newEvent: ScheduleEvent) => {
    const addEventToSchedule = (prevSchedule: Schedule): Schedule => {
      const daySchedule = prevSchedule[newEvent.day] || [];
      return {
        ...prevSchedule,
        [newEvent.day]: [...daySchedule, newEvent],
      };
    };
    // When faculty adds a class, it affects both their schedule and the student's schedule
    setFacultySchedule(addEventToSchedule);
    setStudentSchedule(addEventToSchedule);
  };
  
  if (view === 'landing') {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }
  
  if (view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header userRole={userRole} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold mb-4 capitalize">{userRole}'s Weekly Schedule</h2>
        <Scheduler schedule={currentSchedule} />
        
        {userRole === 'faculty' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-1">
                    <SchedulePrompt
                        facultySchedule={facultySchedule}
                        studentSchedule={studentSchedule}
                        onScheduleUpdate={handleScheduleUpdate}
                    />
                </div>
                <div className="lg:col-span-1">
                    <AIAssistant
                        facultySchedule={facultySchedule}
                        studentSchedule={studentSchedule}
                        userRole={userRole}
                    />
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;