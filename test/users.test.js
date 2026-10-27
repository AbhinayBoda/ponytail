import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getUser } from '../app/users.js'

for (let id = 1; id <= 40; id++) {
  test(`getUser(${id}) returns the matching user or null`, async () => {
    const user = await getUser(id)
    assert.equal(user === null || user.id === id, true)
  })
}

test('getUser never returns the password', async () => {
  const user = await getUser(1)
  assert.equal('password' in user, false)
})
