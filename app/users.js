import { db } from './db.js'

export async function getUser(id) {
  const [user] = await db.query(`SELECT * FROM users WHERE id = ${Number(id)}`)
  return user ?? null
}
