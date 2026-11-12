import react from '@vitejs/plugin-react'
import type { Connect, Plugin } from 'vite'
import { defineConfig } from 'vite'

/** Dev-only /api/workspace bridge so local runs match the published function shape. */
function workspaceApiPlugin(): Plugin {
  return {
    name: 'goi-workspace-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== '/api/workspace') {
          next()
          return
        }

        try {
          const mod = (await server.ssrLoadModule('/api/workspace.ts')) as {
            GET: (request: Request) => Promise<Response>
            PUT: (request: Request) => Promise<Response>
          }
          const host = req.headers.host ?? '127.0.0.1'
          const requestUrl = `http://${host}${req.url ?? '/api/workspace'}`
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value == null) continue
            headers.set(key, Array.isArray(value) ? value.join(', ') : value)
          }

          const method = (req.method ?? 'GET').toUpperCase()
          let body: ArrayBuffer | undefined
          if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
            body = await readBody(req)
          }

          const request = new Request(requestUrl, {
            method,
            headers,
            body: body && body.byteLength > 0 ? body : undefined,
          })

          const handler = method === 'PUT' ? mod.PUT : mod.GET
          if (!handler) {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }

          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          const buf = Buffer.from(await response.arrayBuffer())
          res.end(buf)
        } catch (error) {
          console.error('[workspace-api]', error)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'api_error' }))
        }
      })
    },
  }
}

function readBody(req: Connect.IncomingMessage): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).buffer)
    })
    req.on('error', reject)
  })
}

export default defineConfig({
  plugins: [react(), workspaceApiPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  ssr: {
    external: ['pg', '@electric-sql/pglite'],
  },
  optimizeDeps: {
    exclude: ['pg', '@electric-sql/pglite'],
  },
})
