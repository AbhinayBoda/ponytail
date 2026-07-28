#!/usr/bin/env node
// The skeleton's one runnable check: fails if any rule/action copy drifts.
const fs = require('fs');
const path = require('path');

const read = p => fs.readFileSync(path.join(__dirname, p), 'utf8').replace(/\r\n/g, '\n').trim();
const stripFrontmatter = t => t.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();

let failed = false;
const fail = msg => { console.error(msg); failed = true; };

// The ruleset body is identical in all three always-on copies.
const canonical = read('AGENTS.md');
for (const p of ['.cursor/rules/ponytail.mdc', '.agents/rules/ponytail.md']) {
  if (stripFrontmatter(read(p)) !== canonical) fail(`${p} drifted from AGENTS.md`);
}

// Each action body is identical in its Cursor command and Antigravity skill.
for (const n of ['ponytail', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help']) {
  if (stripFrontmatter(read(`.agents/skills/${n}/SKILL.md`)) !== read(`.cursor/commands/${n}.md`)) {
    fail(`.agents/skills/${n}/SKILL.md drifted from .cursor/commands/${n}.md`);
  }
}

// Load-bearing phrases that a reword must not silently drop.
const INVARIANTS = [
  'in this codebase',
  'naive heuristic',
  'ONE runnable check',
  'flimsier algorithm',
  'input validation at trust boundaries',
  'prevents data loss',
  'security',
  'accessibility',
];
for (const [label, text] of [['.cursor/commands/ponytail.md', read('.cursor/commands/ponytail.md')], ['AGENTS.md', canonical]]) {
  for (const phrase of INVARIANTS) {
    if (!text.includes(phrase)) fail(`${label} is missing rule invariant: "${phrase}"`);
  }
}

if (failed) {
  console.error('Update the drifted copy so the shared text matches.');
  process.exit(1);
}
console.log(`All rule and action copies match; ${INVARIANTS.length} invariants present.`);
