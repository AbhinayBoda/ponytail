---
name: fast-browser
description: Drive web pages with few tokens and few round trips - read the page as a numbered table of visible controls plus visible text (the Jev Ultrafast snapshot), act on one numbered control, and verify the outcome yourself. Use when you control a browser through any tool that can run JavaScript in the page (Playwright, Chrome DevTools, a built-in browser tool) to fill forms, click through flows, or check what a page shows.
---

# Fast browser

Screenshots and full DOM or accessibility dumps are the most expensive way to
see a page. `vendor/snapshot.js` (from browser-use/jev-ultrafast) reads the page
in one call and returns only what you can act on:

- `actions`: up to 250 visible, enabled controls. Each has an `id` (`e1`, `e2`,
  ...), a `kind` (`click`, `fill`, `select`, `scroll`, `wait`), a `label`, the
  current `value`, and a `node` number that points at the live element.
  Password, file and hidden inputs are never listed.
- `text`: the visible text of the viewport, at most 6,000 characters.
- `url`, `title`, and `omitted_actions` when more than 250 controls exist.

## 1. Install the snapshot once per page load

Evaluate this in the page, with the full contents of `vendor/snapshot.js` in
place of `SNAPSHOT`. Reloads and navigations clear it; step 2 tells you when.

```js
window.__jevSnap = () => SNAPSHOT
```

## 2. Read the page

```js
(s => s === undefined ? 'NO SNAPSHOT: run step 1 on this page' : s === null ? 'PAGE NOT READY' : [
  `${s.title} | ${s.url}${s.omitted_actions ? ` | ${s.omitted_actions} controls not listed` : ''}`,
  ...s.actions.map(a => [a.id, a.kind, a.role, JSON.stringify(a.label), a.value ? `= ${JSON.stringify(a.value)}` : '', a.node ? `#${a.node}` : ''].filter(Boolean).join(' ')),
  '--- visible text ---',
  s.text,
].join('\n'))(window.__jevSnap?.())
```

The result is a few hundred tokens: one line per control, then the text.

## 3. Act on one control, then read again

Use the `node` number (`#12`) from the table, never a selector or coordinates
you made up from page text.

- `click`: `window.__jevFast.nodes.get(12).click()`
- `fill`: focus it (`window.__jevFast.nodes.get(12).focus()`) and type with your
  browser tool's keyboard. Without one, set the value so frameworks notice:
  `(e => { Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value').set.call(e, 'London'); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })) })(window.__jevFast.nodes.get(12))`
- `select`: `(e => { e.value = 'OPTION_VALUE'; e.dispatchEvent(new Event('change', { bubbles: true })) })(window.__jevFast.nodes.get(12))`
  with the action's `value`.
- `scroll`: `scrollBy(0, 560)` or `scrollBy(0, -560)`. `wait`: pause briefly.

After typing into a search box or combobox, give suggestions about 200 ms to
appear before the next read.

## Rules

- One decision per read: one operation on one listed control.
- An action that changes something (submit, pay, send, delete) runs once. If the
  page changed under you, read again instead of retrying.
- Your own "done" is not proof. Check the outcome on the page (URL, field values,
  result text) before you report success.
- Not covered: iframes, shadow roots, canvas, file uploads, pop-up windows. Use
  your browser tool's own methods there.

The full Jev agent (one model call per step, about 7 seconds for a real Google
Flights search) needs `uv` and API keys: https://github.com/browser-use/jev-ultrafast
