import React from 'react';
import { FaPlus, FaTrash, FaSync } from 'react-icons/fa';
import { WorkItem } from '../types/worklog';
import { formatTimeSpent, parseTimeToMinutes } from '../utils/tableFormatter';

interface WorkBreakdownTableProps {
  items: WorkItem[];
  onItemsChange: (items: WorkItem[]) => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export const WorkBreakdownTable: React.FC<WorkBreakdownTableProps> = ({
  items,
  onItemsChange,
  onRegenerate,
  isLoading,
}) => {
  const handleDescriptionChange = (id: string, newDescription: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, description: newDescription } : item
    );
    onItemsChange(updated);
  };

  const handleTimeChange = (id: string, newTimeStr: string) => {
    const minutes = parseTimeToMinutes(newTimeStr);
    if (minutes > 0) {
      const updated = items.map((item) =>
        item.id === id ? { ...item, timeSpent: minutes } : item
      );
      onItemsChange(updated);
    }
  };

  const handleAddRow = () => {
    const newItem: WorkItem = {
      id: `work-item-${Date.now()}`,
      srNo: items.length + 1,
      description: 'New work item',
      timeSpent: 30, // 30 minutes default
      complexity: 'medium',
      category: 'Development',
    };
    
    // Update serial numbers
    const updated = [...items, newItem].map((item, index) => ({
      ...item,
      srNo: index + 1,
    }));
    
    onItemsChange(updated);
  };

  const handleDeleteRow = (id: string) => {
    if (items.length <= 1) {
      alert('Cannot delete the last item. You must have at least one work item.');
      return;
    }
    
    const updated = items
      .filter((item) => item.id !== id)
      .map((item, index) => ({
        ...item,
        srNo: index + 1,
      }));
    
    onItemsChange(updated);
  };

  const totalMinutes = items.reduce((sum, item) => sum + item.timeSpent, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Work Breakdown</h2>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:bg-gray-400"
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left w-20">
                Sr. No
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Description
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left w-32">
                Time Spent
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                  {item.srNo}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleDescriptionChange(item.id, e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="text"
                    value={formatTimeSpent(item.timeSpent)}
                    onChange={(e) => handleTimeChange(item.id, e.target.value)}
                    placeholder="e.g., 2h 30m"
                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    onClick={() => handleDeleteRow(item.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete row"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-4 py-2" colSpan={2}>
                Total
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {formatTimeSpent(totalMinutes)} ({totalHours}h)
              </td>
              <td className="border border-gray-300 px-4 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        onClick={handleAddRow}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
      >
        <FaPlus />
        Add Row
      </button>
    </div>
  );
};
