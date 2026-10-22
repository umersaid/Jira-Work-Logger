import { WorkItem } from '../types/worklog';

/**
 * Convert minutes to human-readable format (e.g., "2h 30m")
 */
export const formatTimeSpent = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

/**
 * Convert hours (decimal) to minutes
 */
export const hoursToMinutes = (hours: number): number => {
  return Math.round(hours * 60);
};

/**
 * Convert minutes to hours (decimal)
 */
export const minutesToHours = (minutes: number): number => {
  return Math.round((minutes / 60) * 100) / 100;
};

/**
 * Format work items into a markdown table for Jira
 */
export const formatWorkBreakdownTable = (items: WorkItem[], _totalHours: number): string => {
  const totalMinutes = items.reduce((sum, item) => sum + item.timeSpent, 0);
  
  let table = '| Sr. No | Description | Time Spent |\n';
  table += '|--------|-------------|------------|\n';
  
  items.forEach(item => {
    const timeStr = formatTimeSpent(item.timeSpent);
    // Escape pipe characters in descriptions
    const escapedDesc = item.description.replace(/\|/g, '\\|');
    table += `| ${item.srNo} | ${escapedDesc} | ${timeStr} |\n`;
  });
  
  table += `\n**Total Time:** ${formatTimeSpent(totalMinutes)} (${minutesToHours(totalMinutes)}h)`;
  
  return table;
};

/**
 * Parse time string (e.g., "2h 30m", "1.5h", "90m") to minutes
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  const trimmed = timeStr.trim().toLowerCase();
  
  // Match patterns like "2h 30m", "2h", "30m"
  const hhmm = /^(\d+)h\s*(\d+)m$/;
  const hoursOnly = /^(\d+(?:\.\d+)?)h$/;
  const minsOnly = /^(\d+)m$/;
  
  let match = trimmed.match(hhmm);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  
  match = trimmed.match(hoursOnly);
  if (match) {
    return Math.round(parseFloat(match[1]) * 60);
  }
  
  match = trimmed.match(minsOnly);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Try parsing as decimal hours
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return Math.round(num * 60);
  }
  
  return 0;
};
