#!/usr/bin/env node
// JSON -> TOON, or TOON -> JSON with --decode. Reads a file argument or stdin. Needs Node 22.18+.
import fs from 'node:fs'
import { decode, encode } from './vendor/index.ts'

const args = process.argv.slice(2)
const input = fs.readFileSync(args.find(a => !a.startsWith('--')) ?? 0, 'utf8')
process.stdout.write(args.includes('--decode') ? `${JSON.stringify(decode(input), null, 2)}\n` : `${encode(JSON.parse(input))}\n`)
