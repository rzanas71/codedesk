import { useEffect, useRef } from "react";
import { useSandbox, type LogLevel } from "../store";

const WATCHDOG_MS = 8000;

const STATE_WORD: Record<string, string> = {
  idle: "Idle",
  compiling: "Compiling…",
  running: "Running…",
  error: "Error",
};

export function Preview() {
  const srcdoc = useSandbox((s) => s.srcdoc);
  const runId = useSandbox((s) => s.runId);
  const runPhase = useSandbox((s) => s.runPhase);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const settledRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const stateWord = STATE_WORD[runPhase] ?? "Idle";

  // Listener mounts once with the component — attached long before any run,
  // so the ALIVE ping can never arrive before we are listening.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const msg = event.data as
        | { source?: string; type?: string; method?: string; args?: string[] }
        | undefined;
      if (!msg || msg.source !== "codedesk") return;

      const store = useSandbox.getState();

      if (msg.type === "ALIVE") {
        if (settledRef.current) return;
        settledRef.current = true;
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (store.runPhase === "running") store.setRunPhase("idle");
        return;
      }

      if (msg.type === "console") {
        const m = msg.method;
        const level: LogLevel =
          m === "info" || m === "warn" || m === "error" ? m : "log";
        store.appendLog(level, (msg.args ?? []).join(" "));
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Parent-side watchdog: a frozen iframe (while(true){}) can never self-report,
  // so only the parent can enforce the deadline.
  useEffect(() => {
    if (!srcdoc) return;

    settledRef.current = false;
    timerRef.current = window.setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      timerRef.current = null;

      const store = useSandbox.getState();
      store.setSrcdoc(null); // destroy the hung iframe (unmounts it)
      store.appendLog(
        "error",
        "Timeout: infinite loop? Preview stopped after 8s.",
      );
      store.setRunPhase("error");
    }, WATCHDOG_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [srcdoc, runId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-output-paper text-black/75">
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-[#f3f3f3] px-3 py-2">
        <span className="text-xs font-medium text-black/70">Output</span>
        <span className="text-xs text-black/45">{stateWord}</span>
      </div>

      <div className="relative min-h-0 flex-1">
        {srcdoc ? (
          <iframe
            ref={iframeRef}
            key={runId}
            title="Preview"
            srcDoc={srcdoc}
            sandbox="allow-scripts allow-modals"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="font-mono text-[13px] text-black/70">
              Output — edit your code and press Run
              <span className="mt-1 block text-black/45">Ctrl/⌘ + ↵</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
