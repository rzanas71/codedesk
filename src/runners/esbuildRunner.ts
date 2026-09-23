import defaultWasmUrl from "esbuild-wasm/esbuild.wasm?url";

let initPromise: Promise<void> | null = null;

export function initEsbuild(): Promise<void> {
  if (!initPromise) {
    initPromise = import("esbuild-wasm")
      .then(({ initialize }) =>
        // The node entry (vitest) loads esbuild.wasm from its own package and
        // rejects URL/module options; the browser entry requires wasmURL.
        typeof window === "undefined"
          ? initialize({})
          : initialize({ wasmURL: defaultWasmUrl }),
      )
      .catch((err: unknown) => {
        initPromise = null; // failed init must stay retryable
        throw err;
      });
  }
  return initPromise;
}

export async function compileJSX(source: string): Promise<string> {
  if (!source.trim()) {
    throw new Error("App.jsx is empty — nothing to compile.");
  }
  await initEsbuild();
  const { transform } = await import("esbuild-wasm");
  const { code } = await transform(source, {
    loader: "jsx",
    // Rule 1 — classic transform emits React.createElement, which matches the
    // UMD/CDN React globals. jsx: "automatic" would inject dead ESM imports.
    jsx: "transform",
    target: "esnext",
    sourcefile: "App.jsx",
  });
  return code;
}
