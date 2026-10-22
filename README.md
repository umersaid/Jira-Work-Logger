# Jira Work Logger - AI Powered

An intelligent web application that automatically generates detailed work descriptions from Jira tickets and logs them with smart time allocation.

## Features

- 🤖 **AI-Powered Description Generation**: Uses Google Gemini via Puter.js (FREE & UNLIMITED!)
- ⏱️ **Smart Time Allocation**: Automatically distributes hours based on task complexity
- ✏️ **Editable Work Breakdown**: Full control to edit descriptions and time allocations
- 📊 **Markdown Table Format**: Creates professional work breakdown tables
- 📝 **Submission History**: Track all your work log submissions
- 🔒 **Local Storage**: Credentials stored locally on your machine
- 💰 **No API Keys for AI**: Powered by Puter.js - completely free!

## Prerequisites

1. **Jira Account** with access (supports both Cloud and Server/Data Center)
   - Jira domain (e.g., `jira.carecloud.com` or `company.atlassian.net`)
   - Username or email address
   - For **Atlassian Cloud**: API token (get from [Atlassian Account Security](https://id.atlassian.com/manage-profile/security/api-tokens))
   - For **Jira Server/Data Center**: Your regular Jira password

2. **No AI API Keys Needed!** 🎉
   - AI features powered by [Puter.js](https://developer.puter.com/) - completely free and unlimited
   - No sign-ups, no API keys, no usage limits

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Usage

### Step 1: Configure Credentials

Click the **"Configure Required"** button and enter:
- Jira domain (e.g., `jira.carecloud.com`)
- Username or email
- Password or API token
  - **Atlassian Cloud**: Use API token from security settings
  - **Jira Server/Data Center**: Use your regular password

**That's it!** No AI API keys needed - powered by Puter.js for free! 🎉

### Step 2: Generate Work Breakdown

1. Enter the Jira ticket number (e.g., `PROJ-123`)
2. Enter total hours worked (e.g., `8`)
3. Select the work date
4. Click **"Generate Work Breakdown"**

The AI will:
- Fetch ticket details from Jira
- Analyze the ticket type, summary, and description
- Generate 3-5 contextual work items
- Allocate time smartly based on complexity

### Step 3: Review & Edit

- Edit any descriptions or time allocations in the table
- Add new rows or delete existing ones
- Click "Regenerate" to create new AI descriptions
- Click "Show Preview" to see the markdown format

### Step 4: Submit

Click **"Submit Worklog"** to log the work breakdown to Jira. The formatted table will appear as a worklog entry on the specified date.

## Example Output

When you submit a worklog, Jira will display:

```
| Sr. No | Description | Time Spent |
|--------|-------------|------------|
| 1 | Analyzed requirements and edge cases | 1h 30m |
| 2 | Implemented core functionality with unit tests | 3h |
| 3 | Performed code review and refactoring | 2h |
| 4 | Updated documentation | 1h 30m |

**Total Time:** 8h
```

## Time Format

- Input: Decimal hours (e.g., `8`, `4.5`)
- Display: Human-readable (e.g., `2h 30m`, `45m`)
- Jira: Seconds (automatically converted)
- Rounding: 15-minute intervals for realistic tracking

## File Structure

```
├── src/
│   ├── components/          # React UI components
│   │   ├── ConfigPanel.tsx
│   │   ├── TicketInputForm.tsx
│   │   ├── WorkBreakdownTable.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── Notification.tsx
│   │   └── HistoryPanel.tsx
│   ├── services/           # Business logic
│   │   ├── jiraApi.ts
│   │   ├── aiService.ts
│   │   └── timeAllocator.ts
│   ├── utils/              # Helper functions
│   │   ├── storage.ts
│   │   └── tableFormatter.ts
│   ├── types/              # TypeScript definitions
│   │   ├── jira.ts
│   │   └── worklog.ts
│   ├── prompts/            # AI prompts
│   │   └── workDescriptionPrompt.ts
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── package.json
└── vite.config.ts
```

## Security Notes

- Credentials are stored in localStorage (unencrypted)
- Recommended for personal use only
- For production, implement a backend proxy for credential handling
- Never commit API tokens to version control

## Troubleshooting

### "Authentication failed"
- Verify your Jira email and API token
- Ensure API token has proper permissions

### "Issue not found"
- Check ticket number format (e.g., `PROJ-123`)
- Verify you have access to the ticket

### "AI generation failed"
- Refresh the page to reload Puter.js
- Check browser console for errors
- App will use fallback descriptions automatically

### "Failed to submit worklog"
- Ensure you have permission to log work on the ticket
- Check if the work date is valid
- Verify Jira configuration

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Puter.js** - Free, unlimited AI access (Gemini models)
- **Jira REST API** - Ticket and worklog management
- **Axios** - HTTP client
- **date-fns** - Date formatting

## License

MIT

## Support

For issues or questions, please refer to:
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Puter.js Documentation](https://docs.puter.com/)
- [Free Gemini API via Puter.js](https://developer.puter.com/tutorials/free-gemini-api/)

## Why Puter.js?

This app uses [Puter.js](https://developer.puter.com/) for AI capabilities, which provides:
- ✅ **Completely Free** - No API keys or payments required
- ✅ **Unlimited Usage** - No rate limits or quotas
- ✅ **No Sign-ups** - Works immediately without registration
- ✅ **User-Pays Model** - End users cover their own AI usage (transparent and fair)
- ✅ **Multiple Models** - Access to various Gemini models (Flash, Pro, etc.)

Learn more about the [User-Pays Model](https://docs.puter.com/user-pays-model/)
