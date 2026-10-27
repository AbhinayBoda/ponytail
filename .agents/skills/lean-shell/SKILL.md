---
name: lean-shell
description: Keep shell output small before it reaches the context window - terse flags, capped output, summaries instead of logs (the ideas behind the snip output filter, with nothing to install). Use whenever you run git, tests, builds, installs, linters, docker, kubectl, find, grep or ls and the output could run long, or when the user asks to save tokens or context.
---

# Lean shell

Every line a command prints lands in your context and stays there. Ask the tool
for the short form first; fetch the long form only for the part you need.

## Ask for the short form

| Instead of | Run | You get |
|---|---|---|
| `git status` | `git status --short --branch` | one line per file |
| `git log` | `git log --oneline -n 10` | hash and subject |
| `git diff` | `git diff --stat --stat-count=30`, then `git diff -- <file>` | what changed, before any patch |
| `git show <rev>` | `git show --stat --stat-count=30 <rev>` | header and file list |
| `pytest` | `pytest -q --tb=line` | one line per failure |
| `go test -v ./...` | `go test ./...`, then `go test -run 'TestName' -v ./pkg` | one line per package |
| `cargo test` | `cargo test -q` | dots and the summary |
| `npx jest` | `npx jest --silent` | results without console noise |
| `npx vitest` | `npx vitest run --reporter=dot` | dots and failures |
| `npx tsc` | `npx tsc --noEmit --pretty false` | one line per error |
| `npx eslint .` | `npx eslint . --quiet` | errors only |
| `make` | `make -s` | no echoed commands |
| `npm install` | `npm install --no-fund --no-audit --loglevel=error` | errors only |
| `pip install ...` | `pip install -q ...` | errors only |
| `docker logs <c>` | `docker logs --tail 100 <c>` | the recent end |
| `kubectl get pods` | `kubectl get pods --field-selector=status.phase!=Running` | only the broken ones |
| `ls -R`, `find .` | `git ls-files \| head -n 50`, `find . -maxdepth 2 -type f \| head -n 50` | a bounded list |
| `grep -r x .` | `rg -n -m 5 x \| head -n 40` | five hits per file, at most 40 |

## Cap the rest

- Unknown or chatty command: `cmd 2>&1 | tail -n 40`. Errors and summaries are
  usually at the end.
- Long lines (minified files, one-line JSON): `| cut -c1-200`.
- Repeated log lines: `| sort | uniq -c | sort -rn | head -n 20`.
- Big JSON: look at its shape first (`| jq 'keys'`, `| jq '.items | length'`),
  and hand records to a model as TOON (the `toon` skill).

## Never hide a failure

A pipe reports the exit code of its last command, so `failing-cmd | tail` looks
like success. In bash run `set -o pipefail` first. Prefer `tail` for capping:
`head` stops reading early and can make a passing command exit 141 under
`pipefail`. When a step fails, read its full error text before you shorten
anything.

## With snip installed

If `snip` is on `PATH` (https://github.com/edouard-claude/snip), prefix commands
with it (`snip git log`, `snip go test ./...`) and its 130+ tested filters do
the shortening; `snip gain` shows the tokens saved. Without it, the table above
is the manual version.
