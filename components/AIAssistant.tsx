import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/geminiService';
import type { Schedule, ChatMessage, AIAssistantProps } from '../types';
import { BotIcon, UserIcon, SendIcon } from './Icons';

const AIAssistant: React.FC<AIAssistantProps> = ({ masterSchedule, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${currentUser.name}! How can I help you with the schedule today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await askAI(input, masterSchedule, currentUser);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
      "What's my first class on Monday?",
      "Are there any free lab rooms on Friday afternoon?",
      "Which faculty teaches Compilers?",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
            <BotIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Assistant</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything about the schedule!</p>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && <BotIcon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-1" />}
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && <UserIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />}
          </div>
        ))}
         {loading && (
             <div className="flex items-start gap-3">
                 <BotIcon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-1" />
                 <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                 </div>
             </div>
         )}
        <div ref={chatEndRef} />
      </div>
      
      {messages.length === 1 && currentUser.role !== 'coordinator' && (
          <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                  {examplePrompts.map(prompt => (
                      <button 
                          key={prompt} 
                          onClick={() => setInput(prompt)}
                          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                          {prompt}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., How many classes today?"
            className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-r-lg disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;