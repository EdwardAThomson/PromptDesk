# Dev Log

## 2026-07-01

Ran a full-audit documentation sweep to reconcile the project's state docs against the code as it actually stands. The README had described persistence as a single `promptdesk_data` localStorage key that never existed; it now correctly documents the three keys the app really uses (`desktop_items` for files and folders, `llm_api_config` for API keys and selected models, and `darkMode` for the theme). The README's context-menu wording was also corrected from "Send to GPT/Claude/Gemini" to the actual "Send to LLM" label, which routes to whichever provider is configured. Separately, `models.md` was refreshed to drop the stale model list and match the provider dropdowns in `index.html` (GPT-5 / GPT-5-mini, Gemini 2.5 Pro, and Claude 4.5 Sonnet).

**Decisions & notes:** Docs-only pass, no code changed. The intent was to eliminate drift between the docs and the implementation rather than add anything new.
