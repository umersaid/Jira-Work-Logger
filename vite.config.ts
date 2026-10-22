import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'jira-cors-proxy',
      configureServer(server) {
        // Proxy requests: /jira-proxy/<domain><path>  →  https://<domain><path>
        // This runs server-side so it bypasses browser CORS restrictions entirely.
        server.middlewares.use('/jira-proxy', (req, res) => {
          const match = (req.url || '/').match(/^\/([^/]+)(\/.*)?$/)
          if (!match) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Bad proxy URL format. Expected /jira-proxy/<domain>/...' }))
            return
          }
          const domain = match[1]
          const path = match[2] || '/'

          // Handle CORS preflight
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept')
          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          const chunks: Buffer[] = []
          req.on('data', (c: Buffer) => chunks.push(c))
          req.on('end', () => {
            const body = Buffer.concat(chunks)
            const options: https.RequestOptions = {
              hostname: domain,
              port: 443,
              path,
              method: req.method || 'GET',
              headers: {
                host: domain,
                authorization: req.headers['authorization'] || '',
                'content-type': 'application/json',
                accept: 'application/json',
              },
              rejectUnauthorized: false, // allows self-signed certs on internal Jira
            }

            const proxyReq = https.request(options, (proxyRes) => {
              res.statusCode = proxyRes.statusCode || 502
              Object.entries(proxyRes.headers).forEach(([k, v]) => {
                if (k.toLowerCase() !== 'transfer-encoding') {
                  res.setHeader(k, v as string)
                }
              })
              res.setHeader('Access-Control-Allow-Origin', '*')
              proxyRes.pipe(res)
            })

            proxyReq.on('error', (err) => {
              res.statusCode = 502
              res.end(JSON.stringify({ error: 'Proxy error', message: err.message }))
            })

            if (body.length > 0) proxyReq.write(body)
            proxyReq.end()
          })
        })
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
  },
})
