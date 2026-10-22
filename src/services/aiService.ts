import { JiraIssue, IssueWorklogEntry } from '../types/jira';
import { AIGeneratedWork, DayWorkPlan } from '../types/worklog';
import { allocateTime } from './timeAllocator';
import { generateWorkDescriptionPrompt } from '../prompts/workDescriptionPrompt';
import { getOpenAIKey } from '../utils/storage';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

class AIService {
  /**
   * Generate work descriptions using OpenAI
   */
  async generateWorkDescriptions(
    issue: JiraIssue,
    totalHours: number,
    userWorkDescription: string,
    dayContext?: string,
    prevWorklogs?: IssueWorklogEntry[]
  ): Promise<AIGeneratedWork[]> {
    try {
      const apiKey = getOpenAIKey();
      if (!apiKey) throw new Error('OpenAI API key not set. Please add it in the login/settings page.');

      const prompt = generateWorkDescriptionPrompt(issue, totalHours, userWorkDescription, dayContext, prevWorklogs);

      console.group(`🤖 AI Prompt — ${issue.key} ${dayContext || ''}`);
      console.log('📋 Ticket:', `[${issue.key}] ${issue.fields.summary}`);
      console.log('⏱ Hours:', totalHours);
      console.log('📝 User notes:', userWorkDescription || '(none)');
      console.log('📅 Day context:', dayContext || '(none)');
      console.log('🔁 Prev worklogs passed:', prevWorklogs ? prevWorklogs.length : 0);
      console.log('📨 Full prompt:\n', prompt);
      console.groupEnd();

      const response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text: string = data?.choices?.[0]?.message?.content ?? '';

      if (!text) throw new Error('Empty response from OpenAI');

      // Strip markdown code fences if present
      const cleaned = text.replace(/```json|```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.workItems || !Array.isArray(parsed.workItems)) {
        throw new Error('Invalid AI response format');
      }

      const workItems: AIGeneratedWork[] = parsed.workItems.map((item: any) => ({
        description: item.description,
        complexity: item.complexity,
        category: item.category,
        suggestedTimeMinutes: 0,
      }));

      if (workItems.length < 1) throw new Error('AI returned no work items');

      console.log('✅ AI generated', workItems.length, 'work items');
      return workItems;
    } catch (error: any) {
      console.error('❌ AI generation error:', error.message);
      return this.generateFallbackDescriptions(issue, totalHours);
    }
  }

  /**
   * Generate unique work items for every day in a date range.
   * Each day gets its own AI call with a day-specific context hint.
   */
  async generateMultiDayWorkDescriptions(
    issue: JiraIssue,
    dates: Date[],
    hoursPerDay: number,
    userWorkDescription: string,
    prevWorklogs?: IssueWorklogEntry[]
  ): Promise<DayWorkPlan[]> {
    const plans: DayWorkPlan[] = [];
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayContext = `Day ${i + 1} of ${dates.length} (${label})`;
      const aiItems = await this.generateWorkDescriptions(issue, hoursPerDay, userWorkDescription, dayContext, prevWorklogs);
      const withTime = allocateTime(aiItems, hoursPerDay);
      plans.push({ date, items: withTime, totalHours: hoursPerDay });
    }
    return plans;
  }

  /**
   * Generate fallback work descriptions if AI fails
   */
  private generateFallbackDescriptions(
    issue: JiraIssue,
    _totalHours: number
  ): AIGeneratedWork[] {
    const issueType = issue.fields.issuetype.name.toLowerCase();
    
    if (issueType.includes('bug')) {
      return [
        {
          description: 'Investigated and reproduced the issue',
          complexity: 'medium',
          category: 'Bug Investigation',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Identified root cause and planned fix',
          complexity: 'medium',
          category: 'Analysis',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Implemented bug fix',
          complexity: 'high',
          category: 'Development',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Tested fix and verified resolution',
          complexity: 'medium',
          category: 'Testing',
          suggestedTimeMinutes: 0,
        },
      ];
    } else if (issueType.includes('story') || issueType.includes('feature')) {
      return [
        {
          description: 'Analyzed requirements and acceptance criteria',
          complexity: 'medium',
          category: 'Analysis',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Implemented core functionality',
          complexity: 'high',
          category: 'Development',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Wrote unit and integration tests',
          complexity: 'medium',
          category: 'Testing',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Code review and refinements',
          complexity: 'low',
          category: 'Code Review',
          suggestedTimeMinutes: 0,
        },
      ];
    } else {
      // Generic task
      return [
        {
          description: 'Planned and analyzed task requirements',
          complexity: 'low',
          category: 'Analysis',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Executed main task work',
          complexity: 'high',
          category: 'Development',
          suggestedTimeMinutes: 0,
        },
        {
          description: 'Validated and tested implementation',
          complexity: 'medium',
          category: 'Testing',
          suggestedTimeMinutes: 0,
        },
      ];
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
