import React, { useState, useEffect, useRef } from 'react';
import { getScheduleSuggestion } from '../services/geminiService';
import type { Schedule, AIResponse, ScheduleEvent, SchedulePromptProps, Faculty, DayOfWeek } from '../types';
import { getSubjectById, getBatchById, getClassroomById, BATCH_DATA, SUBJECT_DATA, CLASSROOM_DATA } from '../database';
import { BotIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, PlusCircleIcon, UploadCloudIcon } from './Icons';

declare var XLSX: any;

interface QuickRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: Faculty;
    onSubmit: (prompt: string) => void;
}

const QuickRequestModal: React.FC<QuickRequestModalProps> = ({ isOpen, onClose, currentUser, onSubmit }) => {
    const [selectedBatchId, setSelectedBatchId] = useState<string>(BATCH_DATA[0].id);
    const [duration, setDuration] = useState<number>(1);

    const handleSubmit = () => {
        const subject = getSubjectById(currentUser.subjectId);
        const batch = getBatchById(selectedBatchId);
        if (!subject || !batch) return;

        const durationText = duration === 1 ? '1-hour' : '2-hour';
        const prompt = `I need to schedule a ${durationText} extra class for my subject, ${subject.name}, for batch ${batch.name}. Please find a suitable slot this week.`;
        
        onSubmit(prompt);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quickly Find an Extra Class Slot</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="batch-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Student Batch</label>
                        <select
                            id="batch-select"
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            {BATCH_DATA.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="duration-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Class Duration</label>
                        <select
                            id="duration-select"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            <option value={1}>1 Hour</option>
                            <option value={2}>2 Hours</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} type="button" className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Find Slot
                    </button>
                </div>
            </div>
        </div>
    );
};


const AnalysisReport: React.FC<{ reasoning: string }> = ({ reasoning }) => {
    const items = reasoning.split('\n').filter(line => line.trim().startsWith('-'));
    return (
        <ul className="space-y-2 text-sm">
            {items.map((item, index) => {
                const isConflict = item.includes('CONFLICT');
                const text = item.replace(/-\s*/, '');
                return (
                    <li key={index} className={`flex items-start ${isConflict ? 'text-amber-800 dark:text-amber-200' : 'text-green-800 dark:text-green-200'}`}>
                        {isConflict 
                            ? <XCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-amber-500" /> 
                            : <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" />
                        }
                        <span>{text}</span>
                    </li>
                );
            })}
        </ul>
    );
};

