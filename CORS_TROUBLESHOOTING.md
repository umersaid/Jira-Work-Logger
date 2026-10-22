# CORS & Network Troubleshooting for CareCloud Jira

## The Problem

You're seeing: **"Failed to fetch issue: Network Error"**

This happens because:
- Your browser (localhost:3000) is trying to access CareCloud Jira (jira.carecloud.com)
- The browser blocks this for security (CORS policy)
- Or you can't reach the Jira server

## Quick Solutions

### Option 1: Install CORS Browser Extension (Easiest for Testing)

**For Chrome/Edge:**
1. Install: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
2. Click the extension icon → Enable
3. Refresh your app → Try again

**For Firefox:**
1. Install: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)
2. Enable the extension
3. Refresh your app → Try again

⚠️ **Security Note:** Only use CORS extensions for development/personal tools on trusted sites!

### Option 2: Check VPN Connection

CareCloud Jira might require VPN access:
1. Connect to your company VPN
2. Test if you can access https://jira.carecloud.com in a new tab
3. If it loads, try the app again

### Option 3: Verify Jira Access

Open browser console (F12) and test:
```javascript
fetch('https://jira.carecloud.com/rest/api/2/myself', {
  headers: {
    'Authorization': 'Basic ' + btoa('USAID:your-password')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Replace `your-password` with your actual password.

**If this works:** CORS is the issue (use Option 1)  
**If this fails:** Network/auth issue (see below)

### Option 4: Test Jira Directly

1. Open new tab → Go to: `https://jira.carecloud.com/rest/api/2/issue/MTBCDAT-10208`
2. Browser will ask for login → Enter username and password
3. **If you see JSON:** Credentials are correct, CORS is blocking the app
4. **If you get error:** Check credentials or VPN

## Option 5: Use a Proxy Server (Most Secure)

If CORS extensions don't work, create a simple Node.js proxy:

1. **Create `proxy-server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.all('/jira/*', async (req, res) => {
  const jiraUrl = 'https://jira.carecloud.com' + req.url.replace('/jira', '');
  try {
    const response = await axios({
      method: req.method,
      url: jiraUrl,
      data: req.body,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.listen(3001, () => console.log('Proxy running on http://localhost:3001'));
```

2. **Install dependencies:**
```bash
npm install express cors axios
```

3. **Run proxy:**
```bash
node proxy-server.js
```

4. **Update app to use proxy:**
   - Change `jira.carecloud.com` → `localhost:3001/jira`

## Recommended Approach for You

### For Testing/Personal Use:
✅ **Use Option 1** (CORS extension) - Quickest solution

### For Production/Team Use:
✅ **Use Option 5** (Proxy server) - Most secure and reliable

## Why This Happens

Modern browsers block requests from one domain (localhost:3000) to another (jira.carecloud.com) unless the target server explicitly allows it via CORS headers. CareCloud Jira likely doesn't have CORS enabled for localhost.

## Next Steps

1. **Try Option 1 first** (CORS extension)
2. **Test with your ticket:** MTBCDAT-10208
3. **If it works:** Continue using the app!
4. **If still fails:** Check VPN connection (Option 2)

## Success Indicators

After fixing CORS, you should see:
- ✅ Ticket details appear (title, type, status)
- ✅ AI generates 3-5 work descriptions
- ✅ Editable table with time allocations
- ✅ Ready to submit!

---

**Need help?** Check browser console (F12) for detailed error messages and share them for more specific guidance.
