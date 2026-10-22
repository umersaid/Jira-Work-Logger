// Work breakdown types
export interface WorkItem {
  id: string;
  srNo: number;
  description: string;
  timeSpent: number; // in minutes
  complexity?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface DayWorkPlan {
  date: Date;
  items: WorkItem[];
  totalHours: number;
}

export interface WorkBreakdown {
  ticketKey: string;
  totalHours: number;
  workDate: string; // ISO date string
  items: WorkItem[];
  generatedAt: Date;
}

export interface AIGeneratedWork {
  description: string;
  complexity: 'low' | 'medium' | 'high';
  category: string;
  suggestedTimeMinutes: number;
}

export interface SubmissionHistory {
  id: string;
  ticketKey: string;
  workDate: string;
  totalHours: number;
  itemCount: number;
  submittedAt: Date;
  success: boolean;
  error?: string;
}
