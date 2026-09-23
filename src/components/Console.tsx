import { useSandbox, type LogLevel } from "../store";

const LEVEL_CLASS: Record<LogLevel, string> = {
  log: "text-level-log",
  info: "text-level-info",
  warn: "text-level-warn",
  error: "text-level-error",
};

export function Console() {
  const logs = useSandbox((s) => s.logs);
  const open = useSandbox((s) => s.consoleOpen);
  const toggleConsole = useSandbox((s) => s.toggleConsole);
  const clearLogs = useSandbox((s) => s.clearLogs);

  return (
    <section
      aria-label="Console"
      className="flex shrink-0 flex-col border-t border-app-border bg-app-panel"
    >
      <div className="flex min-h-9 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => toggleConsole()}
          aria-expanded={open}
          className="flex min-h-9 items-center gap-2 pr-1 text-xs text-app-dim hover:text-app-text"
        >
          <span aria-hidden="true" className="text-[10px]">
            {open ? "▾" : "▸"}
          </span>
          <span className="font-medium">Console</span>
        </button>
        <span className="font-mono text-[11px] tabular-nums text-app-faint">
          {logs.length}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={clearLogs}
          disabled={logs.length === 0}
          className="min-h-9 rounded border border-app-border px-2 text-xs text-app-dim hover:border-app-border-strong hover:text-app-text disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {open && (
        <div
          className="max-h-40 overflow-y-auto overflow-x-hidden border-t border-app-border px-3 py-2 font-mono text-[12px] leading-relaxed [overflow-wrap:anywhere]"
          role="log"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <p className="text-app-faint">
              No output yet — press Run to see console messages.
            </p>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className={`log-line ${LEVEL_CLASS[entry.level]}`}
              >
                {entry.text}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
