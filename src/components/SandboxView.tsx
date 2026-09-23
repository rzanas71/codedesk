import { lazy, Suspense } from "react";
import { useSandbox } from "../store";
import { Preview } from "./Preview";
import { Console } from "./Console";

// Monaco (language services + workers) dominates the bundle graph — keep it
// out of the entry chunk; the editor mounts as soon as the lazy chunk lands.
const Editor = lazy(() =>
  import("./Editor").then((m) => ({ default: m.Editor })),
);

export function SandboxView() {
  const isPython = useSandbox((s) => s.activePreset) === "python";

  if (isPython) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 border-b border-app-border">
          <Suspense
            fallback={<div className="h-full bg-app-bg" />}
          >
            <Editor />
          </Suspense>
        </div>
        <Console />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
        <div className="flex min-h-0 flex-col border-b border-app-border lg:border-b-0 lg:border-r">
          <Suspense
            fallback={<div className="min-h-0 flex-1 bg-app-bg" />}
          >
            <Editor />
          </Suspense>
        </div>
        <div className="min-h-0">
          <Preview />
        </div>
      </div>
      <Console />
    </main>
  );
}
