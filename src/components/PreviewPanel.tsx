import React, { useState } from 'react';
import { FaEye, FaPaperPlane } from 'react-icons/fa';
import { WorkItem } from '../types/worklog';
import { formatWorkBreakdownTable } from '../utils/tableFormatter';

interface PreviewPanelProps {
  ticketKey: string;
  workDate: Date;
  totalHours: number;
  items: WorkItem[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  ticketKey,
  workDate,
  totalHours,
  items,
  onSubmit,
  isSubmitting,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const markdownTable = formatWorkBreakdownTable(items, totalHours);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Submit to Jira</h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Ticket:</span>{' '}
            <span className="text-gray-900">{ticketKey}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date:</span>{' '}
            <span className="text-gray-900">
              {workDate.toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Hours:</span>{' '}
            <span className="text-gray-900">{totalHours}h</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Work Items:</span>{' '}
            <span className="text-gray-900">{items.length}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <FaEye />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white font-medium transition-all ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-[1.02]'
          }`}
        >
          <FaPaperPlane className={isSubmitting ? 'animate-bounce' : ''} />
          {isSubmitting ? 'Submitting...' : 'Submit Worklog'}
        </button>
      </div>

      {showPreview && (
        <div className="mt-4 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            Markdown Preview (as it will appear in Jira):
          </h3>
          <pre className="text-xs bg-white p-4 rounded border border-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
            {markdownTable}
          </pre>
        </div>
      )}
    </div>
  );
};
