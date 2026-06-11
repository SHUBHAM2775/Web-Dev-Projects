# Student Life Dashboard

A modular student workspace with native HTML5 drag-and-drop widget grid, Pomodoro timer, Kanban task board, habit streak tracker, exam countdown, sticky notes, GitHub-style contribution grid, and daily motivation — built with vanilla HTML5/CSS3/JS.

## Features

- **Drag-and-Drop Grid** — Native HTML5 DnD (`draggable`, `ondragstart`, `ondragover`, `ondrop`) across all 7 widgets. Layout order persisted in `localStorage`.
- **Pomodoro Timer** — 25min focus / 5min break cycle with SVG ring countdown, start/pause/reset controls.
- **Task Kanban** — Add/delete/check tasks with live completion fraction and productivity score.
- **Habit Streak** — 28-day grid with click-to-toggle dots, running streak counter.
- **Exam Countdown** — Pre-seeded academic milestones with remaining-days display.
- **Sticky Notes** — Auto-saving textarea with dirty/saved indicator.
- **Contribution Grid** — Mock GitHub-style activity heatmap.
- **Motivational Quotes** — Randomized quote cycling from 7 curated entries.
- **Persistence** — Full `localStorage` serialization of layout positions, tasks, habits, and notes. Seed data auto-loads on first visit.

## UI/UX

Dark terminal (`#05060b`), glassmorphic widgets, neon cyan/emerald/pink accents, responsive `auto-fit` grid → single column on mobile.

## Usage

Open `index.html`. Drag widgets by the handle (☰) to rearrange. Interact with each module independently. Use **Reset Layout** to restore defaults, **Purge Storage** to clear all data and reload.
