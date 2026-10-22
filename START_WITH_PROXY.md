# 🚀 Quick Start with Proxy Server

## ✅ CORS Issue Fixed!

Your Jira server blocks direct browser requests. The proxy server routes your requests through Node.js to bypass this.

## 📋 Steps to Run

### 1. Start the Proxy Server (Terminal 1)
```bash
npm run proxy
```

You should see:
```
✅ CORS Proxy running on http://localhost:3001
📡 Forwarding requests to: https://jira.carecloud.com
```

### 2. Start Your App (Terminal 2 - Open New Terminal)
```bash
npm run dev
```

### 3. Use the App
1. Open: http://localhost:3000
2. Enter password (domain/username already saved)
3. Enter ticket: **MTBCDAT-10208**
4. Generate work breakdown ✨

---

## 🔧 How It Works

**Before (CORS Error):**
```
Browser → ❌ → jira.carecloud.com
```

**After (Proxy Bypass):**
```
Browser → ✅ Proxy Server → ✅ jira.carecloud.com
```

The proxy server:
- Runs on port 3001
- Forwards requests to CareCloud Jira
- Adds proper CORS headers
- Your app uses `localhost:3001/api` instead of `jira.carecloud.com`

---

## 🐛 Troubleshooting

**Error: "Cannot connect to Jira"**
- ✅ Make sure proxy server is running (check Terminal 1)
- ✅ Proxy should show: `✅ CORS Proxy running`

**Error: "EADDRINUSE"**
- Port 3001 is already in use
- Close other terminals or change port in `proxy-server.js`

**Proxy shows errors:**
- Check your VPN connection
- Verify credentials (username: USAID, password)
- Test direct access: https://jira.carecloud.com

---

## 📝 Configuration

**Current Setup:**
- Domain: `https://jira.carecloud.com`
- Username: `USAID`
- Password: (You enter each session)
- Proxy: `http://localhost:3001`

**To disable proxy** (if you install CORS extension later):
Edit `src/services/jiraApi.ts`:
```typescript
private useProxy: boolean = false; // Change to false
```

---

## ✨ Next Steps

Once both servers are running:
1. Test with ticket MTBCDAT-10208
2. AI generates work descriptions
3. Edit/review the breakdown
4. Copy to Jira! 🎉

**Need help?** Check the browser console (F12) for detailed error messages.
