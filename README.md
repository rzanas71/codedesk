# CodeDesk

A school-configured code playground for the browser. Write React JSX, run it, read the preview and console — zero setup on locked-down Chromebooks.

## Why

Schools teaching React need a ready environment students can open and use without installs, accounts, or admin rights. CodeDesk is that instrument: one language shipping today (JSX/React) behind a language-adapter seam so each curriculum language is a plug-in, not a rewrite.

## Features

- **Editor + live preview + console** — the playground loop, nothing else in v1
- **Client-side runs** — Babel transform + sandboxed iframe; no server execution
- **Language seam** — register adapters in `src/lib/languages/`; v1 ships JSX at 486 nm
- **Drafts in localStorage** — reload and keep working (no account)
- **Runs console** — `Mod/Ctrl+Enter` to run; run count and last duration on the rail
- **Emission Line Rail UI** — state reads as line form (half / dashed / solid / sodium-double / error-double), never color alone

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS 4
- CodeMirror 6
- `@babel/standalone` for JSX
- Self-hosted React UMD under `public/vendor/` for the sandbox iframe
- Vitest + Testing Library

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + jsdom) |

## Add a language

1. Implement `LanguageAdapter` from `src/lib/languages/types.ts` (`id`, `label`, `fileExtension`, `wavelengthNm`, `defaultSource`, `compile`).
2. Register it in `Playground.tsx` via `registry.register(...)`.
3. Give it a wavelength not already used by the seven rail ticks (405–656 nm).

Compile output must be a string the sandbox can run as a classic script (or arrange your own loader inside that contract).

## Deploy (Vercel)

Push the repo to GitHub/GitLab, then import it in Vercel — or:

```bash
npx vercel
```

No environment variables. Static-friendly; runs are entirely client-side.

## Design system

See [DESIGN.md](./DESIGN.md) for tokens and rules derived from the shipped UI.

## Scope (v1)

Playground only: no auth, no grading, no exercises, no server-side language runtimes. Future languages may need WASM or other adapters behind the same seam.

## License

MIT — see [LICENSE](./LICENSE).
