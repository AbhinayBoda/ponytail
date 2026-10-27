---
name: toon
description: Encode JSON as TOON (Token-Oriented Object Notation) before it goes into a prompt, a subagent brief, or a context file. Use when you pass lists of same-shaped records (rows, logs, search hits, API responses, test results) to a model, or when the user mentions TOON or wants fewer tokens for structured data. Not for deeply nested or irregular data, where JSON is often smaller.
---

# TOON

TOON is a lossless, compact text form of the JSON data model. A list of same-shaped
objects becomes a table: the field names are written once in a header, then one
line per record. Most of JSON's quotes, braces and repeated keys disappear.

```toon
tasks[3]{id,title,state,owner}:
  1,Fix login,open,ada
  2,Ship v2,done,bob
  3,Write docs,open,cy
environments[2:]{region,replicas,debug}:
  production: eu-central-1,6,false
  staging: eu-central-1,2,true
```

The same data is 539 bytes of pretty JSON (328 minified); the TOON above is 205.

## Convert with the bundled encoder

`toon.mjs` in this skill's folder wraps the official TOON library (vendored in
`vendor/`, no install, needs Node 22.18 or newer):

```bash
node .agents/skills/toon/toon.mjs data.json            # JSON -> TOON
node .agents/skills/toon/toon.mjs --decode data.toon   # TOON -> JSON
some-command --json | node .agents/skills/toon/toon.mjs  # stdin works too
```

Convert with the script rather than writing TOON by hand: quoting rules for
commas, colons and leading spaces are easy to get wrong.

## When it pays

- Arrays of objects with the same keys: the biggest win.
- Objects whose values are same-shaped objects (config maps, records by ID):
  keyed tables, `name[N:]{fields}:`.
- Deeply nested or irregular data: keep JSON, TOON can be larger.
- Data a program will parse: keep JSON. TOON is for model input.

## Tell the model how to read it

Models read TOON well once they see the header. Put the data in a ` ```toon `
fence and explain the header once: `name[N]{fields}:` is a table of N rows, one
comma-separated row per line.

To get TOON back from a model, show the exact header you expect (for example
`results[N]{file,line,message}:`) and run its answer through `--decode`: a wrong
row count or a broken row fails loudly instead of silently.

Edge cases and the full grammar: https://github.com/toon-format/spec
