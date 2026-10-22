import { JiraSavedConfig } from '../types/jira';
import { SubmissionHistory } from '../types/worklog';

const STORAGE_KEYS = {
  JIRA_CONFIG: 'jira_config',
  SUBMISSION_HISTORY: 'submission_history',
  OPENAI_KEY: 'openai_key',
};

// Jira Configuration — saves domain, username, and (optionally) password
export const saveJiraConfig = (domain: string, username: string, apiVersion?: '2' | '3', password?: string): void => {
  const config: JiraSavedConfig & { password?: string } = { domain, username, apiVersion, password };
  localStorage.setItem(STORAGE_KEYS.JIRA_CONFIG, JSON.stringify(config));
};

export const getJiraConfig = (): (JiraSavedConfig & { password?: string }) | null => {
  const data = localStorage.getItem(STORAGE_KEYS.JIRA_CONFIG);
  return data ? JSON.parse(data) : null;
};

// Submission History
export const saveSubmissionHistory = (submission: SubmissionHistory): void => {
  const history = getSubmissionHistory();
  history.unshift(submission);
  // Keep only last 50 submissions
  const trimmedHistory = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.SUBMISSION_HISTORY, JSON.stringify(trimmedHistory));
};

export const getSubmissionHistory = (): SubmissionHistory[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSION_HISTORY);
  if (!data) return [];
  
  const history = JSON.parse(data);
  // Convert date strings back to Date objects
  return history.map((item: any) => ({
    ...item,
    submittedAt: new Date(item.submittedAt),
  }));
};

export const saveOpenAIKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEYS.OPENAI_KEY, key);
};

export const getOpenAIKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.OPENAI_KEY);
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
