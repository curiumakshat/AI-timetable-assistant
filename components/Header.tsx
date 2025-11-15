import React from 'react';
import { CalendarIcon, LogOutIcon } from './Icons';
import NotificationBell from './NotificationBell';
import type { HeaderProps } from '../types';

const Header: React.FC<HeaderProps> = ({ userName, userRole, onLogout, notifications, onMarkNotificationsAsRead }) => {
  return (
    <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Timetable Assistant
          </h1>
        </div>
        <div className="flex items-center space-x-4">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-200 rounded-lg">
                <span className="font-semibold">{userName}</span> (<span className="capitalize">{userRole}</span>)
            </div>
            <NotificationBell notifications={notifications} onOpen={onMarkNotificationsAsRead} />
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Logout">
                <LogOutIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
