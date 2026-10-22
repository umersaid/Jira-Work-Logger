import axios, { AxiosInstance } from 'axios';
import { JiraIssue, JiraConfig, JiraWorklog, JiraWorklogEntry, IssueWorklogEntry } from '../types/jira';

class JiraApiService {
  private axiosInstance: AxiosInstance | null = null;
  private config: JiraConfig | null = null;

  /**
   * Initialize the Jira API client with configuration
   * Supports both Atlassian Cloud (API token) and Server/Data Center (username/password)
   * 
   * 🔧 CORS FIX: Uses proxy server (localhost:3001) to bypass browser CORS restrictions
   * - Run proxy: npm run proxy
   * - Proxy forwards requests to jira.carecloud.com
   * - Set useProxy = false to connect directly (requires CORS extension)
   */
  initialize(config: JiraConfig): void {
    this.config = config;
    
    const auth = btoa(`${config.username}:${config.password}`);
    const apiVersion = config.apiVersion || '2';
    const cleanDomain = config.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Route through Vite's built-in dev proxy (/jira-proxy/<domain>/...)
    // which forwards requests server-side — no CORS, no separate process needed.
    const baseURL = `/jira-proxy/${cleanDomain}/rest/api/${apiVersion}`;
    console.log('✅ Using Vite built-in CORS proxy:', baseURL);

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.axiosInstance || !this.config) {
      throw new Error('Jira API service not initialized. Please configure credentials first.');
    }
  }

  /**
   * Fetch a single Jira issue by key
   */
  async fetchIssue(issueKey: string): Promise<JiraIssue> {
    this.ensureInitialized();
    
    try {
      const response = await this.axiosInstance!.get(`/issue/${issueKey}`, {
        params: {
          fields: 'summary,description,issuetype,status,assignee,reporter,project,priority,components,labels,updated',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Jira API Error:', error);
      
      // Network error (CORS or connectivity)
      if (error.message === 'Network Error' || !error.response) {
        throw new Error(
          `Cannot connect to Jira at ${this.config?.domain}. Possible causes:\n` +
          `1. CORS blocked by browser (try CORS extension)\n` +
          `2. Not connected to VPN (if required)\n` +
          `3. Jira server unreachable\n` +
          `4. Check browser console (F12) for details`
        );
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Issue ${issueKey} not found. Please check the ticket number.`);
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your Jira credentials.');
      }
      throw new Error(`Failed to fetch issue: ${error.message}`);
    }
  }

  /**
   * Fetch all issues assigned to the current user
   */
  async fetchUserIssues(): Promise<JiraIssue[]> {
    this.ensureInitialized();
    
    try {
      const response = await this.axiosInstance!.get('/search', {
        params: {
          jql: 'assignee = currentUser() ORDER BY updated DESC',
          fields: 'summary,description,issuetype,status,assignee,project,priority,components,labels,updated',
          maxResults: 100,
        },
      });
      
      return response.data.issues || [];
    } catch (error: any) {
      console.error('Jira API Error:', error);
      
      // Network error (CORS or connectivity)
      if (error.message === 'Network Error' || !error.response) {
        throw new Error(
          `Cannot connect to Jira at ${this.config?.domain}. Possible causes:\n` +
          `1. CORS blocked by browser (try CORS extension)\n` +
          `2. Not connected to VPN (if required)\n` +
          `3. Jira server unreachable\n` +
          `4. Check browser console (F12) for details`
        );
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your Jira credentials.');
      }
      throw new Error(`Failed to fetch user issues: ${error.message}`);
    }
  }

  /**
   * Add a worklog entry to a Jira issue
   */
  async addWorklog(issueKey: string, worklog: JiraWorklog): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.axiosInstance!.post(`/issue/${issueKey}/worklog`, worklog);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Issue ${issueKey} not found.`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Jira credentials.');
      }
      throw new Error(`Failed to add worklog: ${error.message}`);
    }
  }

  /**
   * Fetch all worklogs created by the current user (last 60 days).
   * Uses JQL `worklogAuthor = currentUser()` and filters embedded worklogs
   * by matching the configured username / email against each worklog's author.
   */
  async fetchUserWorklogs(): Promise<JiraWorklogEntry[]> {
    this.ensureInitialized();
    const username = (this.config?.username || '').toLowerCase();

    try {
      // Fetch issues where current user has logged work in the last 60 days
      const response = await this.axiosInstance!.get('/search', {
        params: {
          jql: 'worklogAuthor = currentUser() AND worklogDate >= -60d ORDER BY updated DESC',
          fields: 'summary,worklog,project,status,issuetype',
          maxResults: 50,
        },
      });

      const issues: any[] = response.data.issues || [];
      const entries: JiraWorklogEntry[] = [];

      for (const issue of issues) {
        const worklogs: any[] = issue.fields?.worklog?.worklogs || [];
        for (const wl of worklogs) {
          const authorName = (wl.author?.name || '').toLowerCase();
          const authorEmail = (wl.author?.emailAddress || '').toLowerCase();
          const authorKey = (wl.author?.key || '').toLowerCase();
          // Match any of: username, email, or key
          if (
            authorName === username ||
            authorEmail === username ||
            authorKey === username
          ) {
            entries.push({
              issueKey: issue.key,
              issueSummary: issue.fields.summary,
              projectName: issue.fields.project?.name || issue.key.split('-')[0],
              projectKey: issue.fields.project?.key || '',
              issueStatus: issue.fields.status?.name || '',
              timeSpentSeconds: wl.timeSpentSeconds,
              started: wl.started,
            });
          }
        }
      }

      return entries.sort(
        (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
      );
    } catch (error: any) {
      console.error('Failed to fetch user worklogs:', error);
      // Non-fatal — return empty so dashboard still loads
      return [];
    }
  }

  /**
   * Fetch all worklogs for a specific issue.
   */
  async fetchIssueWorklogs(issueKey: string): Promise<IssueWorklogEntry[]> {
    this.ensureInitialized();
    try {
      const response = await this.axiosInstance!.get(`/issue/${issueKey}/worklog`, {
        params: { maxResults: 50 },
      });
      const worklogs: any[] = response.data.worklogs || [];
      return worklogs
        .map((wl: any) => ({
          id: wl.id,
          author: {
            displayName: wl.author?.displayName || '',
            name: wl.author?.name || '',
            emailAddress: wl.author?.emailAddress,
          },
          comment: wl.comment || '',
          started: wl.started,
          timeSpentSeconds: wl.timeSpentSeconds,
        }))
        .sort(
          (a: IssueWorklogEntry, b: IssueWorklogEntry) =>
            new Date(b.started).getTime() - new Date(a.started).getTime()
        );
    } catch (error: any) {
      console.error('Failed to fetch issue worklogs:', error);
      return [];
    }
  }

  /**
   * Fetch all worklogs for a specific issue.
   */
  async fetchIssueWorklogs(issueKey: string): Promise<IssueWorklogEntry[]> {
    this.ensureInitialized();
    try {
      const response = await this.axiosInstance!.get(`/issue/${issueKey}/worklog`, {
        params: { maxResults: 50 },
      });
      const worklogs: any[] = response.data.worklogs || [];
      return worklogs.map((wl: any) => ({
        id: wl.id,
        author: {
          displayName: wl.author?.displayName || '',
          name: wl.author?.name || '',
          emailAddress: wl.author?.emailAddress,
        },
        comment: wl.comment || '',
        started: wl.started,
        timeSpentSeconds: wl.timeSpentSeconds,
      }));
    } catch (error: any) {
      console.error('Failed to fetch issue worklogs:', error);
      return [];
    }
  }

  /**
   * Format date for Jira worklog (ISO 8601 format with timezone)
   */
  formatWorklogDate(date: Date): string {
    // Jira expects format: 2023-01-15T09:00:00.000+0000
    const isoString = date.toISOString();
    return isoString.replace('Z', '+0000');
  }

  /**
   * Convert hours to seconds for Jira worklog
   */
  hoursToSeconds(hours: number): number {
    return Math.round(hours * 3600);
  }
}

// Export singleton instance
export const jiraApi = new JiraApiService();
