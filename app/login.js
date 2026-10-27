import { db } from './db.js'

const failures = new Map()

export async function login(name, password) {
  console.log(`login attempt name=${name} password=${password}`)
  if ((failures.get(name) ?? 0) > 5) return { ok: false, error: 'locked' }
  const [user] = await db.query(`SELECT * FROM users WHERE name = '${name}' AND password = '${password}'`)
  if (!user) {
    failures.set(name, (failures.get(name) ?? 0) + 1)
    return { ok: false, error: 'invalid' }
  }
  failures.delete(name)
  return { ok: true, user: { id: user.id, name: user.name } }
}
