import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

// Enable CORS for all origins (for local development)
app.use(cors());
app.use(express.json());

// Proxy all requests to Jira
app.use('/api', async (req, res) => {
  const jiraUrl = 'https://jira.carecloud.com' + req.url;
  
  console.log(`[PROXY] ${req.method} ${jiraUrl}`);
  
  try {
    const response = await axios({
      method: req.method,
      url: jiraUrl,
      data: req.body,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });
    
    console.log(`[PROXY] Response: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[PROXY] Error:', error.message);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ CORS Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding requests to: https://jira.carecloud.com`);
  console.log(`\n🔧 Update your app to use: localhost:${PORT}/api instead of jira.carecloud.com`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
