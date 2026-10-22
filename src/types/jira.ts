// Jira API types
export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
      iconUrl?: string;
    };
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    project: {
      key: string;
      name: string;
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    components?: Array<{ name: string }>;
    labels?: string[];
    updated?: string;
  };
}

export interface JiraWorklog {
  started: string; // ISO 8601 format
  timeSpentSeconds: number;
  comment: string;
}

export interface IssueWorklogEntry {
  id: string;
  author: {
    displayName: string;
    name: string;
    emailAddress?: string;
  };
  comment: string;
  started: string;
  timeSpentSeconds: number;
}

// A single worklog entry fetched from Jira (actual data, not local history)
export interface JiraWorklogEntry {
  issueKey: string;
  issueSummary: string;
  projectName: string;
  projectKey: string;
  issueStatus: string;
  timeSpentSeconds: number;
  started: string; // ISO date from Jira e.g. "2024-05-14T09:00:00.000+0000"
}

export interface JiraConfig {
  domain: string;
  username: string; // Can be email for Cloud or username for Server
  password: string; // Can be API token for Cloud or password for Server
  apiVersion?: '2' | '3'; // Default: auto-detect
}

export interface JiraSavedConfig {
  domain: string;
  username: string;
  apiVersion?: '2' | '3';
}
