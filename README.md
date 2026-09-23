# CodeDesk

A configured code playground for the browser



## Features

- **Editor + live preview + console** — the playground loop, nothing else in v1
- **Client-side runs** — esbuild/sass/pyodide in the browser; no server execution
- **Edit history** — autosaved timestamped snapshots + activity (first/last edit, runs); restore any version
- **Six presets** — HTML, Bootstrap, jQuery, SCSS, React, Python
- **Drafts in localStorage** — reload and keep working (no account)
- **Run shortcut** — `Mod/Ctrl+Enter`; run count and last duration in the toolbar

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- Tailwind CSS 4
- Monaco editor
- esbuild-wasm (JSX), dart-sass, Pyodide (Python worker)
- Vitest + Playwright smoke
- Electron (desktop packages: Windows exe, Linux `.deb` + AppImage)

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run electron` | Build web + open desktop shell |
| `npm run dist:win` | Windows NSIS installer (`.exe`) |
| `npm run dist:linux` | Linux `.deb` + AppImage |

## Desktop releases

Push a version tag to build and publish installers on GitHub Releases:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The `Release` workflow attaches:

- **Windows:** `CodeDesk Setup *.exe` (NSIS)
- **Linux:** `codedesk_*.deb` and `CodeDesk-*.AppImage`

## Add a preset

1. Add a key and entry to `presets` in `src/presets.ts` — `label`, `cdn`, `defaultFiles`, `language`, optional `runtime` (`esbuild` | `sass` | `pyodide`).
2. Extend `PresetKey` and `presetOrder` in that file; the header select follows them.
3. For a non-raw-HTML runtime, wire compile in `src/store.ts` `run()` (see `esbuildRunner` / `sassRunner` / `pyodideRunner`) or extend `generateSrcdoc()` in `src/iframeGenerator.ts`.

Raw HTML/JS presets run as a classic script inside the sandbox iframe. Compiled presets must produce a string that fits that contract (or arrange your own loader).

## Deploy (Vercel)

Push the repo to GitHub/GitLab, then import it in Vercel — or:

```bash
npx vercel
```

No environment variables. Static-friendly; runs are entirely client-side.

## License

PolyForm Noncommercial 1.0.0 — free for personal, educational, and other noncommercial use. No selling or other commercial use — see [LICENSE](./LICENSE).