const SchedulePrompt: React.FC<SchedulePromptProps> = ({ masterSchedule, currentUser, onScheduleUpdate, onBulkScheduleUpdate, initialPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposedSchedule, setProposedSchedule] = useState<Omit<ScheduleEvent, 'id'> | null>(null);
  const [isQuickRequestModalOpen, setQuickRequestModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');


  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault();
    const activePrompt = promptOverride || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setProposedSchedule(null);
    setUploadStatus('idle');

    try {
      const result = await getScheduleSuggestion(activePrompt, masterSchedule, currentUser);
      setResponse(result);
      if (result.isFeasible && result.newSchedule) {
        setProposedSchedule(result.newSchedule);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuickRequest = (generatedPrompt: string) => {
      setPrompt(generatedPrompt);
      handleSubmit(undefined, generatedPrompt);
  };

  const handleConfirmAdd = () => {
    if (proposedSchedule) {
      onScheduleUpdate({ ...proposedSchedule, id: `ai-${Date.now()}` });
      setResponse(null);
      setProposedSchedule(null);
      setPrompt('');
    }
  };
  
  const handleSuggestionClick = (suggestion: AIResponse['suggestions'][0]) => {
      const newPrompt = `Schedule the class on ${suggestion.day} from ${suggestion.startTime} to ${suggestion.endTime} in room ${suggestion.room}. Original prompt was about: ${prompt}`;
      setPrompt(newPrompt);
      handleSubmit(undefined, newPrompt);
  }

  const handleImportClick = () => {
    setUploadStatus('idle');
    setResponse(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('processing');
    setUploadMessage('Reading and validating your Excel file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("The Excel sheet is empty.");
        }
        
        const newEvents: Omit<ScheduleEvent, 'id'>[] = [];
        const errors: string[] = [];

        json.forEach((row, index) => {
          const { Day, 'Start Time': startTime, 'End Time': endTime, Subject, Batch, Room } = row;

          if (!Day || !startTime || !endTime || !Subject || !Batch || !Room) {
            errors.push(`Row ${index + 2}: Missing required columns (Day, Start Time, End Time, Subject, Batch, Room).`);
            return;
          }
          
          const subject = SUBJECT_DATA.find(s => s.name.toLowerCase() === String(Subject).trim().toLowerCase());
          const batch = BATCH_DATA.find(b => b.name.toLowerCase() === String(Batch).trim().toLowerCase());
          const classroom = CLASSROOM_DATA.find(c => c.name.toLowerCase() === String(Room).trim().toLowerCase());
          let rowHasError = false;

          if (!subject) {
            errors.push(`Row ${index + 2}: Subject "${Subject}" not found.`);
            rowHasError = true;
          }
          if (!batch) {
            errors.push(`Row ${index + 2}: Batch "${Batch}" not found.`);
            rowHasError = true;
          }
          if (!classroom) {
            errors.push(`Row ${index + 2}: Room "${Room}" not found.`);
            rowHasError = true;
          }

          if (!rowHasError) {
              newEvents.push({
                subjectId: subject!.id,
                facultyId: currentUser.id, // Current logged in faculty
                batchId: batch!.id,
                classroomId: classroom!.id,
                day: Day as DayOfWeek,
                startTime: String(startTime),
                endTime: String(endTime),
              });
          }
        });

        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }

        onBulkScheduleUpdate(newEvents);
        setUploadStatus('success');
        setUploadMessage(`Successfully imported ${newEvents.length} classes from ${file.name}.`);

      } catch (err: any) {
        setUploadStatus('error');
        setUploadMessage(`Import failed: ${err.message}`);
      } finally {
          if (event.target) {
              event.target.value = '';
          }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const ProposedScheduleDetails: React.FC<{ schedule: Omit<ScheduleEvent, 'id'> }> = ({ schedule }) => {
    const subject = getSubjectById(schedule.subjectId)?.name || 'N/A';
    const batch = getBatchById(schedule.batchId)?.name || 'N/A';
    const classroom = getClassroomById(schedule.classroomId)?.name || 'N/A';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1 mb-4 border border-gray-200 dark:border-gray-700">
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>Batch:</strong> {batch}</p>
        <p><strong>Time:</strong> {schedule.day}, {schedule.startTime} - {schedule.endTime}</p>
        <p><strong>Room:</strong> {classroom}</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
       <QuickRequestModal 
            isOpen={isQuickRequestModalOpen}
            onClose={() => setQuickRequestModalOpen(false)}
            currentUser={currentUser}
            onSubmit={handleQuickRequest}
        />
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
               <BotIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <label htmlFor="schedule-prompt" className="text-lg font-semibold text-gray-800 dark:text-white">
                    Add New Class to Timetable
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use natural language, quick request, or import a file.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleImportClick}
                        className="flex-shrink-0 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg transition text-sm"
                        >
                        <UploadCloudIcon className="w-5 h-5 text-indigo-500"/>
                        <span>Import Timetable</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setQuickRequestModalOpen(true)}
                        className="flex-shrink-0 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-lg transition text-sm"
                        >
                        <SparklesIcon className="w-5 h-5 text-indigo-500"/>
                        <span>Quick Request</span>
                    </button>
                </div>
            </div>
            <textarea
              id="schedule-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I need a 1-hour makeup class for Advanced Algorithms for batch CS-A..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              rows={3}
              disabled={loading}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">To import, your Excel file must have columns: Day, Start Time, End Time, Subject, Batch, Room.</p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
                <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Schedule
                </>
            )}
          </button>
        </div>
      </form>
      {error && <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">{error}</div>}
      
      {uploadStatus !== 'idle' && (
        <div className="mt-4 p-4 rounded-lg flex items-start space-x-3"
            role="alert"
            aria-live="assertive"
        >
          {uploadStatus === 'processing' && <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          {uploadStatus === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
          {uploadStatus === 'error' && <XCircleIcon className="h-5 w-5 text-red-500" />}
          <p className={`text-sm whitespace-pre-wrap ${uploadStatus === 'success' ? 'text-green-800 dark:text-green-200' : uploadStatus === 'error' ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
            {uploadMessage}
          </p>
        </div>
      )}

      {response && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">AI Assistant's Analysis:</h3>
            <div className={`p-4 rounded-lg ${response.isFeasible ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                <AnalysisReport reasoning={response.reasoning} />
            </div>

            {response.isFeasible && proposedSchedule && (
              <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Ready to Schedule?</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  The AI has found a valid slot. Please confirm the details below before adding it to the master schedule.
                </p>
                <ProposedScheduleDetails schedule={proposedSchedule} />
                <button 
                  onClick={handleConfirmAdd}
                  className="flex items-center justify-center bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition w-full sm:w-auto"
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2" />
                  Confirm & Add to Schedule
                </button>
              </div>
            )}

            {!response.isFeasible && response.suggestions.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Here are some alternative slots:</h4>
                    <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSuggestionClick(s)}
                                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                {s.day}, {s.startTime}-{s.endTime} (Room {s.room})
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

    </div>
  );
};

export default SchedulePrompt;