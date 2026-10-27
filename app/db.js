// A stand-in for a real database: every query is counted and takes 5 ms.
export const db = {
  calls: 0,
  users: [
    { id: 1, name: 'ada', email: 'ada@example.com', password: 'lovelace' },
    { id: 2, name: 'bob', email: 'bob@example.com', password: 'builder' },
  ],
  async query(sql) {
    this.calls++
    await new Promise(resolve => setTimeout(resolve, 5))
    const id = /\bid = (\d+)/.exec(sql)?.[1]
    const name = /\bname = '([^']*)'/.exec(sql)?.[1]
    const password = /\bpassword = '([^']*)'/.exec(sql)?.[1]
    return this.users.filter(u =>
      (id === undefined || u.id === Number(id)) &&
      (name === undefined || u.name === name) &&
      (password === undefined || u.password === password))
  },
}
