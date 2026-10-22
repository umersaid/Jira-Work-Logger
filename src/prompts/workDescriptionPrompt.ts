import { JiraIssue } from '../types/jira';
import { IssueWorklogEntry } from '../types/jira';

/**
 * Generate AI prompt for work description generation
 */
export const generateWorkDescriptionPrompt = (
  issue: JiraIssue,
  totalHours: number,
  userWorkDescription: string,
  dayContext?: string,
  prevWorklogs?: IssueWorklogEntry[]
): string => {
  const extra = userWorkDescription.trim() ? `User notes: ${userWorkDescription}` : '';
  const desc = issue.fields.description || '';
  const dayNote = dayContext ? `Focus: ${dayContext}.` : '';
  const projectName = issue.fields.project?.name || 'the project';

  // Build previous worklogs context if provided
  let prevContext = '';
  if (prevWorklogs && prevWorklogs.length > 0) {
    const lines = prevWorklogs.slice(0, 10).map((wl) => {
      const date = new Date(wl.started).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const h = Math.floor(wl.timeSpentSeconds / 3600);
      const m = Math.floor((wl.timeSpentSeconds % 3600) / 60);
      const time = m === 0 ? `${h}h` : `${h}h ${m}m`;

      // Parse actual work item descriptions from the comment table
      // Handles both markdown (| col | col |) and Jira wiki markup (|| col || col ||)
      const comment = wl.comment || '';
      const tableRows = comment.split('\n').filter(l => {
        const t = l.trim();
        if (!t.startsWith('|')) return false;
        // Skip divider rows (---|---) and header rows (Sr No / Description / Time)
        if (/^[\|\s\-:]+$/.test(t)) return false;
        if (/sr[\s.]?no/i.test(t)) return false;
        // Must have a numeric cell as first data cell
        const cells = t.split('|').map(c => c.replace(/\*/g, '').trim()).filter(Boolean);
        return cells.length >= 2 && /^\d+$/.test(cells[0]);
      });

      let descSummary: string;
      if (tableRows.length > 0) {
        // Extract description column (index 1) from each row
        const descs = tableRows.map(row => {
          const cells = row.split('|').map(c => c.replace(/[*_\\]/g, '').trim()).filter(Boolean);
          return cells[1] || '';
        }).filter(Boolean);
        descSummary = descs.join(' | ');
      } else {
        // Fallback: grab any non-table, non-empty line
        descSummary = comment.split('\n')
          .map(l => l.replace(/[*_|\\]/g, '').trim())
          .find(l => l.length > 4) || '(no description)';
      }

      return `- ${date} (${time}): ${descSummary}`;
    }).join('\n');
    prevContext = `\nPrevious worklogs already submitted for this ticket (DO NOT REPEAT these exact tasks — generate DIFFERENT, complementary work items):\n${lines}\n`;
  }

  return `You are a professional Jira worklog assistant. Generate realistic daily work log entries for a software developer.

Ticket: [${issue.key}] ${issue.fields.issuetype.name}: "${issue.fields.summary}"
Project: ${projectName}
Total hours for this day: ${totalHours}h
${extra ? extra + '\n' : ''}${desc ? 'Ticket description:\n' + desc + '\n' : ''}${prevContext}${dayNote ? dayNote + '\n' : ''}
Generate EXACTLY 3–4 work log items that together sum to exactly ${totalHours} hours. Follow these rules:

STRUCTURE:
1–3. TECHNICAL items — directly related to this specific ticket. What the developer actually DID on this ticket today. Examples depending on ticket type:
   - Bug: "Analyzed the root cause of [issue]", "Investigated the [frontend/backend] logic related to [feature]", "Reproduced and debugged [issue] in [component]"
   - Feature: "Implemented [specific feature or component]", "Developed [UI/API/logic] for [feature]", "Integrated [component] with [system]"
   - Task: "Reviewed [area] and analyzed [aspect]", "Configured [system/component] for [purpose]", "Validated [feature] against acceptance criteria"
   Use the ticket description to make these SPECIFIC and meaningful — mention real technical areas from the ticket.
Last item. ONE TEAM MEETING — always include exactly one: "Participated in the ${projectName} internal team meeting to discuss ongoing tickets and testing status" — assign 30m or 1h depending on how much time is left.

RULES:
- Past-tense professional verbs: Analyzed, Investigated, Implemented, Developed, Reproduced, Debugged, Reviewed, Configured, Validated, Participated, Conducted
- Descriptions: 10–18 words, specific to this ticket's technical domain
- Times: whole or half hours only (30, 60, 90, 120, 150, 180 minutes)
- Items must SUM to exactly ${totalHours * 60} minutes
- NO generic filler items like "knowledge transfer" or "documentation" unless the ticket is specifically about that

Reply ONLY with valid JSON, no explanation:
{"workItems":[{"description":"task description here","complexity":"low|medium|high","category":"Development|Testing|Analysis|Bug Investigation|Code Review|Documentation|Meeting"}]}`;
};
