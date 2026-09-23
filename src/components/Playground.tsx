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
