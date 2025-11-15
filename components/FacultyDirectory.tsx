
import React from 'react';
import type { Faculty } from '../types';
import { UserIcon, BookOpenIcon, MailIcon } from './Icons';
import { getSubjectById } from '../database';

interface FacultyDirectoryProps {
  faculty: Faculty[];
}

const FacultyDirectory: React.FC<FacultyDirectoryProps> = ({ faculty }) => {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Faculty Directory</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((member) => {
          // Fix: Get subject details using the helper function.
          const subject = getSubjectById(member.subjectId);
          return (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-4">
                  <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h4>
              </div>
              <div className="space-y-3">
                  <div className="flex items-start">
                      <BookOpenIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Subject</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{subject?.name || 'N/A'}</p>
                      </div>
                  </div>
                   <div className="flex items-center">
                      <MailIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
                       <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Contact</p>
                          <a href={`mailto:${member.email}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                              {member.email}
                          </a>
                      </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacultyDirectory;
