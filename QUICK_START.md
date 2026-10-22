# Quick Start Guide

## Getting Started in 3 Minutes (Even Faster Now!)

### 1. Get Your Jira Credentials

**For Atlassian Cloud (company.atlassian.net):**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "Work Logger")
4. Copy the token

**For Jira Server/Data Center (e.g., jira.carecloud.com):**
- Use your regular Jira username and password
- No API token needed!

**No AI API Keys Needed!** 🎉
- AI is powered by [Puter.js](https://developer.puter.com/) - completely free!
- No sign-ups, no API keys, no limits

### 2. Configure the App

1. Open http://localhost:3000
2. Click the red **"Configure Required"** button
3. Fill in:
   - Jira Domain: `jira.carecloud.com` (or your domain)
   - Username: `USAID` (or your username/email)
   - Password: Your Jira password (or API token for Cloud)
4. Click **"Save Configuration"**

✅ No AI API keys needed - Puter.js handles it for free!

### 3. Log Your First Work

1. Enter a Jira ticket number (e.g., `PROJ-123`)
2. Enter hours worked (e.g., `8`)
3. Select the work date
4. Click **"Generate Work Breakdown"**

The AI will fetch your ticket and create 3-5 work descriptions like:
- "Analyzed requirements and edge cases" - 1h 30m
- "Implemented core functionality" - 3h
- "Wrote unit tests" - 2h
- "Code review and documentation" - 1h 30m

5. Edit any descriptions or times if needed
6. Click **"Submit Worklog"**

Done! Check your Jira ticket to see the formatted work breakdown.

## Tips

- **Edit freely**: Click any description or time to edit
- **Add/Delete rows**: Use the + and 🗑️ buttons
- **Regenerate**: Don't like the AI descriptions? Click "Regenerate"
- **Preview**: Click "Show Preview" to see the markdown format
- **History**: Expand the History panel to see past submissions

## Keyboard Shortcuts

- `Enter` in ticket field → Start generation
- Click time fields → Type `2h 30m`, `90m`, or `1.5h`

## Common Issues

**"Issue not found"**
→ Check ticket format: `PROJECT-123` (must match exactly)

**"Authentication failed"**
→ Verify your Jira email and API token

**"AI generation failed"**
→ Refresh the page to reload Puter.js or use the fallback descriptions

## Example Workflow

```
1. Morning standup → worked on PROJ-456 for 8 hours
2. Open app → enter PROJ-456, 8 hours, today's date
3. AI generates work breakdown based on ticket
4. Quick review and edit if needed
5. Submit → done in 30 seconds!
```

## What Gets Logged to Jira?

A formatted markdown table in the worklog comment:

```
| Sr. No | Description | Time Spent |
|--------|-------------|------------|
| 1 | Analyzed requirements | 1h 30m |
| 2 | Implemented feature | 3h |
| 3 | Testing and QA | 2h |
| 4 | Documentation | 1h 30m |

**Total Time:** 8h
```

Plus the total time (8h) is logged to the worklog for time tracking reports.

---

Need help? Check the [README.md](README.md) for detailed documentation.
