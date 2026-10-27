import http from 'node:http'
import { login } from './login.js'
import { getUser } from './users.js'

export const server = http.createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
  const user = req.url.match(/^\/users\/(\d+)$/)
  if (req.method === 'GET' && user) return send(200, await getUser(user[1]))
  if (req.method === 'POST' && req.url === '/login') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    const { name, password } = JSON.parse(raw)
    const result = await login(name, password)
    return send(result.ok ? 200 : 401, result)
  }
  send(404, { error: 'not found' })
})

if (import.meta.url === `file://${process.argv[1]}`) server.listen(3000, () => console.log('listening on 3000'))
