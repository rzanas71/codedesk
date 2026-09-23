import { useEffect } from "react";
import { useSandbox, type RunPhase } from "../store";
import { SandboxView } from "./SandboxView";
import { presets, presetOrder, type PresetKey } from "../presets";

const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const BUSY_LABEL: Record<"compiling" | "running", string> = {
  compiling: "Compiling…",
  running: "Running…",
};

export function Playground() {
  const activePreset = useSandbox((s) => s.activePreset);
  const selectPreset = useSandbox((s) => s.selectPreset);
  const runPhase = useSandbox((s) => s.runPhase);
  const runCount = useSandbox((s) => s.runCount);
  const lastRunMs = useSandbox((s) => s.lastRunMs);

  const busy = runPhase === "compiling" || runPhase === "running";
  const runLabel = busy ? BUSY_LABEL[runPhase] : "▶ Run";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const phase: RunPhase = useSandbox.getState().runPhase;
        if (phase === "compiling" || phase === "running") return;
        void useSandbox.getState().run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-bg">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-app-border bg-app-panel px-3 py-2 sm:gap-3 sm:px-4">
        <h1 className="text-sm font-semibold tracking-tight text-app-text">
          CodeDesk
        </h1>
        <span className="hidden text-xs text-app-dim md:inline">
          In-browser code playground
        </span>

        <a
          href="https://github.com/rzanas71/codedesk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="CodeDesk on GitHub"
          title="GitHub repository"
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded text-app-dim hover:bg-app-elevated hover:text-app-text"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>

        <div className="flex-1" />

        <label className="flex items-center gap-2">
          <span className="sr-only">Language preset</span>
          <span className="hidden text-xs text-app-dim sm:inline">
            Language
          </span>
          <select
            className="min-h-9 cursor-pointer rounded border border-app-border-strong bg-app-elevated px-2 text-xs text-app-text hover:border-app-faint"
            value={activePreset}
            onChange={(event) =>
              selectPreset(event.target.value as PresetKey)
            }
          >
            {presetOrder.map((key) => (
              <option key={key} value={key}>
                {presets[key].label}
              </option>
            ))}
          </select>
        </label>

        <span className="hidden font-mono text-[11px] tabular-nums text-app-dim sm:inline">
          {String(runCount).padStart(2, "0")} runs
          {lastRunMs !== null ? ` · ${lastRunMs} ms` : ""}
        </span>

        <button
          type="button"
          onClick={() => void useSandbox.getState().run()}
          disabled={busy}
          aria-keyshortcuts="Meta+Enter Control+Enter"
          className="min-h-9 shrink-0 rounded bg-accent px-4 text-xs font-semibold text-accent-text hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
        >
          {runLabel}
          <span className="ml-2 hidden font-mono text-[10px] font-normal opacity-80 sm:inline">
            {IS_MAC ? "⌘↵" : "Ctrl↵"}
          </span>
        </button>
      </header>

      <SandboxView />
    </div>
  );
}
