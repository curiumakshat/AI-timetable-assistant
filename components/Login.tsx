
import React, { useState } from 'react';
import { CalendarIcon } from './Icons';
import type { UserRole } from '../App';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('faculty');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(activeTab);
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
                 <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('faculty')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'faculty' ? activeClass : inactiveClass}`}>
                        Faculty
                    </button>
                    <button onClick={() => setActiveTab('student')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'student' ? activeClass : inactiveClass}`}>
                        Student
                    </button>
                 </nav>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email address</label>
                  <div className="mt-1">
                      <input type="email" name="email" id="email" defaultValue={activeTab === 'faculty' ? 'e.reed@university.edu' : 'student.cs-a@university.edu'} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="you@example.com" required />
                  </div>
              </div>

              <div className="mt-4">
                  <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                  <div className="mt-1">
                      <input id="password" name="password" type="password" required defaultValue={activeTab === 'faculty' ? 'password' : 'password123'} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                  </div>
              </div>
              
              <div className="mt-8">
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