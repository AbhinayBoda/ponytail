import { db } from './db.js'

const failures = new Map()

export async function login(name, password) {
  if ((failures.get(name) ?? 0) >= 5) return { ok: false, error: 'locked' }
  const [user] = await db.query(`SELECT * FROM users WHERE name = '${name.replace(/'/g, "''")}'`)
  if (!user || user.password !== password) {
    failures.set(name, (failures.get(name) ?? 0) + 1)
    return { ok: false, error: 'invalid' }
  }
  failures.delete(name)
  return { ok: true, user: { id: user.id, name: user.name } }
}
