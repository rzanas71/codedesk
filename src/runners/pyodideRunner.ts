import type { RunnerToPython } from "./pyodideProtocol";

const LOAD_TIMEOUT_MS = 90_000;
const EXEC_TIMEOUT_MS = 8_000;

export interface PythonRunHandlers {
  onOutput: (level: "log" | "error", text: string) => void;
}

/** Thrown when a newer run takes over while this one is still active. */
export class PythonRunSuperseded extends Error {
  constructor() {
    super("Python run superseded by a newer run.");
  }
}

interface ActiveJob {
  handlers: PythonRunHandlers;
  resolve: () => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let active: ActiveJob | null = null;
let loadTimer: number | null = null;
let execTimer: number | null = null;

function clearTimers(): void {
  if (loadTimer !== null) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
  if (execTimer !== null) {
    window.clearTimeout(execTimer);
    execTimer = null;
  }
}

function killWorker(): void {
  worker?.terminate();
  worker = null;
}

function finish(error?: Error, options?: { kill?: boolean }): void {
  const job = active;
  clearTimers();
  if (options?.kill) killWorker();
  active = null;
  if (!job) return;
  if (error) job.reject(error);
  else job.resolve();
}

function handleMessage(message: RunnerToPython): void {
  const job = active;
  if (!job) return;

  switch (message.type) {
    case "stdout":
      job.handlers.onOutput("log", message.text);
      break;
    case "stderr":
      job.handlers.onOutput("error", message.text);
      break;
    case "started":
      clearTimers(); // load finished — arm the execution watchdog
      execTimer = window.setTimeout(() => {
        finish(
          new Error("Timeout: infinite loop? Python stopped after 8s."),
          { kill: true },
        );
      }, EXEC_TIMEOUT_MS);
      break;
    case "done":
      finish();
      break;
    case "error":
      // The worker caught the Python exception itself and stays healthy —
      // keep it (and the warm Pyodide runtime) for the next run.
      finish(new Error(message.message));
      break;
  }
}

export function runPython(
  code: string,
  handlers: PythonRunHandlers,
): Promise<void> {
  if (active) {
    // UI should prevent this (Run is disabled while busy), but ⌘/Ctrl+Enter
    // can race — take over cleanly and never share a worker between runs.
    killWorker();
    clearTimers();
    const stale = active;
    active = null;
    stale.reject(new PythonRunSuperseded());
  }

  if (!worker) {
    worker = new Worker(new URL("./pyodide.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<RunnerToPython>) =>
      handleMessage(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      finish(new Error(event.message || "Python worker crashed."), {
        kill: true,
      });
    };
  }

  return new Promise<void>((resolve, reject) => {
    active = { handlers, resolve, reject };
    loadTimer = window.setTimeout(() => {
      finish(
        new Error(
          "Timed out loading the Python runtime (90s). Check your network.",
        ),
        { kill: true },
      );
    }, LOAD_TIMEOUT_MS);
    worker?.postMessage({ type: "run", code });
  });
}
