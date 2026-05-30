# Roadmap — PromptDesk

_Status: active · updated 2026-05-30_

A minimalist browser-based AI desktop — notes, folders, and chat windows wired to
OpenAI, Claude, or Gemini, with everything stored locally. Vanilla HTML/CSS/JS,
no build step. See `next-steps.md` for the detailed feature backlog.

## Shipped

- [x] Desktop UI with draggable files and folders
- [x] File & folder management (create, rename, delete, drag-drop, context menus)
- [x] Chat windows for AI conversations
- [x] Multi-LLM support (OpenAI, Claude, Gemini)
- [x] API configuration modal (per-provider keys + default model)
- [x] Local persistence (localStorage)
- [x] Dark mode toggle with theme animations
- [x] Chat message timestamps (relative formatting)
- [x] File-type indicators (emoji icons)
- [x] Folder windows (double-click to open)
- [x] Direct file editing modal
- [x] AI responses auto-saved as new files
- [x] Loading states during API calls

## Next

- [ ] Keyboard shortcuts (Ctrl+N, F2, Delete, Escape, …)
- [ ] Search across files (Ctrl+F with match highlighting)
- [ ] Markdown support with preview mode
- [ ] Export / import (JSON or ZIP backup & restore)
- [ ] Better error handling with retry on API failures

## Backlog

- [ ] Prompt templates library (Writing, Coding, Analysis, Creative)
- [ ] Chat history management (clear, export, search within chat)
- [ ] Multi-select files + bulk operations
- [ ] Undo / redo for file operations
- [ ] Cloud sync via Firebase (auth, multi-device)
- [ ] Custom themes (import/export as JSON)
- [ ] AI model comparison (side-by-side responses)
- [ ] Plugin system for community extensions
- [ ] PWA support (offline, installable)
- [ ] TypeScript migration + unit / E2E tests
- [ ] Accessibility (ARIA labels, screen reader, high contrast)
