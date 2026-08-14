# Cafe Flow

A bilingual (EN/ES) cafe shift-checklist app with a staff view (tap-to-complete
tasks, photo-proof capture), a manager view (team progress, task detail, staff
management), and a weekly Schedule tab.

Every task carries the weekdays it runs on (`days`, Mon=0 … Sun=6), and the
day's checklist is simply the tasks whose days include today. The **Schedule**
tab is the single place tasks are added, edited and removed — there is no
separate "recurring task" concept, since a task on several days *is* a
recurring one. Editing is manager-only; staff can tick tasks off and undo.

The app opens on a 4-digit passcode numpad: **manager 1234, staff 5678** (demo
codes, defined in `CODES` at the top of `app.js`). Staff unlock into the
checklist only; managers also get the Staff/Manager view tabs.

Implemented from the Claude Design project "Cafe Flow.dc.html"
(https://claude.ai/design/p/836f332d-2640-43ce-9add-b0b1d85be8af), using the
"Organic" design system it imports.

## Files

- `index.html` — page shell and the design's page-level CSS (animations, responsive grids)
- `styles.css` — the Organic design-system tokens and component classes, verbatim
- `app.js` — the app: data, i18n strings, state, and rendering (plain JS, no build step)
- `server.js` — minimal static server for local preview (no dependencies)

## Run

```
node server.js
```

Then open http://localhost:4173. Any static file server pointed at this folder
works too — the app itself is fully static.
