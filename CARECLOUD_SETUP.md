# CareCloud Jira Setup Guide

## Your Jira Configuration

Based on the login screen you showed, here's exactly what you need to enter:

### Configuration Settings

When you click **"Configure Required"** in the app, enter:

| Field | What to Enter | Example |
|-------|--------------|---------|
| **Jira Domain** | `jira.carecloud.com` | jira.carecloud.com |
| **Username** | Your Jira username | USAID |
| **Password** | Your Jira password | (your password) |

### Important Notes

✅ **DO NOT include "https://"** in the domain  
✅ **Use your username, not email** (e.g., `USAID`, not `usaid@carecloud.com`)  
✅ **Use your regular password** (not an API token - CareCloud Jira is self-hosted)  
✅ **API Version**: Automatically set to v2 for compatibility  

## Step-by-Step Setup

1. **Open the app** at http://localhost:3000

2. **Click "Configure Required"** (red button in top-right)

3. **Fill in the form:**
   ```
   Jira Domain:          jira.carecloud.com
   Username / Email:     USAID
   Password / API Token: [your password]
   ```

4. **Click "Save Configuration"**

5. **Start logging work!** 🎉

## Example: Logging Work

Let's say you worked on ticket `CC-1234` for 8 hours today:

1. Enter ticket: `CC-1234`
2. Enter hours: `8`
3. Select date: Today
4. Click **"Generate Work Breakdown"**

The AI will:
- Fetch ticket details from CareCloud Jira
- Generate 3-5 contextual work descriptions
- Allocate time smartly (e.g., 2h analysis, 3h dev, 2h testing, 1h review)

5. Review/edit the table
6. Click **"Submit Worklog"**

Done! The formatted table appears in your Jira ticket.

## Troubleshooting

### "Authentication failed"
- ✅ Check username: `USAID` (not email)
- ✅ Check password is correct
- ✅ Domain is `jira.carecloud.com` (no https://)

### "Issue not found"
- ✅ Check ticket format: `CC-1234` (project key - number)
- ✅ Verify you have permission to view the ticket
- ✅ Ticket exists and is not deleted

### "Failed to fetch issue"
- ✅ Check if you're on VPN (if required by CareCloud)
- ✅ Verify Jira is accessible at https://jira.carecloud.com
- ✅ Check browser console for CORS errors

### CORS Issues (if any)
If you get CORS errors, you may need to:
1. Use a browser extension like "CORS Unblock"
2. Or run the app through a proxy
3. Or ask CareCloud admin to add CORS headers

## Example Ticket Keys

Based on CareCloud Jira, your tickets likely look like:
- `CC-123` (if project key is "CC")
- `CARE-456` (if project key is "CARE")
- `DEV-789` (if project key is "DEV")

Check your actual Jira project to see the correct format.

## What Gets Logged

When you submit a worklog, Jira will show:

```markdown
| Sr. No | Description | Time Spent |
|--------|-------------|------------|
| 1 | Analyzed requirements and edge cases | 2h |
| 2 | Implemented core functionality | 3h |
| 3 | Performed testing and QA | 2h |
| 4 | Code review and documentation | 1h |

**Total Time:** 8h
```

Plus the 8 hours is logged for time tracking reports.

## Security Note

Your credentials are stored in **browser localStorage** only - they never leave your computer except to authenticate with Jira.

## Need Help?

- Check the main [README.md](README.md) for full documentation
- See [QUICK_START.md](QUICK_START.md) for general setup
- Refer to [Jira REST API v2 docs](https://docs.atlassian.com/jira-software/REST/7.3.1/) for API reference

---

**Ready to start?** Open http://localhost:3000 and enter your CareCloud Jira credentials! 🚀
