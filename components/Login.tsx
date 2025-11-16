import React, { useState, useEffect } from 'react';
import { CalendarIcon } from './Icons';
import type { UserRole } from '../types';
import { FACULTY_DATA, BATCH_DATA, ADMIN_DATA, COORDINATOR_DATA } from '../database';

interface LoginProps {
  onLogin: (userId: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('faculty');
  const [selectedUserId, setSelectedUserId] = useState<string>(FACULTY_DATA[0].id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset selection and fields when tab changes
    if (activeTab === 'faculty') {
      setSelectedUserId(FACULTY_DATA[0].id);
    } else if (activeTab === 'student') {
      setSelectedUserId(BATCH_DATA[0].id);
    } else if (activeTab === 'admin') {
      setSelectedUserId(ADMIN_DATA[0].id);
    } else if (activeTab === 'coordinator') {
      setSelectedUserId(COORDINATOR_DATA[0].id);
    }
    setEmail('');
    setPassword('');
    setError(null);
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (activeTab === 'faculty') {
      const facultyUser = FACULTY_DATA.find(f => f.id === selectedUserId);
      if (facultyUser && facultyUser.email.toLowerCase() === email.trim().toLowerCase()) {
        onLogin(selectedUserId, activeTab);
      } else {
        setError('Email address does not match the selected faculty account.');
      }
    } else if (activeTab === 'coordinator') {
      const coordinatorUser = COORDINATOR_DATA.find(c => c.id === selectedUserId);
      if (coordinatorUser && coordinatorUser.email.toLowerCase() === email.trim().toLowerCase()) {
        onLogin(selectedUserId, activeTab);
      } else {
        setError('Email address does not match the selected coordinator account.');
      }
    } else {
      // Student and Admin login doesn't require email verification in this version
      onLogin(selectedUserId, activeTab);
    }
  };

  const activeClass = 'border-indigo-600 text-indigo-600 dark:text-indigo-400';
  const inactiveClass = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200';
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <CalendarIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Timetable Assistant
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            Please sign in to continue.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                 <nav className="-mb-px flex justify-around sm:justify-center sm:space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('faculty')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'faculty' ? activeClass : inactiveClass}`}>
                        Faculty
                    </button>
                    <button onClick={() => setActiveTab('student')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'student' ? activeClass : inactiveClass}`}>
                        Student
                    </button>
                    <button onClick={() => setActiveTab('coordinator')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'coordinator' ? activeClass : inactiveClass}`}>
                        Coordinator
                    </button>
                    <button onClick={() => setActiveTab('admin')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin' ? activeClass : inactiveClass}`}>
                        Admin
                    </button>
                 </nav>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {activeTab === 'faculty' && 'Select Faculty'}
                  {activeTab === 'student' && 'Select Batch'}
                  {activeTab === 'coordinator' && 'Select Coordinator'}
                  {activeTab === 'admin' && 'Select Admin'}
                </label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                >
                  {activeTab === 'faculty' && FACULTY_DATA.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                  {activeTab === 'student' && BATCH_DATA.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                  {activeTab === 'coordinator' && COORDINATOR_DATA.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                  {activeTab === 'admin' && ADMIN_DATA.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </div>

              {(activeTab === 'faculty' || activeTab === 'coordinator') && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Verification Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                      placeholder="e.g., name@university.edu"
                    />
                  </div>
                </div>
              )}

              <div>
                  <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                  <div className="mt-1">
                      <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                  </div>
              </div>
              
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                  Sign in
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Login;