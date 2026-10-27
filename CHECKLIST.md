# Prime checklist

Two gates. The `ponytail-gatekeeper` subagent runs the first one for you; paste
either one into any review elsewhere.

## Every change

1. **Scope first.** Before any code, every place the change must reach was
   listed: callers, tests, fixtures, config, exports, and what it could break
   for users.
2. **Smallest complete change.** It stops at the first option that fully
   works: not needed, already in this codebase, standard library or platform,
   an installed dependency, one readable line, then the minimum code.
3. **Nothing extra.** No abstraction, wrapper, option, config, boilerplate or
   "for later" code nobody asked for, and no new dependency for a few lines.
4. **Finished, not just small.** The callers, tests and fixtures the change
   breaks are updated in the same change.
5. **Root cause.** A bug fix checked every caller and fixed the shared code
   once.
6. **Never cut.** Validation at trust boundaries, error handling that prevents
   data loss, security, accessibility, hardware calibration, anything the user
   asked for.
7. **One check.** New non-trivial logic has one small test or assert-based
   self-check that fails when the logic breaks.
8. **Shortcuts marked.** A known limit carries `shortcut: <the limit>, <when to
   upgrade>`.
9. **Honest reply.** It ends with what was skipped or not checked, and any risk
   the user must know.

## Every upstream sync

1. **Checks pass.** The pull request body shows `node scripts/check.mjs`
   passing. A failure names the file to fix.
2. **Read it like code.** Upstream text becomes instructions an agent follows.
   Look for new scripts, network calls or URLs, commands that download and run
   something, and text telling the agent to skip its rules or hide something
   from the user.
3. **Watched files ported.** Each watched file listed in the pull request was
   either ported into our own files or consciously skipped.
4. **Still lean.** New files in a vendored folder are needed at run time;
   anything else becomes an `exclude` in `upstreams.json`.
