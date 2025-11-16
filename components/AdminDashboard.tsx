import React, { useState, useMemo } from 'react';
import { generateTimetables } from '../services/geminiService';
import { calculateScheduleMetrics } from '../utils';
import { SUBJECT_DATA, BATCH_DATA, CLASSROOM_DATA, FACULTY_DATA } from '../database';
import type { AdminDashboardProps, GeneratedTimetable, Schedule, ScheduleEvent } from '../types';
import { SparklesIcon, CheckCircleIcon } from './Icons';
import Scheduler from './Scheduler';

const groupScheduleByDay = (schedule: Schedule) => {
    return schedule.reduce((acc, event) => {
        const day = event.day;
        if (!acc[day]) acc[day] = [];
        acc[day]!.push(event);
        return acc;
    }, {} as { [key: string]: ScheduleEvent[] });
};

const MetricCard: React.FC<{ title: string; value: string | number; tooltip: string; lowerIsBetter?: boolean }> = ({ title, value, tooltip, lowerIsBetter = false }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow" title={tooltip}>
        <h4 className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</h4>
        <p className={`text-2xl font-bold ${lowerIsBetter ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{value}</p>
    </div>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onPublishTimetable, currentUser }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedTimetables, setGeneratedTimetables] = useState<GeneratedTimetable[]>([]);
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedTimetables([]);

        try {
            const results = await generateTimetables(SUBJECT_DATA, BATCH_DATA, CLASSROOM_DATA, FACULTY_DATA);
            const timetablesWithMetrics = results.map(result => {
                const scheduleWithIds = result.schedule.map((event, index) => ({
                    ...event,
                    id: `gen-${result.name}-${index}`
                }));
                return {
                    ...result,
                    schedule: scheduleWithIds,
                    metrics: calculateScheduleMetrics(scheduleWithIds),
                };
            });
            setGeneratedTimetables(timetablesWithMetrics);
            setSelectedTabIndex(0);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = () => {
        if (generatedTimetables[selectedTabIndex]) {
            onPublishTimetable(generatedTimetables[selectedTabIndex].schedule);
        }
    };
    
    const displayedSchedule = useMemo(() => {
        if (!generatedTimetables[selectedTabIndex]) return {};
        return groupScheduleByDay(generatedTimetables[selectedTabIndex].schedule);
    }, [generatedTimetables, selectedTabIndex]);
    
    const tabButtonClass = (isActive: boolean) => 
    `px-3 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 whitespace-nowrap ${
        isActive
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
    }`;


    return (
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Generate and manage the university's master timetable.</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Timetables...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Generate Timetable
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">{error}</div>}
            
            {!isLoading && generatedTimetables.length === 0 && !error && (
                 <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 mt-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Ready to build the perfect schedule?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">Click the "Generate Timetable" button to use the AI assistant to create multiple optimized versions of the university schedule based on different strategic goals.</p>
                </div>
            )}
            
            {generatedTimetables.length > 0 && (
                <div className="mt-6">
                    <div className="mb-4">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg flex flex-wrap items-center text-sm">
                            {generatedTimetables.map((tt, index) => (
                                <button key={tt.name} onClick={() => setSelectedTabIndex(index)} className={tabButtonClass(selectedTabIndex === index)}>
                                    {tt.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                            <div className="lg:col-span-1 space-y-4">
                               <h3 className="text-xl font-bold text-gray-900 dark:text-white">{generatedTimetables[selectedTabIndex].name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md">{generatedTimetables[selectedTabIndex].reasoning}</p>
                                <div className="space-y-3 pt-2">
                                    <MetricCard title="Room Utilization" value={`${generatedTimetables[selectedTabIndex].metrics.roomUtilizationScore}%`} tooltip="Percentage of available classroom hours that are scheduled." />
                                    <MetricCard title="Faculty Load Balance" value={generatedTimetables[selectedTabIndex].metrics.facultyLoadScore} tooltip="Measures the variation in teaching hours among faculty. Lower is better." lowerIsBetter />
                                    <MetricCard title="Student Overload" value={generatedTimetables[selectedTabIndex].metrics.studentOverloadInstances} tooltip="Number of times a student batch has more than 3 consecutive class hours." lowerIsBetter />
                                </div>
                                <button onClick={handlePublish} className="w-full flex items-center justify-center bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Publish This Timetable
                                </button>
                            </div>
                            <div className="lg:col-span-3">
                                 <Scheduler 
                                    schedule={displayedSchedule} 
                                    allEvents={generatedTimetables[selectedTabIndex].schedule}
                                    currentUser={{id: currentUser.id, role: 'admin'}}
                                    onEventStatusUpdate={() => {}}
                                    onApproveCancellation={() => {}}
                                    onRejectCancellation={() => {}}
                                    onRejectReschedule={() => {}}
                                    onCancelClass={() => {}}
                                    onFindRescheduleSuggestions={async () => []}
                                    onCommitReschedule={() => {}}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </main>
    );
};

export default AdminDashboard;
