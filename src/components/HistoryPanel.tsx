import React, { useState, useEffect } from 'react';
import { FaHistory, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { SubmissionHistory } from '../types/worklog';
import { getSubmissionHistory } from '../utils/storage';

export const HistoryPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<SubmissionHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = getSubmissionHistory();
    setHistory(savedHistory);
  };

  // Refresh history when panel opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <FaHistory className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Submission History ({history.length})
          </h2>
        </div>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded-lg border ${
                entry.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {entry.ticketKey}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        entry.success
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {entry.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>
                      Work Date: {new Date(entry.workDate).toLocaleDateString()}
                    </div>
                    <div>
                      Total: {entry.totalHours}h | Items: {entry.itemCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted: {entry.submittedAt.toLocaleString()}
                    </div>
                  </div>
                  {entry.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {entry.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
