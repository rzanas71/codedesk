import { create } from "zustand";
import { presets, type PresetKey } from "./presets";
import { generateSrcdoc } from "./iframeGenerator";
import {
  cleanupLegacyDraft,
  flushDraftSave,
  loadActivePreset,
  loadDraft,
  saveActivePreset,
  scheduleDraftSave,
} from "./lib/session/persistence";
import {
  clearHistory,
  getActivity,
  getHistory,
  recordEdit,
  recordRun,
  scheduleSnapshot,
  type ActivityRecord,
  type HistorySnapshot,
} from "./lib/session/history";

export type LogLevel = "log" | "info" | "warn" | "error";
export type RunPhase = "idle" | "compiling" | "running" | "error";
export type RunOutcome = "filed" | "error" | null;

export interface ConsoleEntry {
  id: number;
  level: LogLevel;
  text: string;
}

interface SandboxState {
  activePreset: PresetKey;
  files: Record<string, string>;
  activeFile: string;
  logs: ConsoleEntry[];
  consoleOpen: boolean;
  runPhase: RunPhase;
  srcdoc: string | null;
  runId: number;
  logSeq: number;
  /** Session run counter (cumulative across preset switches). */
  runCount: number;
  /** Wall-clock ms from Run click to the run settling. */
  lastRunMs: number | null;
  /**
   * The last run's result — drives status between runs.
   * Editing after a run clears it.
   */
  lastOutcome: RunOutcome;

  /** Timestamped edit snapshots (newest first) for the History panel. */
  historySnapshots: HistorySnapshot[];
  /** Derived “did they code?” counters, flushed with snapshots. */
  activity: ActivityRecord;
  historyOpen: boolean;
  /** Bumped on restore so Monaco remounts with the restored buffers. */
  historyEpoch: number;

  selectPreset: (key: PresetKey) => void;
  setActiveFile: (name: string) => void;
  setFile: (name: string, content: string) => void;
  appendLog: (level: LogLevel, text: string) => void;
  clearLogs: () => void;
  toggleConsole: (open?: boolean) => void;
  setRunPhase: (phase: RunPhase) => void;
  setSrcdoc: (html: string | null) => void;
  run: () => Promise<void>;
  toggleHistory: (open?: boolean) => void;
  refreshHistory: () => void;
  restoreSnapshot: (snapshot: HistorySnapshot) => void;
  clearAllHistory: () => void;
}

function filesFor(key: PresetKey): Record<string, string> {
  return { ...presets[key].defaultFiles };
}

/**
 * Preset defaults with the saved draft layered on top — only keys that still
 * exist in the preset are restored, so renamed/removed files can't linger.
 */
function filesWithDraft(key: PresetKey): Record<string, string> {
  const files = filesFor(key);
  const draft = loadDraft(key);
  if (draft) {
    for (const name of Object.keys(files)) {
      const content = draft[name];
      if (typeof content === "string") files[name] = content;
    }
  }
  return files;
}

function firstFile(files: Record<string, string>): string {
  return Object.keys(files)[0] ?? "";
}

cleanupLegacyDraft();
const bootPreset: PresetKey = loadActivePreset() ?? "react";
const bootFiles = filesWithDraft(bootPreset);

let runStartedAt = 0;

function sinceRunStart(): number {
  return Math.max(0, Math.round(performance.now() - runStartedAt));
}

