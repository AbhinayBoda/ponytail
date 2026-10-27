# Lean Agent Toolkit

Nineteen agent skills that make a coding agent write less code, spend fewer
tokens and keep its context clean. They are collected from nine open-source
projects, trimmed to what does the work, checked, and laid out so the same
files work in Cursor, Antigravity, Claude Code, Codex and any agent that reads
`AGENTS.md`. Nothing to install: Markdown plus a few zero-dependency scripts.

- Agents read [AGENTS.md](AGENTS.md): the always-on rules, and which skill fits which job.
- Humans read [HUMAN.md](HUMAN.md): setup, invoking skills in each tool, updates, tests.

## Set up

From the root of any project:

```bash
git clone --depth 1 --branch cursor/agent-toolkit-monorepo-bc73 https://github.com/AbhinayBoda/ponytail /tmp/toolkit \
  && cp -r /tmp/toolkit/.agents /tmp/toolkit/AGENTS.md . \
  && mkdir -p .cursor && cp -r /tmp/toolkit/.cursor/agents .cursor/ \
  && rm -rf /tmp/toolkit
```

Start a new chat. Already have an `AGENTS.md`, want only some skills, or use
Claude Code? See [HUMAN.md](HUMAN.md#set-up).

## What is inside

Type `/name` in the chat (`$name` in Codex), or just describe the job: agents
pick skills from their descriptions.

| Skill | What it does | Needs | From |
|---|---|---|---|
| `ponytail` | The smallest complete change; always on through `AGENTS.md`. `/ponytail lite`, `full`, `ultra`. | nothing | [ponytail](https://github.com/DietrichGebert/ponytail) |
| `ponytail-review` | Reviews a change: bugs, security, load, missing tests, speed, what to cut, in plain English. | nothing | [ponytail](https://github.com/DietrichGebert/ponytail) |
| `ponytail-audit` | The same review for a whole repo, ranked. | nothing | [ponytail](https://github.com/DietrichGebert/ponytail) |
| `ponytail-debt` | Lists every `shortcut:` comment as a debt ledger. | git | [ponytail](https://github.com/DietrichGebert/ponytail) |
| `rpi` | Research, design, then implement through local documents, one phase per fresh session. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `learn` | Learning mode: you design, the agent explains concepts and writes the agreed code. | nothing | [vibe-wise](https://github.com/nykooi1/vibe-wise) |
| `reset` | Backs up and clears the `learn` notes, after a preview and your confirmation. | Python 3 | [vibe-wise](https://github.com/nykooi1/vibe-wise) |
| `security-audit` | Security guidance, or a full multi-agent audit with verified findings when you ask for one. | Node | [security-audit-skill](https://github.com/cloudflare/security-audit-skill) |
| `show-me` | Explains the current topic with small diagrams, code-shape sketches and HTML. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `archify` | Interactive HTML diagrams and one-page explainers, validated before delivery. | Node 18+, Chrome | [archify](https://github.com/tt-a1i/archify) |
| `visual-pr` | Creates or updates a pull request with a visual outline. | `gh` | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `brag-slim` | A short launch video of your project, with music and share copy. | Node, FFmpeg | [brag](https://github.com/latent-spaces/brag) |
| `toon` | Encodes JSON records as TOON before they go into a prompt. | Node 22.18+ | [toon](https://github.com/toon-format/toon) |
| `lean-shell` | Terse command output: snip's filters as habits, no binary needed. | nothing | idea from [snip](https://github.com/edouard-claude/snip) |
| `fast-browser` | Reads a web page as a numbered table of controls instead of screenshots. | a browser tool | [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) |
| `improve-claude-md` | Rewrites an instruction file with `<important if>` blocks. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `build-iterated-agentic-loop` | Builds a scheduled coding-agent workflow with its skill, prompt and memory. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `design-control-loop` | Designs an agentic control loop (sensor, controller, actuator) and builds it. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |
| `narrow-react-prop-types` | Narrows React prop types to the code paths that really run. | nothing | [humanlayer/skills](https://github.com/humanlayer/skills) |

Cursor users also get four read-only subagents in `.cursor/agents/`:
`ponytail-reviewer`, `ponytail-auditor`, `security-auditor` and
`ponytail-gatekeeper`, which checks a change against [CHECKLIST.md](CHECKLIST.md).

## How the pieces fit

Several tools touch the same jobs; [AGENTS.md](AGENTS.md#when-skills-overlap)
tells the agent which one leads:

- **Diagrams.** `show-me` sketches in the chat, `learn` draws compact text maps
  without giving away the design, `archify` turns either into an interactive
  page to keep or share.
- **Reviews.** `ponytail-review` on every change (security is one of six
  checks), `security-audit` when you want security depth.
- **Building.** `learn` decides who designs, `rpi` decides how the work is
  staged, `ponytail` decides how little code it takes.
- **Context.** `lean-shell` for command output, `toon` for data, `fast-browser`
  for web pages, `rpi` for long work split across sessions.

## Credits

Every vendored folder keeps its upstream `LICENSE` (MIT, or Apache-2.0 for
archify). [upstreams.json](upstreams.json) pins the exact commit each one came
from, and a daily job proposes updates as pull requests ([HUMAN.md](HUMAN.md#updates)).
The toolkit's own files are [MIT](LICENSE).
