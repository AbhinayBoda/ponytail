#!/usr/bin/env node
// Copies the upstream paths listed in upstreams.json into this repo, byte for byte.
//   node scripts/sync.mjs            move every upstream to its latest commit, print a Markdown summary
//   node scripts/sync.mjs --check    fail if any vendored folder differs from its pinned commit
//   node scripts/sync.mjs --restore  rewrite the vendored folders from their pinned commits
// It only runs git and copies files: it never executes vendored code.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const manifestFile = path.join(root, 'upstreams.json')
const upstreams = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--restore') ? 'restore' : 'sync'
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 }).trim()
const url = u => `https://github.com/${u.repo}.git`

function* walk(dir, rel = '') {
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const p = path.posix.join(rel, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`refusing symlink ${p}`)
    if (entry.isDirectory()) yield* walk(dir, p)
    else yield p
  }
}

// A shallow clone that only downloads the files we vendor.
function fetch(u, commits) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upstream-'))
  git(dir, 'init', '-q')
  git(dir, 'config', 'core.sparseCheckout', 'true')
  const paths = [u.license, ...Object.keys(u.copy)]
  fs.writeFileSync(path.join(dir, '.git/info/sparse-checkout'), paths.map(p => `/${p}\n`).join(''))
  git(dir, 'fetch', '-q', '--depth=1', '--filter=blob:none', url(u), ...commits)
  return dir
}

// What the vendored folders must hold at `commit`: repo path -> file in the clone.
function expected(dir, commit, u) {
  git(dir, 'checkout', '-q', '--detach', commit)
  const skip = (u.exclude ?? []).map(p => new RegExp(p))
  const out = new Map()
  for (const [src, dest] of Object.entries(u.copy)) {
    const from = path.join(dir, src)
    const stat = fs.lstatSync(from)
    if (stat.isSymbolicLink()) throw new Error(`refusing symlink ${src}`)
    const list = stat.isDirectory() ? [...walk(from)].map(f => [`${src}/${f}`, f]) : [[src, path.basename(src)]]
    for (const [up, rel] of list) if (!skip.some(re => re.test(up))) out.set(`${dest}/${rel}`, path.join(dir, up))
    if (!out.has(`${dest}/LICENSE`)) out.set(`${dest}/LICENSE`, path.join(dir, u.license))
  }
  return out
}

function write(u, want) {
  for (const dest of Object.values(u.copy)) fs.rmSync(path.join(root, dest), { recursive: true, force: true })
  for (const [p, from] of want) {
    const to = path.join(root, p)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
    fs.chmodSync(to, fs.statSync(from).mode)
  }
}

const problems = []
const rows = []
for (const [name, u] of Object.entries(upstreams)) {
  if (mode !== 'sync') {
    const dir = fetch(u, [u.commit])
    const want = expected(dir, u.commit, u)
    if (mode === 'restore') write(u, want)
    const have = new Set()
    for (const dest of Object.values(u.copy)) {
      if (fs.existsSync(path.join(root, dest))) for (const f of walk(path.join(root, dest))) have.add(`${dest}/${f}`)
    }
    for (const [p, from] of want) {
      if (!have.delete(p)) problems.push(`${name}: missing ${p}`)
      else if (!fs.readFileSync(path.join(root, p)).equals(fs.readFileSync(from))) problems.push(`${name}: edited ${p}`)
    }
    for (const p of have) problems.push(`${name}: not from upstream ${p}`)
    fs.rmSync(dir, { recursive: true, force: true })
    continue
  }

  const head = git(root, 'ls-remote', url(u), 'HEAD').split('\t')[0]
  if (head === u.commit) continue
  const dir = fetch(u, u.commit ? [u.commit, head] : [head])
  const skip = (u.exclude ?? []).map(p => new RegExp(p))
  const used = [u.license, ...Object.keys(u.copy), ...(u.watch ?? [])]
  const changed = u.commit
    ? git(dir, 'diff', '--no-renames', '--name-only', u.commit, head, '--', ...used).split('\n').filter(f => f && !skip.some(re => re.test(f)))
    : ['(first sync)']
  if (changed.length) {
    const want = expected(dir, head, u)
    write(u, want)
    const watched = changed.filter(f => (u.watch ?? []).some(w => f === w || f.startsWith(`${w}/`)))
    const range = u.commit ? `[${u.commit.slice(0, 7)}…${head.slice(0, 7)}](https://github.com/${u.repo}/compare/${u.commit}...${head})` : `new at ${head.slice(0, 7)}`
    const count = u.commit ? changed.length - watched.length : want.size
    rows.push(`| ${name} | ${range} | ${count} | ${watched.map(f => `\`${f}\``).join(', ') || '–'} |`)
    u.commit = head
  }
  fs.rmSync(dir, { recursive: true, force: true })
}

if (mode !== 'sync') {
  for (const p of problems) console.error(p)
  console.log(problems.length ? `${problems.length} vendored files differ from upstreams.json.` : 'Every vendored file matches its pinned upstream commit.')
  process.exit(problems.length ? 1 : 0)
}
fs.writeFileSync(manifestFile, `${JSON.stringify(upstreams, null, 2)}\n`)
console.log(rows.length
  ? ['## Upstream sync', '', '| upstream | commits | vendored files changed | watched files changed (port by hand) |', '|---|---|---|---|', ...rows].join('\n')
  : 'All upstreams are current.')
