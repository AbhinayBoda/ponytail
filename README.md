# Ponytail — skeleton edition

Makes your AI agent think like the laziest senior dev in the room. Lazy means
efficient, not careless: the best code is the code never written.

This is a sanitized, skimmed-to-the-bone cut of
[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) for
**Cursor** and **Antigravity** (plus anything that reads `AGENTS.md`).
Everything here is plain markdown. Nothing installs, nothing executes, no
hooks, no network, no config files, no environment variables.

## What changed

Kept — the full behavior of the original:

- **The ruleset** (the 7-rung ladder, the rules, the safety carve-outs), as an
  always-on rule for Cursor (`.cursor/rules/ponytail.mdc`), Antigravity
  (`.agents/rules/ponytail.md`), and every `AGENTS.md`-reading agent
  (`AGENTS.md`).
- **Five actions**, word-for-word from the original skills: `ponytail`,
  `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-help`. They
  ship twice — as Cursor slash commands (`.cursor/commands/`) and as
  Antigravity skills (`.agents/skills/*/SKILL.md`) — and a checker keeps the
  copies identical.

New in this edition:

- **Three read-only subagents** for Cursor (`.cursor/agents/`):
  `ponytail-reviewer`, `ponytail-auditor`, `ponytail-gatekeeper`.
- **A prime checklist** (`CHECKLIST.md`) every change must pass; the
  gatekeeper subagent enforces it.

Removed — everything that wasn't the behavior:

- All installers and runtime code: lifecycle hooks, plugin manifests for 15+
  other hosts (Claude Code, Codex, OpenCode, Gemini, Qoder, Devin, OpenClaw,
  Kiro, Windsurf, Cline, pi, Hermes, …), the MCP server, npm packaging,
  publish/uninstall scripts, CI workflows.
- All marketing: badges, logos, sponsor and waitlist banners, star history,
  benchmark suite and result writeups, translations, examples.
- `/ponytail-gain` (its scoreboard quoted the deleted benchmarks) and the
  hook-persisted default-mode machinery — intensity is now set per
  conversation with `/ponytail lite|full|ultra`, default `full`.

## How to set up (no installation)

One link:
**<https://github.com/AbhinayBoda/ponytail/tree/cursor/ponytail-skeleton-bc73>**

From the root of any workspace, copy four paths out of it:

```bash
git clone --depth 1 --branch cursor/ponytail-skeleton-bc73 https://github.com/AbhinayBoda/ponytail /tmp/ponytail \
  && cp -r /tmp/ponytail/.cursor /tmp/ponytail/.agents /tmp/ponytail/AGENTS.md /tmp/ponytail/CHECKLIST.md . \
  && rm -rf /tmp/ponytail
```

That is the whole setup. Start a new chat and ponytail is active.

| Your editor | What loads it automatically | What you get |
|---|---|---|
| Cursor | `.cursor/rules/` (always-on), `.cursor/commands/`, `.cursor/agents/`, `AGENTS.md` | rule + 5 slash commands + 3 subagents |
| Antigravity | `.agents/rules/` (always-on), `.agents/skills/`, `AGENTS.md` | rule + 5 skills |
| Anything else that reads `AGENTS.md` (Codex, Copilot, Zed, Amp, Jules, …) | `AGENTS.md` | the always-on rule |

Already have an `AGENTS.md`? Skip copying it and paste the ruleset section in
instead; the `.cursor/` and `.agents/` folders merge cleanly with existing ones.

Uninstall = delete the copied files.

## How to use — actions at your disposal

The rule is always on; you never have to invoke anything for normal work. The
actions aim it at a specific job:

| Action | What it does |
|--------|--------------|
| `ponytail` | Lazy mode itself. Set intensity (`lite`/`full`/`ultra`) or turn it `off`. |
| `ponytail-review` | Reviews the current diff for over-engineering, hands back a delete-list. |
| `ponytail-audit` | Audits the whole repo for bloat, ranked biggest cut first. |
| `ponytail-debt` | Harvests deferred `ponytail:` shortcut comments into a ledger. |
| `ponytail-help` | Quick-reference card for all of the above. |

| Subagent (Cursor) | What it does |
|--------|--------------|
| `ponytail-reviewer` | Diff review in its own context window. Read-only. |
| `ponytail-auditor` | Repo-wide bloat audit in its own context window. Read-only. |
| `ponytail-gatekeeper` | Checks the change against `CHECKLIST.md`, pass/fail per item, ship/fix-first verdict. Read-only. |

## How to invoke an action in chat

**Cursor** — type the slash command, or just say it in plain words; the agent
routes to the right action either way:

- `/ponytail-review` — or "review this diff for over-engineering", "what can we delete?"
- `/ponytail-audit` — or "find bloat in this repo"
- `/ponytail-debt` — or "what did we defer?", "show the shortcut ledger"
- `/ponytail ultra` — or "be maximally lazy"; `/ponytail off` — or "stop ponytail" / "normal mode"
- `/ponytail-help` — or "how do I use ponytail?"

**Cursor subagents** — ask for them by name and the agent delegates:
"have `ponytail-gatekeeper` check this before I commit",
"run `ponytail-auditor` on the whole repo",
"send this diff to `ponytail-reviewer`".

**Antigravity** — the same five actions are skills, auto-discovered from
`.agents/skills/`. Type the action name as a chat message (`/ponytail-review`)
or describe the job ("audit this codebase for over-engineering") and the agent
picks the skill up from its description.

## The prime checklist

[`CHECKLIST.md`](CHECKLIST.md) is the ten-point gate every change must meet:
understood first, ladder run, no new deps, no unrequested abstraction, root
cause not symptom, safety intact, corners marked, one runnable check, lean
output, shortest understood diff. Run it any time with "gatekeeper check" in
Cursor, or paste it into any review elsewhere.

## Keeping the copies honest

The ruleset lives in three files and each action in two. `node check.js`
fails if any copy drifts. Only needed when you edit the rule text; normal use
never runs code.

## License

[MIT](LICENSE), same as the original by Dietrich Gebert.
