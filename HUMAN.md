# Using the toolkit

What you get: one always-on rule file (`AGENTS.md`), nineteen skills in
`.agents/skills/`, and, for Cursor, four read-only subagents in `.cursor/agents/`.
No installer, no hooks, no background process, no network calls of its own.

## Set up

### Into one project

From the project root:

```bash
git clone --depth 1 --branch cursor/agent-toolkit-monorepo-bc73 https://github.com/AbhinayBoda/ponytail /tmp/toolkit \
  && cp -r /tmp/toolkit/.agents /tmp/toolkit/AGENTS.md . \
  && mkdir -p .cursor && cp -r /tmp/toolkit/.cursor/agents .cursor/ \
  && rm -rf /tmp/toolkit
```

Start a new chat so the tool picks up the files. Remove the toolkit by deleting
what you copied.

### Only some skills

Every skill is one self-contained folder. Copy the ones you want:

```bash
mkdir -p .agents/skills && cp -r /tmp/toolkit/.agents/skills/{ponytail,toon,lean-shell} .agents/skills/
```

The rules in `AGENTS.md` mention every skill; a row for a skill you did not copy
is harmless, or delete it.

### You already have an AGENTS.md

Append ours instead of copying it: `cat /tmp/toolkit/AGENTS.md >> AGENTS.md`.

### Claude Code

Claude Code reads `AGENTS.md` when the project has no `CLAUDE.md` (if it has one,
add the line `@AGENTS.md` to it), but it only loads skills from `.claude/skills/`.
Point that at the same folder:

```bash
mkdir -p .claude && ln -s ../.agents/skills .claude/skills   # Windows: copy the folder instead
```

Cursor also reads `.claude/skills/`, so in a project you open in both tools you
may see each skill listed twice. It is the same file either way.

### Every project on your machine

Copy the skill folders into your tool's personal skills folder instead of the
project: `~/.agents/skills/` or `~/.cursor/skills/` (Cursor), `~/.gemini/config/skills/`
(Antigravity), `~/.claude/skills/` (Claude Code). The rules go in Antigravity's
`~/.gemini/AGENTS.md`, Claude Code's `~/.claude/CLAUDE.md`, or Cursor's User Rules
in Settings.

## Use it

You rarely need to invoke anything: the rules are always on, and the agent
picks a skill when your request matches its description. To call one
explicitly:

| Tool | Rules from | Skills from | Call a skill | Subagents |
|---|---|---|---|---|
| Cursor | `AGENTS.md` | `.agents/skills/` | `/ponytail-review` | `.cursor/agents/`: "have ponytail-gatekeeper check this" |
| Antigravity | `AGENTS.md` | `.agents/skills/` | type `/ponytail-review` or describe the job | none |
| Claude Code | `AGENTS.md` (no `CLAUDE.md`) | `.claude/skills/`, linked above | `/ponytail-review` | none shipped |
| Codex | `AGENTS.md` | `.agents/skills/` | `$ponytail-review` | none |

Plain words work everywhere: "review my last commit", "audit this repo for
bloat", "draw how a request reaches the database", "teach me while we build
this", "security audit ./src", "make a launch video".

### What each skill needs, and what it touches

| Skill | Needs | Writes or sends |
|---|---|---|
| `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `show-me`, `improve-claude-md`, `narrow-react-prop-types`, `build-iterated-agentic-loop`, `design-control-loop`, `lean-shell` | nothing | only what you ask for |
| `rpi` | nothing | documents in `.agents/artifacts/` (its authors suggest not committing them) |
| `learn`, `reset` | Python 3 for `reset` | notes in `.vibe-wise/`; `reset` backs them up before clearing |
| `security-audit` | Node | guidance in chat; a full audit writes to `~/security-audit-skill/<repo>/` and runs target code only inside a sandbox you provide |
| `archify` | Node 18+, Chrome for its browser check | HTML into `.archify/`. Its `finalize` step checks GitHub Pages for a newer archify version; set `ARCHIFY_UPDATE_CHECK_DISABLED=1` to skip that |
| `visual-pr` | `gh`, signed in | a pull request on your remote |
| `brag-slim` | Node, FFmpeg | `brag-output/`; reads your code but skips env files, keys and credentials |
| `toon` | Node 22.18+ | nothing; prints to stdout |
| `fast-browser` | a browser tool that can run JavaScript | nothing; never lists password, file or hidden inputs |

## Updates

Each tool stays in its own upstream repo. `upstreams.json` records, for each
one, the exact commit we took, the files we copy (byte for byte, licence
included) and the files we only watch because our own text is based on them.

`.github/workflows/sync.yml` runs every day at 06:17 UTC and on demand:

1. A read-only job asks each upstream for its latest commit. If anything we
   copy or watch changed, it re-vendors those files and runs every check.
2. A second job, the only one allowed to write, opens one pull request,
   `upstream-sync`, with a table of what changed, links to each upstream diff,
   the check results, and the watched files to port by hand. It never merges,
   and while that pull request is open later runs leave it alone, so fixes you
   push to it are safe. Merge or close it to get the next one.

Review that pull request with [CHECKLIST.md](CHECKLIST.md) ("Every upstream
sync"): upstream text becomes instructions your agent follows, so read it like
code. One-time setup: merge this repo to its default branch (GitHub runs
schedules only there) and allow Actions to open pull requests (Settings,
Actions, General, Workflow permissions). Pull requests opened by a workflow do
not trigger other workflows, which is why the check results are in the pull
request body.

By hand: `node scripts/sync.mjs` updates everything, `--check` reports drift,
`--restore` puts the pinned files back. To add an upstream, add an entry with
`"commit": ""` and run the sync.

## Tests

```bash
node scripts/check.mjs        # Node 22.18+, no network, about two seconds
node scripts/sync.mjs --check # every vendored file still matches its pinned upstream commit
```

Each check prints one line saying what it guarantees, then `PASS`, `FAIL` or
`SKIP`; a failure lists what to fix. The browser check skips when Chrome is not
installed. The run ends with the context cost per turn. `.github/workflows/check.yml`
runs both commands on every push and pull request.

## Why skills, and not plugins or MCP

| | Skills folder (this repo) | Host plugins | MCP server |
|---|---|---|---|
| Setup | copy files | a marketplace install per tool | install and run a server, configure each tool |
| Works in | every skills-capable tool, from one folder | the tool the plugin was built for | any MCP client |
| Cost every turn | name and description only | the same, plus whatever hooks inject | every tool's schema |
| Runs code on its own | no | hooks can | yes, a server process |
| Updates | the sync pull request above | the marketplace | the server's release |

`node scripts/check.mjs` measures the per-turn cost: about 1,500 tokens for
`AGENTS.md` plus 1,300 for the skill index, against roughly 34,500 if the same
nineteen skills were always-on rules.

## Layout

```text
AGENTS.md              rules every agent reads, and which skill fits which job
HUMAN.md               this guide
README.md              what is inside
CHECKLIST.md           the gate for every change and every upstream sync
upstreams.json         where each vendored folder comes from, pinned to a commit
.agents/skills/        the nineteen skills
.cursor/agents/        Cursor subagents
scripts/check.mjs      the tests
scripts/sync.mjs       the vendoring
.github/workflows/     check on every push, sync every day
```
