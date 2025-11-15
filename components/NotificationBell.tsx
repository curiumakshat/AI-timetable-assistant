import React, { useState, useEffect, useRef } from 'react';
import type { NotificationBellProps } from '../types';
import { BellIcon } from './Icons';

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasUnread = notifications.some(n => !n.read);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            onOpen();
        }
    };
    
    const timeSince = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "min ago";
        return "Just now";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle notifications"
            >
                <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {hasUnread && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Notifications</h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{notification.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeSince(notification.timestamp)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">You have no new notifications.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