export const useSandbox = create<SandboxState>((set, get) => ({
  activePreset: bootPreset,
  files: bootFiles,
  activeFile: firstFile(bootFiles),
  logs: [],
  consoleOpen: true,
  runPhase: "idle",
  srcdoc: null,
  runId: 0,
  logSeq: 0,
  runCount: 0,
  lastRunMs: null,
  lastOutcome: null,
  historySnapshots: getHistory(),
  activity: getActivity(),
  historyOpen: false,
  historyEpoch: 0,

  selectPreset: (key) => {
    // Settle any debounced write for the *outgoing* preset before swapping.
    flushDraftSave();
    saveActivePreset(key);
    const files = filesWithDraft(key);
    set({
      activePreset: key,
      files,
      activeFile: firstFile(files),
      logs: [],
      logSeq: 0,
      runPhase: "idle",
      srcdoc: null,
      runId: 0,
      lastOutcome: null,
    });
  },

  setActiveFile: (name) => set({ activeFile: name }),

  setFile: (name, content) => {
    const files = { ...get().files, [name]: content };
    set((s) => ({
      files,
      // An edit invalidates the filed result — and any lingering fault.
      lastOutcome: null,
      runPhase: s.runPhase === "error" ? "idle" : s.runPhase,
    }));
    scheduleDraftSave(get().activePreset, files);
    recordEdit();
    scheduleSnapshot(get().activePreset, files);
    set({ activity: getActivity() });
  },

  appendLog: (level, text) =>
    set((s) => ({
      logs: [...s.logs, { id: s.logSeq + 1, level, text }],
      logSeq: s.logSeq + 1,
      consoleOpen: true,
    })),

  clearLogs: () => set({ logs: [], logSeq: 0 }),

  toggleConsole: (open) =>
    set((s) => ({ consoleOpen: open ?? !s.consoleOpen })),

  setRunPhase: (phase) =>
    set((s) => {
      const patch: Partial<SandboxState> = { runPhase: phase };
      if (phase === "idle" && s.runPhase === "running") {
        patch.lastOutcome = "filed";
        patch.lastRunMs = sinceRunStart();
      } else if (phase === "error" && s.runPhase !== "error") {
        patch.lastOutcome = "error";
        patch.lastRunMs = sinceRunStart();
      }
      return patch;
    }),

  setSrcdoc: (html) => set({ srcdoc: html }),

  toggleHistory: (open) =>
    set((s) => {
      const next = open ?? !s.historyOpen;
      if (next) {
        return {
          historyOpen: true,
          historySnapshots: getHistory(),
          activity: getActivity(),
        };
      }
      return { historyOpen: false };
    }),

  refreshHistory: () =>
    set({ historySnapshots: getHistory(), activity: getActivity() }),

  restoreSnapshot: (snapshot) => {
    flushDraftSave();
    saveActivePreset(snapshot.preset);
    const files = { ...snapshot.files };
    set((s) => ({
      activePreset: snapshot.preset,
      files,
      activeFile: Object.keys(files)[0] ?? "",
      logs: [],
      logSeq: 0,
      runPhase: "idle",
      srcdoc: null,
      runId: 0,
      lastOutcome: null,
      historyEpoch: s.historyEpoch + 1,
      historyOpen: false,
    }));
    scheduleDraftSave(snapshot.preset, files);
  },

  clearAllHistory: () => {
    clearHistory();
    set({ historySnapshots: [] });
  },

  run: async () => {
    const { activePreset, files } = get();
    const preset = presets[activePreset];

    runStartedAt = performance.now();
    recordRun();
    set((s) => ({
      logs: [],
      logSeq: 0,
      runCount: s.runCount + 1,
      activity: getActivity(),
      // Python executes (and loads its runtime) inside the worker — there is
      // no parent-side compile step to surface as its own phase.
      runPhase:
        preset.runtime && preset.runtime !== "pyodide"
          ? "compiling"
          : "running",
    }));

    try {
      const effective = { ...files };

      if (preset.runtime === "pyodide") {
        const { PythonRunSuperseded, runPython } = await import(
          "./runners/pyodideRunner"
        );
        // Preset switches reset runId — the token drops stale streamed output
        // (and phase changes) if the user navigates away mid-run.
        const token = { preset: activePreset, runId: get().runId };
        const current = () => {
          const s = get();
          return s.activePreset === token.preset && s.runId === token.runId;
        };
        try {
          await runPython(effective["main.py"] ?? "", {
            onOutput: (level, text) => {
              if (current()) get().appendLog(level, text);
            },
          });
          if (current()) get().setRunPhase("idle");
        } catch (err) {
          if (err instanceof PythonRunSuperseded) return;
          if (current()) {
            const message = err instanceof Error ? err.message : String(err);
            get().appendLog("error", message);
            get().setRunPhase("error");
          }
        }
        return;
      }

      if (preset.runtime === "esbuild") {
        const { compileJSX } = await import("./runners/esbuildRunner");
        // Compiled JS is an ephemeral override for generateSrcdoc only —
        // it never lands in `files`, so no phantom script.js tab appears.
        effective["script.js"] = await compileJSX(effective["App.jsx"] ?? "");
      } else if (preset.runtime === "sass") {
        const { compileSCSS } = await import("./runners/sassRunner");
        // Same ephemeral-override rule as esbuild, for styles.css.
        effective["styles.css"] = await compileSCSS(
          effective["styles.scss"] ?? "",
        );
      }

      const html = generateSrcdoc(preset, effective);
      set((s) => ({
        srcdoc: html,
        runId: s.runId + 1,
        runPhase: "running",
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      get().appendLog("error", message);
      get().setRunPhase("error");
    }
  },
}));
