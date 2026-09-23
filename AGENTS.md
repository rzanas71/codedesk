# Agent notes

- Vite + React + TypeScript SPA. No server-side framework (Next.js was removed).
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm test`.
- Core loop: Zustand store (`src/store.ts`) → `generateSrcdoc()` (`src/iframeGenerator.ts`) → sandboxed iframe → `postMessage` → Console.
- Presets (languages) live in `src/presets.ts`. Heavy runtimes (esbuild, sass, pyodide) must be lazy-loaded from `src/runners/`.
- Python runs in a Web Worker (no iframe) — preview pane is hidden; editor/console split.
- Compiled outputs (esbuild `script.js`, sass `styles.css`) are ephemeral overrides for `generateSrcdoc()` only — never write them into `store.files` (phantom tabs).
- Persistence: per-preset drafts `codedesk_draft_<preset>` + active preset `codedesk_active_preset` (`src/lib/session/persistence.ts`); wired into store `setFile`/`selectPreset`/boot.
- E2E smoke: `%TEMP%\opencode\smoke.mjs` (Playwright, real Chromium via `channel: "chromium"`); `SMOKE_PREVIEW=1` runs it against the production build.
- Monaco: `src/lib/monaco.ts` overrides `errorHandler.unexpectedErrorHandler` to `console.warn` (VS Code parity, vscode#244451) — monaco standalone's default rethrows via `setTimeout` and upstream tokenizer quirks (vscode#243450 "Token length and text length do not match!") otherwise surface as uncaught pageerrors. Deep import typed in `src/monaco-deep.d.ts`.
