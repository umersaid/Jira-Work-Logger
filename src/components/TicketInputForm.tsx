import React, { useState } from 'react';
import { FaMagic, FaTicketAlt } from 'react-icons/fa';
import { format } from 'date-fns';

interface TicketInputFormProps {
  onGenerate: (ticketKey: string, totalHours: number, workDate: Date, workDescription: string) => void;
  isLoading: boolean;
  initialTicketKey?: string;
}

export const TicketInputForm: React.FC<TicketInputFormProps> = ({
  onGenerate,
  isLoading,
  initialTicketKey = '',
}) => {
  const [ticketKey, setTicketKey] = useState(initialTicketKey);
  const [totalHours, setTotalHours] = useState('8');
  const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workDescription, setWorkDescription] = useState('');

  // Update ticket key when initialTicketKey changes
  React.useEffect(() => {
    if (initialTicketKey) {
      setTicketKey(initialTicketKey);
    }
  }, [initialTicketKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketKey.trim()) {
      alert('Please enter a ticket number');
      return;
    }

    const hours = parseFloat(totalHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      alert('Please enter valid hours (0-24)');
      return;
    }

    const date = new Date(workDate);
    if (isNaN(date.getTime())) {
      alert('Please enter a valid date');
      return;
    }

    onGenerate(ticketKey.trim().toUpperCase(), hours, date, workDescription.trim());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaTicketAlt className="text-blue-600 text-xl" />
        <h2 className="text-xl font-bold text-gray-800">Work Log Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jira Ticket Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., PROJ-123"
            value={ticketKey}
            onChange={(e) => setTicketKey(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the Jira issue key (e.g., PROJ-123, DEV-456)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What did you work on? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Describe your work in your own words... e.g., 'Fixed the login bug, updated the database schema, wrote unit tests'"
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            ✨ Leave blank to let AI use the ticket's title &amp; description automatically
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Hours Worked <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              disabled={isLoading}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md font-medium text-white transition-all ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02]'
          }`}
        >
          <FaMagic className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Generating...' : 'Generate Work Breakdown'}
        </button>
      </form>
    </div>
  );
};
