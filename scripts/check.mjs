#!/usr/bin/env node
// The toolkit's tests: one line per check, PASS / FAIL / SKIP and what it guarantees.
// Run: node scripts/check.mjs   (Node 22.18+, nothing to install, no network; one check needs Chrome)
import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { decode } from '../.agents/skills/toon/vendor/index.ts'

const root = path.resolve(import.meta.dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const SKILLS = '.agents/skills'
const skills = fs.readdirSync(path.join(root, SKILLS)).sort()
const upstreams = Object.values(JSON.parse(read('upstreams.json')))

// Exceptions a reviewer accepted, with the reason.
const ALLOWED_CHARS = {
  '.agents/skills/archify/renderers/shared/diagnostics.mjs': ['U+0000', 'key separator inside a template string'],
  '.agents/skills/toon/vendor/constants.ts': ['U+FEFF', 'the byte-order-mark constant the TOON decoder strips'],
}
const HIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/gu
const RISKY = {
  'pipes a download into a shell': /\b(curl|wget)\b[^\n|]*https?:\/\/[^\n|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i,
  'contains a private key': /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  'contains an access token': /\b(AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,}|sk-(ant-)?[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})/,
  'tells the agent to drop its instructions': /\b(ignore|disregard|forget) (all |any )?(of )?(the |your )?(previous|prior|above|earlier) (instructions|rules|messages)/i,
  'tells the agent to hide something from the user': /\b(do not|don.t|never) (tell|inform|alert|notify|show) the user\b|\bwithout (telling|informing|alerting) the user\b/i,
}

function* walk(rel = '') {
  for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    const p = rel ? `${rel}/${entry.name}` : entry.name
    if (p === '.git') continue
    if (entry.isDirectory()) yield* walk(p)
    else yield [p, entry]
  }
}
const files = [...walk()]
const lineOf = (text, index) => text.slice(0, index).split('\n').length
const codepoint = ch => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`

// The few frontmatter shapes skills use: `key: value`, quoted values, and `>` / `|` blocks.
function frontmatter(text) {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return null
  const lines = block[1].split(/\r?\n/)
  const fields = {}
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([\w-]+):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (/^[>|][+-]?$/.test(value)) {
      const parts = []
      while (/^\s+\S/.test(lines[i + 1] ?? '')) parts.push(lines[++i].trim())
      value = parts.join(' ')
    }
    fields[kv[1]] = value.replace(/^(["'])(.*)\1$/, '$2')
  }
  return fields
}

let failed = 0
async function check(title, run) {
  let problems
  try {
    problems = await run()
  } catch (err) {
    problems = [err.message]
  }
  if (typeof problems === 'string') return console.log(`SKIP  ${title}\n      - ${problems}`)
  if (problems.length) failed++
  console.log(`${problems.length ? 'FAIL' : 'PASS'}  ${title}`)
  for (const p of problems) console.log(`      - ${p}`)
}

await check('Every skill follows the open Agent Skills format, so any skills-capable host can load it', () => {
  const problems = []
  for (const name of skills) {
    const file = `${SKILLS}/${name}/SKILL.md`
    if (!fs.existsSync(path.join(root, file))) { problems.push(`${name} has no SKILL.md`); continue }
    const fm = frontmatter(read(file))
    if (!fm) { problems.push(`${file} has no frontmatter`); continue }
    if (fm.name !== name) problems.push(`${file}: name "${fm.name}" must match its folder "${name}"`)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) problems.push(`${name}: use lowercase words joined by hyphens, at most 64 characters`)
    const length = fm.description?.length ?? 0
    if (length < 1 || length > 1024) problems.push(`${file}: description must be 1-1024 characters, has ${length}`)
  }
  return problems
})

await check('Each skill folder holds one SKILL.md at its top (hosts that scan folders would load a nested one as an extra skill)', () =>
  files.filter(([p]) => p.startsWith(`${SKILLS}/`) && p.endsWith('/SKILL.md') && p.split('/').length !== 4).map(([p]) => `nested ${p}`))

await check('AGENTS.md and README.md list exactly the skills in .agents/skills', () => ['AGENTS.md', 'README.md'].flatMap(doc => {
  const listed = new Set([...read(doc).matchAll(/^\|(?:[^|\n]*\|)?\s*`([a-z0-9-]+)`\s*\|/gm)].map(m => m[1]))
  return [
    ...skills.filter(s => !listed.has(s)).map(s => `${doc} does not list ${s}`),
    ...[...listed].filter(s => !skills.includes(s)).map(s => `${doc} lists ${s}, which does not exist`),
  ]
}))

await check('AGENTS.md carries the vendored ponytail rules word for word (catches an upstream rule change nobody ported)', () => {
  const rules = text => [text.match(/^You are a lazy senior developer\..*$/m)?.[0], text.match(/^## Before you write[\s\S]*?^Never cut:.*$/m)?.[0]]
  const [ours, upstream] = [rules(read('AGENTS.md')), rules(read(`${SKILLS}/ponytail/SKILL.md`))]
  return upstream.every(Boolean) && isDeepStrictEqual(ours, upstream) ? [] : [`copy the rules from ${SKILLS}/ponytail/SKILL.md into AGENTS.md`]
})

await check('Every vendored folder carries its upstream LICENSE', () =>
  upstreams.flatMap(u => Object.values(u.copy)).filter(dest => !fs.existsSync(path.join(root, dest, 'LICENSE'))).map(dest => `${dest}/LICENSE is missing`))

await check('No symlinks (a vendored link could point an agent at files outside the workspace)', () =>
  files.filter(([, entry]) => entry.isSymbolicLink()).map(([p]) => `${p} is a symlink`))

await check('No file over 1.5 MB, and AGENTS.md under the 12,000-character limit Antigravity puts on rule files', () => [
  ...files.filter(([p]) => fs.statSync(path.join(root, p)).size > 1.5e6).map(([p]) => `${p} is over 1.5 MB`),
  ...(read('AGENTS.md').length > 12000 ? [`AGENTS.md has ${read('AGENTS.md').length} characters`] : []),
])

await check('No invisible or control characters, which can hide text from a human reviewer', () => files.flatMap(([p]) => {
  const text = fs.readFileSync(path.join(root, p), 'utf8')
  return [...text.matchAll(HIDDEN)]
    .filter(m => ALLOWED_CHARS[p]?.[0] !== codepoint(m[0]))
    .map(m => `${p}:${lineOf(text, m.index)} has ${codepoint(m[0])}`)
}))

await check('No pipe-to-shell installs, keys or tokens, or text telling an agent to drop its rules or hide things from the user', () => files.flatMap(([p]) => {
  const text = fs.readFileSync(path.join(root, p), 'utf8')
  return Object.entries(RISKY).flatMap(([what, re]) => {
    const m = text.match(re)
    return m ? [`${p}:${lineOf(text, m.index)} ${what}: ${JSON.stringify(m[0].slice(0, 60))}`] : []
  })
}))

await check('toon: the examples in its SKILL.md decode, its size claim holds, and the bundled CLI round-trips JSON exactly', () => {
  const problems = []
  const doc = read(`${SKILLS}/toon/SKILL.md`)
  const examples = [...doc.matchAll(/```toon\n([\s\S]*?)```/g)].map(m => m[1].trimEnd())
  for (const example of examples) {
    try { decode(example) } catch (err) { problems.push(`an example does not decode: ${err.message}`) }
  }
  const claim = doc.match(/(\d+) bytes of pretty JSON \((\d+) minified\); the TOON above is (\d+)/)
  const data = decode(examples[0])
  const actual = [JSON.stringify(data, null, 2).length, JSON.stringify(data).length, examples[0].length]
  if (!claim || claim.slice(1).map(Number).join() !== actual.join()) problems.push(`size sentence should say ${actual.join(' / ')} bytes`)
  const sample = { users: [{ id: 1, name: 'Ada, Countess', tags: ['math', 'code'] }, { id: 2, name: ' Bob ', tags: [] }], ok: true, note: null }
  const cli = path.join(root, SKILLS, 'toon/toon.mjs')
  const toon = execFileSync(process.execPath, [cli], { input: JSON.stringify(sample), encoding: 'utf8' })
  const back = JSON.parse(execFileSync(process.execPath, [cli, '--decode'], { input: toon, encoding: 'utf8' }))
  if (!isDeepStrictEqual(back, sample)) problems.push('JSON -> TOON -> JSON changed the data')
  return problems
})

await check('fast-browser: in real Chrome its recipe lists a form\'s controls, fills and submits it, and never lists the password field', async () => {
  const chrome = process.env.CHROME_PATH || ['google-chrome', 'chromium', 'chromium-browser', 'chrome'].find(bin => {
    try { return execFileSync('which', [bin], { stdio: 'pipe' }) } catch { return false }
  })
  if (!chrome) return 'no Chrome or Chromium on PATH (set CHROME_PATH to run it)'
  const doc = read(`${SKILLS}/fast-browser/SKILL.md`)
  const [install, readPage] = [...doc.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1].trim())
  const fill = doc.match(/`(\(e => \{ Object\.getOwnPropertyDescriptor[^`]+)`/)[1]
  const snapshot = read(`${SKILLS}/fast-browser/vendor/snapshot.js`).trim()
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fast-browser-'))
  fs.writeFileSync(path.join(dir, 'form.html'), `<!doctype html><title>Flight search</title>
<form onsubmit="event.preventDefault(); out.textContent = 'Results for ' + to.value">
<label>From <input id="from" value="Zurich"></label> <label>To <input id="to"></label>
<label>Password <input type="password" value="hunter2"></label> <button>Search</button></form><p id="out">No search yet</p>`)
  const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}/profile`, '--no-first-run', 'about:blank']
  const browser = spawn(chrome, process.getuid?.() === 0 ? ['--no-sandbox', ...args] : args, { stdio: ['ignore', 'ignore', 'pipe'], detached: true })
  try {
    const port = await new Promise((resolve, reject) => {
      let log = ''
      browser.stderr.on('data', d => { log += d; const m = log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)/); if (m) resolve(m[1]) })
      setTimeout(() => reject(new Error('Chrome did not start within 15 s')), 15000)
    })
    const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')
    const ws = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = e => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); waiting.delete(m.id) }
    const send = (method, params) => new Promise(resolve => { waiting.set(++id, resolve); ws.send(JSON.stringify({ id, method, params })) })
    const run = async js => (await send('Runtime.evaluate', { expression: js, returnByValue: true })).result.result.value
    const open = async url => { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, 500)) }

    const problems = []
    await open(`file://${dir}/form.html`)
    if (!(await run(readPage)).startsWith('NO SNAPSHOT')) problems.push('reading before step 1 should say NO SNAPSHOT')
    await run(install.replace('SNAPSHOT', snapshot))
    const table = await run(readPage)
    const node = label => table.match(new RegExp(`${label}.*#(\\d+)`))?.[1]
    const [to, search] = [node('fill textbox "To"'), node('click button "Search"')]
    if (!to || !search) problems.push(`the table misses the To field or the Search button:\n${table}`)
    if (/hunter2|textbox "Password"/.test(table)) problems.push('the password field was listed')
    await run(fill.replace('get(12)', `get(${to})`))
    await run(`window.__jevFast.nodes.get(${search}).click()`)
    if (!(await run(readPage)).includes('Results for London')) problems.push('filling To and clicking Search did not submit the form')
    await open(`file://${dir}/form.html?again`)
    if (!(await run(readPage)).startsWith('NO SNAPSHOT')) problems.push('after a navigation the recipe should ask for step 1 again')
    ws.close()
    return problems
  } finally {
    // Chrome's helper processes keep writing to the profile after the main one exits: stop the whole group.
    const exited = new Promise(resolve => browser.once('exit', resolve))
    try { process.kill(-browser.pid, 'SIGKILL') } catch { browser.kill('SIGKILL') }
    await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 5000))])
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) } catch {}
  }
})

const tokens = chars => Math.round(chars / 4).toLocaleString('en-US')
const bodies = skills.map(name => read(`${SKILLS}/${name}/SKILL.md`).length)
const index = skills.reduce((sum, name) => sum + name.length + (frontmatter(read(`${SKILLS}/${name}/SKILL.md`))?.description?.length ?? 0), 0)
console.log(`
Context cost per turn, in tokens (about characters / 4):
  always loaded    AGENTS.md                                   ${tokens(read('AGENTS.md').length)}
  always loaded    skill index (${skills.length} names and descriptions)       ${tokens(index)}
  on demand        one skill's SKILL.md, only while it is used  ${tokens(Math.min(...bodies))} to ${tokens(Math.max(...bodies))}
  for comparison   all ${skills.length} SKILL.md files as always-on rules       ${tokens(bodies.reduce((a, b) => a + b, 0))}
`)
console.log(failed ? `${failed} check(s) failed.` : 'All checks passed.')
process.exit(failed ? 1 : 0)
