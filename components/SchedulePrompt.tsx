
import React, { useState } from 'react';
import { getScheduleSuggestion } from '../services/geminiService';
import type { Schedule, AIResponse, ScheduleEvent } from '../types';
import { BotIcon, SparklesIcon } from './Icons';

interface SchedulePromptProps {
  facultySchedule: Schedule;
  studentSchedule: Schedule;
  onScheduleUpdate: (newEvent: ScheduleEvent) => void;
}

const SchedulePrompt: React.FC<SchedulePromptProps> = ({ facultySchedule, studentSchedule, onScheduleUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await getScheduleSuggestion(prompt, facultySchedule, studentSchedule);
      setResponse(result);
      if (result.isFeasible && result.newSchedule) {
        onScheduleUpdate({ ...result.newSchedule, id: `ai-${Date.now()}` });
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: AIResponse['suggestions'][0]) => {
      const newPrompt = `Schedule the class on ${suggestion.day} from ${suggestion.startTime} to ${suggestion.endTime} in room ${suggestion.room}. Original prompt: ${prompt}`;
      setPrompt(newPrompt);
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
               <BotIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          <div className="flex-1">
            <label htmlFor="schedule-prompt" className="text-lg font-semibold text-gray-800 dark:text-white">
              Schedule an Extra Class
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Describe the class you want to schedule. e.g., "I need to schedule a 1-hour makeup class for Advanced Algorithms (CS-A) this Friday afternoon."
            </p>
            <textarea
              id="schedule-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your request here..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              rows={3}
              disabled={loading}
            />
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
      
      {response && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">AI Assistant's Analysis:</h3>
            <div className={`p-4 rounded-lg ${response.isFeasible ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                <p className="text-gray-700 dark:text-gray-200">{response.reasoning}</p>
            </div>

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
