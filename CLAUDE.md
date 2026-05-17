# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

PromptDesk is a **zero-build, pure-browser** single-page app. There is no bundler, no Node runtime, no test runner, and no lint config. `package-lock.json` is intentionally empty — there are no JS dependencies. The whole app is three files:

- `index.html` — markup, modals, context menu, chat-window template
- `app.js` — all behavior (~1200 lines, single `DOMContentLoaded` IIFE)
- `styles.css` — styling, dark-mode rules

Do not introduce a build step, framework, or npm dependency without an explicit request — keeping the project copy-paste runnable is a core design choice.

## Running it

Open `index.html` directly, or serve the directory:

```bash
python -m http.server 8000   # then visit http://localhost:8000
```

There are no build, lint, or test commands. "Testing" means loading the page in a browser and exercising the feature.

## Architecture

### State model

Everything lives in `localStorage`. Three keys (note: the README's `promptdesk_data` reference is stale — the actual keys are):

- `desktop_items` — flat array of all items (files, folders, chat windows). Hierarchy is encoded by each item's `parent` field pointing to a folder `id`, not by nesting.
- `llm_api_config` — `{ openai, claude, gemini, defaultProvider }`, each provider holding `{ apiKey, model }`.
- `darkMode` — `'enabled' | 'disabled'`.

Item shape:

```js
{ id, name, type: 'file'|'folder', fileType?: 'file'|'chat',
  content, position: {x, y}, parent: id|null,
  items?: [],            // folders
  chatHistory?: [...] }  // chat-type files
```

The flat-array + `parent`-pointer layout means rendering a folder requires filtering `desktop_items` by `parent === folder.id` (`getFolderItems`, `renderFolderItems`). When you change item shape, update `loadItems`, `saveItem`, `deleteItem`, `moveItemToFolder`, and the render path together.

### Provider calls go directly from the browser

`sendPromptToLLM(prompt, provider, chatHistory)` in `app.js` makes `fetch` calls **straight to the provider API** using the user-supplied key from `localStorage`:

- OpenAI → `https://api.openai.com/v1/chat/completions`
- Claude → `https://api.anthropic.com/v1/messages` (with `x-api-key` + `anthropic-version` headers)
- Gemini → `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`

Each branch builds the provider-specific message/contents array from `chatHistory` and appends the current prompt if it's not already the last user turn. When adding a provider or model, mirror that pattern and also update:

1. The `<select>` options in `index.html` (`openai-model-select`, `claude-model-select`, `gemini-model-select`).
2. The default in the `apiConfig` initializer at the top of `app.js`.
3. The context menu item in `index.html` (`menu-send-to-...`) and its handler wired in `initialize()`.

Because requests are cross-origin from a static page, anything that depends on a same-origin backend will not work — the "no backend" stance is load-bearing. The Anthropic endpoint in particular requires the user's browser/extension to permit direct calls; do not silently add a proxy.

### UI wiring

- Context menu (`#context-menu` in `index.html`) is a single shared element; `showContextMenu` toggles which `<li>` items are visible based on whether the click was on a file, folder, or empty desktop.
- Chat windows are cloned from `#chat-window-template` and rendered as floating, draggable elements; chat history is persisted back into the owning item's `chatHistory` via `saveItem`.
- Drag-and-drop, selection, and double-click-to-open are all handled by listeners attached in `renderItem` — re-rendering an item means re-attaching them.

### Models reference

`models.md` lists older target models but the actual UI options live in `index.html` selects and the defaults in `app.js` (currently `gpt-5`, `claude-4.5-sonnet`, `gemini-2.5-pro`). Treat `index.html` + `app.js` as the source of truth, not `models.md`.

### Roadmap

`next-steps.md` is an aspirational backlog, not a spec — don't treat its items as committed work.

## Branching

Develop on `claude/init-project-setup-ByKzK` and push there. Do not push to `main`.
