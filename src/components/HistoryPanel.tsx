import { useEffect } from "react";
import { useSandbox } from "../store";
import { presets } from "../presets";
import { subscribeHistory } from "../lib/session/history";

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSpan(from: number | null, to: number | null): string {
  if (from === null || to === null) return "—";
  const minutes = Math.max(0, Math.round((to - from) / 60_000));
  if (minutes < 1) return "<1 min";
  return `${minutes} min`;
}

export function HistoryPanel() {
  const open = useSandbox((s) => s.historyOpen);
  const snapshots = useSandbox((s) => s.historySnapshots);
  const activity = useSandbox((s) => s.activity);
  const activePreset = useSandbox((s) => s.activePreset);
  const toggleHistory = useSandbox((s) => s.toggleHistory);
  const restoreSnapshot = useSandbox((s) => s.restoreSnapshot);
  const clearAllHistory = useSandbox((s) => s.clearAllHistory);
  const refreshHistory = useSandbox((s) => s.refreshHistory);

  useEffect(() => {
    if (!open) return;
    refreshHistory();
    return subscribeHistory(() => refreshHistory());
  }, [open, refreshHistory]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") toggleHistory(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, toggleHistory]);

  if (!open) return null;

  const idle = activity.firstEditAt === null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close history"
        className="absolute inset-0 bg-black/40"
        onClick={() => toggleHistory(false)}
      />

      <aside
        aria-label="Edit history"
        className="relative flex h-full w-full max-w-md flex-col border-l border-app-border bg-app-panel shadow-xl"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-app-border px-3 py-2">
          <h2 className="text-sm font-semibold text-app-text">History</h2>
          <span className="font-mono text-[11px] text-app-faint">
            {snapshots.length}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => toggleHistory(false)}
            className="min-h-9 rounded border border-app-border px-2 text-xs text-app-dim hover:border-app-border-strong hover:text-app-text"
          >
            Close
          </button>
        </div>

        <section
          aria-label="Activity"
          className="shrink-0 border-b border-app-border bg-app-elevated px-3 py-3"
        >
          <p className="mb-2 text-xs font-medium text-app-dim">Activity</p>
          {idle ? (
            <p className="text-xs text-level-warn">
              No edits recorded yet — this station looks idle.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-app-text">
              <dt className="text-app-faint">First edit</dt>
              <dd>{formatTime(activity.firstEditAt as number)}</dd>
              <dt className="text-app-faint">Last edit</dt>
              <dd>{formatTime(activity.lastEditAt as number)}</dd>
              <dt className="text-app-faint">Active span</dt>
              <dd>
                {formatSpan(activity.firstEditAt, activity.lastEditAt)}
              </dd>
              <dt className="text-app-faint">Edit bursts</dt>
              <dd>{activity.editEvents}</dd>
              <dt className="text-app-faint">Runs</dt>
              <dd>{activity.runs}</dd>
            </dl>
          )}
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {snapshots.length === 0 ? (
            <p className="px-3 py-4 text-xs text-app-faint">
              No snapshots yet. A version is saved after ~45s of quiet
              following an edit.
            </p>
          ) : (
            <ul>
              {snapshots.map((snap) => {
                const isActivePreset = snap.preset === activePreset;
                return (
                  <li
                    key={snap.id}
                    className="flex items-center gap-2 border-b border-app-border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-app-text">
                        {formatTime(snap.savedAt)}
                        <span className="ml-2 text-app-faint">
                          {presets[snap.preset].label}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-app-faint">
                        {snap.chars} chars
                        {isActivePreset ? " · current preset" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreSnapshot(snap)}
                      className="min-h-8 shrink-0 rounded border border-app-border px-2 text-xs text-app-dim hover:border-app-border-strong hover:text-app-text"
                    >
                      Restore
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-app-border px-3 py-2">
          <button
            type="button"
            onClick={clearAllHistory}
            disabled={snapshots.length === 0}
            className="min-h-9 rounded border border-app-border px-2 text-xs text-app-dim hover:border-app-border-strong hover:text-app-text disabled:opacity-40"
          >
            Clear history
          </button>
        </div>
      </aside>
    </div>
  );
}
