import React, { useState, useMemo } from 'react';
import {
  FaSearch, FaTicketAlt, FaSpinner, FaChevronLeft, FaChevronRight,
  FaClock, FaArrowRight, FaBug, FaStop, FaCheckCircle, FaBookOpen,
  FaExclamationCircle,
} from 'react-icons/fa';
import { JiraIssue } from '../types/jira';
import { SubmissionHistory } from '../types/worklog';

interface TicketListProps {
  tickets: JiraIssue[];
  isLoading: boolean;
  onTicketSelect: (ticketKey: string) => void;
  submissionHistory?: SubmissionHistory[];
}

const TICKETS_PER_PAGE = 10;

const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  isLoading,
  onTicketSelect,
  submissionHistory = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Map of ticket key → most recent successful submission
  const lastSubmissionByTicket = useMemo(() => {
    const map = new Map<string, SubmissionHistory>();
    submissionHistory.forEach((sub) => {
      if (sub.success) {
        const existing = map.get(sub.ticketKey);
        if (!existing || new Date(sub.submittedAt) > new Date(existing.submittedAt)) {
          map.set(sub.ticketKey, sub);
        }
      }
    });
    return map;
  }, [submissionHistory]);

  // Recently logged: tickets from history that exist in the current ticket list
  const recentlyLoggedTickets = useMemo(() => {
    const ticketMap = new Map(tickets.map((t) => [t.key, t]));
    return Array.from(lastSubmissionByTicket.entries())
      .sort((a, b) => new Date(b[1].submittedAt).getTime() - new Date(a[1].submittedAt).getTime())
      .slice(0, 5)
      .map(([key, submission]) => ({ ticket: ticketMap.get(key), submission }))
      .filter((item): item is { ticket: JiraIssue; submission: SubmissionHistory } => !!item.ticket);
  }, [tickets, lastSubmissionByTicket]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.key.toLowerCase().includes(query) ||
        t.fields.summary.toLowerCase().includes(query) ||
        t.fields.status.name.toLowerCase().includes(query) ||
        t.fields.issuetype.name.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + TICKETS_PER_PAGE);

  // Reset to page 1 when search changes
  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  const getTypeIconConfig = (type: string, status: string) => {
    const s = status.toLowerCase();
    const t = type.toLowerCase();
    if (s.includes('done') || s.includes('complet') || s.includes('closed') || s.includes('finish')) {
      return { bg: 'bg-blue-500', Icon: FaCheckCircle };
    }
    if (t.includes('bug')) return { bg: 'bg-red-500', Icon: FaBug };
    if (t.includes('story')) return { bg: 'bg-green-500', Icon: FaBookOpen };
    return { bg: 'bg-orange-500', Icon: FaStop };
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('complet') || s.includes('closed')) return 'bg-green-100 text-green-700';
    if (s.includes('progress') || s.includes('development')) return 'bg-blue-100 text-blue-700';
    if (s.includes('review')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const renderTicketCard = (ticket: JiraIssue, submission?: SubmissionHistory) => {
    const { bg, Icon } = getTypeIconConfig(ticket.fields.issuetype.name, ticket.fields.status.name);
    const priority = ticket.fields.priority?.name || 'Normal';
    const component =
      ticket.fields.components?.[0]?.name || ticket.fields.labels?.[0] || '';
    const updatedTime = ticket.fields.updated ? getRelativeTime(ticket.fields.updated) : null;

    return (
      <div
        key={ticket.id}
        onClick={() => onTicketSelect(ticket.key)}
        className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group"
      >
        <div className="flex items-start gap-3">
          {/* Issue type icon */}
          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon className="text-white text-sm" />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: Key + status badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-blue-600 text-sm">{ticket.key}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeStyle(ticket.fields.status.name)}`}>
                {ticket.fields.status.name}
              </span>
            </div>

            {/* Row 2: Summary */}
            <p className="text-gray-900 font-medium text-sm leading-snug mb-1.5 line-clamp-2">
              {ticket.fields.summary}
            </p>

            {/* Row 3: Meta — updated time, priority, component */}
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {updatedTime && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-gray-400" />
                  {updatedTime}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FaExclamationCircle className="text-orange-400" />
                {priority}
              </span>
              {component && (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{component}</span>
              )}
            </div>
          </div>

          {/* Right side: logged badge + arrow */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
            {submission && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Logged {getRelativeTime(submission.submittedAt)}
              </span>
            )}
            <FaArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin text-2xl" />
          <span className="text-lg">Loading your tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <FaTicketAlt className="text-blue-600 text-xl" />
        <h2 className="text-xl font-bold text-gray-800">My Tickets</h2>
        <span className="ml-auto text-sm text-gray-500">
          {filteredTickets.length} of {tickets.length} tickets
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        View all your assigned Jira tickets. Click on a ticket to view worklogs and use AI to generate new ones.
      </p>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket key, summary, status, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Recently Logged Section */}
      {recentlyLoggedTickets.length > 0 && !searchQuery && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaClock className="text-gray-500 text-sm" />
            <h3 className="text-sm font-semibold text-gray-700">Recently Logged</h3>
          </div>
          <div className="space-y-2">
            {recentlyLoggedTickets.map(({ ticket, submission }) =>
              renderTicketCard(ticket, submission)
            )}
          </div>
        </div>
      )}

      {/* All Tickets */}
      <div className="space-y-2">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery.trim() ? (
              <>
                <p className="text-lg mb-2">No tickets found matching &quot;{searchQuery}&quot;</p>
                <p className="text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                <FaTicketAlt className="text-4xl mx-auto mb-2 opacity-50" />
                <p className="text-lg">No tickets assigned to you</p>
              </>
            )}
          </div>
        ) : (
          <>
            {paginatedTickets.map((ticket) =>
              renderTicketCard(ticket, lastSubmissionByTicket.get(ticket.key))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}–{Math.min(startIndex + TICKETS_PER_PAGE, filteredTickets.length)} of {filteredTickets.length} tickets
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded flex items-center gap-1 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <FaChevronLeft />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded flex items-center gap-1 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Next
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
