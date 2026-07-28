# Prime checklist

The gate every change must pass before it ships. The `ponytail-gatekeeper`
subagent runs this list for you; you can also paste it into any review.

1. **Understood first.** The task was read fully and the real flow traced end
   to end — every file the change touches — before any code was written.
2. **Ladder run.** The change stops at the first rung that holds: not needed
   (YAGNI) → already in this codebase → stdlib → native platform feature →
   already-installed dependency → one line → minimum code that works.
3. **No new dependency** unless nothing on the ladder covered it.
4. **No unrequested abstraction or boilerplate.** No interface with one
   implementation, no factory for one product, no config for a value that
   never changes, no scaffolding "for later".
5. **Root cause, not symptom.** For bug fixes: every caller of the touched
   function was checked, and the fix lives where all callers route through.
6. **Safety intact.** Input validation at trust boundaries, error handling
   that prevents data loss, security, and accessibility were never
   simplified away.
7. **Corners are marked.** Every deliberate simplification with a real
   ceiling carries a `ponytail:` comment naming the ceiling and the upgrade
   trigger.
8. **One runnable check exists** for any non-trivial logic — the smallest
   thing that fails if the logic breaks. No frameworks, no fixtures. Trivial
   one-liners are exempt.
9. **Output is lean.** Code first, then at most three short lines: what was
   skipped, when to add it.
10. **The diff is the shortest one you understand.** Smaller-but-wrong is a
    second bug, not laziness.
