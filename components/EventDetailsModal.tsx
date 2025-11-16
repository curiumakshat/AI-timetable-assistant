import React, { useState } from 'react';
import type { EventDetailsModalProps, AISuggestion, ScheduleEvent } from '../types';
import { getSubjectById, getFacultyById, getBatchById, getClassroomById, getClubById, getCoordinatorById } from '../database';
import { BookOpenIcon, UserIcon, CalendarIcon, RefreshCwIcon, XCircleIcon, CheckCircleIcon, SparklesIcon, MailIcon } from './Icons';

type ConfirmationDetails = {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor: 'red' | 'green' | 'indigo' | 'gray';
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, currentUser, onClose, onUpdateStatus, onApproveCancellation, onRejectCancellation, onRejectReschedule, onCancelClass, onFindRescheduleSuggestions, onCommitReschedule }) => {
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationDetails | null>(null);

    const isClubEvent = !!event.clubId;
    const subject = getSubjectById(event.subjectId);
    const faculty = getFacultyById(event.facultyId);
    const batch = getBatchById(event.batchId);
    const classroom = getClassroomById(event.classroomId);
    const club = getClubById(event.clubId);
    const coordinator = getCoordinatorById(event.coordinatorId);

    const isCancellationRequested = event.status === 'cancellation_requested';
    const isRescheduleRequested = event.status === 'reschedule_requested';

    const handleFacultyRescheduleClick = async () => {
        setIsRescheduling(true);
        setIsLoadingSuggestions(true);
        setError(null);
        try {
            const result = await onFindRescheduleSuggestions(event);
            setSuggestions(result);
        } catch (e: any) {
            setError(e.message || "Could not fetch suggestions.");
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: AISuggestion) => {
        onCommitReschedule(event.id, suggestion);
        onClose();
    };
    
    const resetViewState = () => {
        setIsRescheduling(false);
        setSuggestions(null);
        setIsLoadingSuggestions(false);
        setError(null);
        setConfirmation(null);
    };

    const renderConfirmationView = () => {
        if (!confirmation) return null;

        const colorClasses = {
            red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
            indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
            gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
        };

        return (
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{confirmation.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{confirmation.message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={resetViewState} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                        Cancel
                    </button>
                    <button onClick={confirmation.onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${colorClasses[confirmation.confirmColor]}`}>
                        {confirmation.confirmText}
                    </button>
                </div>
            </div>
        );
    };

    const renderFacultyActions = () => {
        if (isRescheduling) return renderRescheduleView();
        
        const actions = {
            approveCancellation: () => setConfirmation({
                title: 'Approve Cancellation',
                message: 'This will permanently remove the class from the schedule for everyone. This action cannot be undone.',
                confirmText: 'Approve & Remove',
                confirmColor: 'green',
                onConfirm: () => {
                    onApproveCancellation(event.id);
                    onClose();
                }
            }),
            cancelClass: () => setConfirmation({
                title: 'Confirm Cancellation',
                message: `This will permanently remove the class "${subject?.name || 'event'}" from the schedule.`,
                confirmText: 'Yes, Cancel Class',
                confirmColor: 'red',
                onConfirm: () => {
                    onCancelClass(event.id);
                    onClose();
                }
            })
        };

        if (isCancellationRequested) {
            return (
                <>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">Respond to Cancellation Request</h4>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button onClick={actions.approveCancellation} className="flex items-center justify-center bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition w-full">
                            <CheckCircleIcon className="w-5 h-5 mr-2" /> Approve
                        </button>
                        <button onClick={() => onRejectCancellation(event.id)} className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 transition w-full">
                            <XCircleIcon className="w-5 h-5 mr-2" /> Reject
                        </button>
                    </div>
                </>
            );
        }

        if (isRescheduleRequested) {
            return (
                <>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">Student has requested to reschedule</h4>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                         <button onClick={handleFacultyRescheduleClick} className="flex items-center justify-center bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition w-full">
                            <SparklesIcon className="w-5 h-5 mr-2" /> Find New Slot
                        </button>
                        <button onClick={() => onRejectReschedule(event.id)} className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 transition w-full">
                            <XCircleIcon className="w-5 h-5 mr-2" /> Reject Request
                        </button>
                    </div>
                </>
            );
        }

        return (
            <>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">Manage Class</h4>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button onClick={handleFacultyRescheduleClick} className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition w-full">
                        <RefreshCwIcon className="w-5 h-5 mr-2" /> Reschedule Class
                    </button>
                    <button onClick={actions.cancelClass} className="flex items-center justify-center bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 transition w-full">
                        <XCircleIcon className="w-5 h-5 mr-2" /> Cancel Class
                    </button>
                </div>
            </>
        );
    };

    const renderRescheduleView = () => (
        <>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                    {isLoadingSuggestions ? 'Finding available slots...' : 'Select a new slot'}
                </h4>
                <button onClick={resetViewState} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    Back
                </button>
            </div>
            {isLoadingSuggestions && (
                <div className="flex justify-center items-center h-24">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg text-sm">{error}</div>}
            {!isLoadingSuggestions && !error && (
                <div className="space-y-2">
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-3 rounded-lg transition">
                                <span className="font-semibold">{s.day}, {s.startTime}-{s.endTime}</span>
                                <span className="text-gray-600 dark:text-gray-400"> in Room {s.room}</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No alternative slots could be found.</p>
                    )}
                </div>
            )}
        </>
    );

    const renderDetailsView = () => {
        const handleStudentCancelRequest = () => setConfirmation({
            title: 'Request Cancellation',
            message: 'This will send a cancellation request to the faculty. Are you sure?',
            confirmText: 'Yes, Send Request',
            confirmColor: 'red',
            onConfirm: () => {
                onUpdateStatus(event.id, 'cancellation_requested');
                setConfirmation(null);
            }
        });
        const handleStudentRescheduleRequest = () => setConfirmation({
            title: 'Request Reschedule',
            message: 'This will send a reschedule request to the faculty. Are you sure?',
            confirmText: 'Yes, Send Request',
            confirmColor: 'indigo',
            onConfirm: () => {
                onUpdateStatus(event.id, 'reschedule_requested');
                setConfirmation(null);
            }
        });
        
        const handleCoordinatorCancel = () => setConfirmation({
            title: 'Cancel Club Event',
            message: `Are you sure you want to cancel "${event.eventName || 'this event'}"? This cannot be undone.`,
            confirmText: 'Yes, Cancel Event',
            confirmColor: 'red',
            onConfirm: () => {
                onCancelClass(event.id);
                onClose();
            }
        });

        const eventName = isClubEvent ? (event.eventName || club?.name) : subject?.name;
        const mainContact = isClubEvent ? coordinator : faculty;

        return (
            <>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{eventName || 'Event Details'}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{event.day}, {event.startTime} - {event.endTime}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Close">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {isCancellationRequested && (
                    <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-center">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            A cancellation has been requested for this class.
                        </p>
                    </div>
                )}

                {isRescheduleRequested && (
                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            A reschedule has been requested for this class.
                        </p>
                    </div>
                )}
                
                <div className="space-y-4 text-sm sm:text-base">
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-4 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{isClubEvent ? 'Coordinator' : 'Faculty'}</p>
                             <div className="flex items-center space-x-2">
                                <p className="text-gray-600 dark:text-gray-300">{mainContact?.name || 'N/A'}</p>
                                {mainContact?.email && (
                                    <a href={`mailto:${mainContact.email}`} title={`Email ${mainContact.name}`} className="text-gray-400 hover:text-indigo-500">
                                        <MailIcon className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {!isClubEvent && (
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <BookOpenIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-4 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">Batch</p>
                                <p className="text-gray-600 dark:text-gray-300">{batch?.name || 'N/A'}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-4 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Room</p>
                            <p className="text-gray-600 dark:text-gray-300">{classroom?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {currentUser.role === 'student' && !isClubEvent && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">Need to make a change?</h4>
                        <div className="flex flex-col sm:flex-row justify-center gap-3">
                            <button onClick={handleStudentRescheduleRequest} disabled={isRescheduleRequested || isCancellationRequested} className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 transition w-full disabled:opacity-50 disabled:cursor-not-allowed">
                                <RefreshCwIcon className="w-5 h-5 mr-2" />
                                {isRescheduleRequested ? 'Reschedule Requested' : 'Request Reschedule'}
                            </button>
                             <button onClick={handleStudentCancelRequest} disabled={isCancellationRequested || isRescheduleRequested} className="flex items-center justify-center bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 transition w-full disabled:opacity-50 disabled:cursor-not-allowed">
                                <XCircleIcon className="w-5 h-5 mr-2" />
                                {isCancellationRequested ? 'Cancellation Requested' : 'Cancel Lecture'}
                            </button>
                        </div>
                    </div>
                )}

                {currentUser.role === 'faculty' && !isClubEvent && currentUser.id === event.facultyId && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {renderFacultyActions()}
                  </div>
                )}
                
                {currentUser.role === 'coordinator' && isClubEvent && currentUser.id === event.coordinatorId && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleCoordinatorCancel} className="w-full flex items-center justify-center bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 transition">
                            <XCircleIcon className="w-5 h-5 mr-2" /> Cancel Event
                        </button>
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 sm:p-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
                {confirmation ? renderConfirmationView() : renderDetailsView()}
            </div>
        </div>
    );
};

export default EventDetailsModal;