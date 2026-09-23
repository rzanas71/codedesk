import type { PythonToRunner, RunnerToPython } from "./pyodideProtocol";

// Rule 2 — Pyodide is fetched from the CDN inside this worker on first Run,
// so the app shell never pays for the ~10 MB runtime up front.
const BASE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

interface PyodideLike {
  setStdout(options: { batched: (text: string) => void }): void;
  setStderr(options: { batched: (text: string) => void }): void;
  runPythonAsync(code: string): Promise<unknown>;
}

let pyodidePromise: Promise<PyodideLike> | null = null;

function post(message: RunnerToPython): void {
  (
    self as unknown as { postMessage(message: RunnerToPython): void }
  ).postMessage(message);
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && err.message) {
    return String(err.message);
  }
  return String(err);
}

function ensurePyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const module = (await import(/* @vite-ignore */ `${BASE_URL}pyodide.mjs`)) as {
        loadPyodide(options: { indexURL: string }): Promise<PyodideLike>;
      };
      const pyodide = await module.loadPyodide({ indexURL: BASE_URL });
      pyodide.setStdout({
        batched: (text) => post({ type: "stdout", text }),
      });
      pyodide.setStderr({
        batched: (text) => post({ type: "stderr", text }),
      });
      return pyodide;
    })();
    pyodidePromise.catch(() => {
      pyodidePromise = null; // failed load must stay retryable
    });
  }
  return pyodidePromise;
}

self.onmessage = (event: MessageEvent<PythonToRunner>) => {
  const message = event.data;
  if (message.type !== "run") return;
  void (async () => {
    try {
      const pyodide = await ensurePyodide();
      post({ type: "started" });
      await pyodide.runPythonAsync(message.code);
      post({ type: "done" });
    } catch (err) {
      post({ type: "error", message: errorMessage(err) });
    }
  })();
};
