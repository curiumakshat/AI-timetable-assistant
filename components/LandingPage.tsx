
import React from 'react';
import { CalendarIcon } from './Icons';

interface LandingPageProps {
  onGoToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <CalendarIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Intelligent Timetable Assistant
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Effortlessly optimize academic schedules. Our AI-powered platform resolves conflicts, balances workloads, and manages resources, creating the perfect timetable for everyone.
        </p>
        <button
          onClick={onGoToLogin}
          className="bg-indigo-600 text-white font-semibold px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-transform transform hover:scale-105"
        >
          Get Started
        </button>
      </div>
       <div className="absolute bottom-4 text-gray-500 dark:text-gray-400 text-sm">
        Built for the 24-hour Intense Vibe Coding Hackathon.
      </div>
    </div>
  );
};

export default LandingPage;