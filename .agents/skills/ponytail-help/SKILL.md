---
name: ponytail-help
description: >
  Quick-reference card for all ponytail levels, actions, and subagents.
  One-shot display, not a persistent mode. Trigger: /ponytail-help,
  "ponytail help", "what ponytail commands", "how do I use ponytail".
---

# Ponytail Help

Display this reference card when invoked. One-shot: do NOT change mode or
persist anything.

## Levels

| Level | Trigger | What change |
|-------|---------|-------------|
| **Lite** | `/ponytail lite` | Build what's asked, name the lazier alternative in one line. |
| **Full** | `/ponytail` | The ladder enforced: YAGNI → reuse → stdlib → native → one line → minimum. Default. |
| **Ultra** | `/ponytail ultra` | YAGNI extremist. Deletion before addition. Challenges requirements before building. |

Level sticks until changed or the conversation ends.

## Actions

| Action | Invoke | What it does |
|--------|--------|--------------|
| **ponytail** | `/ponytail [lite\|full\|ultra\|off]` | Lazy mode itself. Simplest solution that works. |
| **ponytail-review** | `/ponytail-review` | Over-engineering review of the diff: `L42: yagni: factory, one product. Inline.` |
| **ponytail-audit** | `/ponytail-audit` | Whole-repo over-engineering audit: ranked list of what to delete. |
| **ponytail-debt** | `/ponytail-debt` | Harvest `ponytail:` shortcut comments into a tracked ledger. |
| **ponytail-help** | `/ponytail-help` | This card. |

Plain words work too: "review this diff for over-engineering", "find bloat in
this repo", "what did we defer".

## Subagents (Cursor)

| Subagent | What it does |
|----------|--------------|
| **ponytail-reviewer** | Reviews the current diff for over-engineering. Read-only. |
| **ponytail-auditor** | Audits the whole repo for bloat, ranked delete-list. Read-only. |
| **ponytail-gatekeeper** | Checks the current change against `CHECKLIST.md`, pass/fail per item. Read-only. |

Ask for them by name ("have ponytail-gatekeeper check this before I commit")
or let the agent delegate from their descriptions.

## Deactivate

Say "stop ponytail" or "normal mode". Resume anytime with `/ponytail`.
`/ponytail off` also works.
