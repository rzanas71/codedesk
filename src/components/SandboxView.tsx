import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSandbox } from "../store";
import { Preview } from "./Preview";
import { Console } from "./Console";

// Monaco (language services + workers) dominates the bundle graph — keep it
// out of the entry chunk; the editor mounts as soon as the lazy chunk lands.
const Editor = lazy(() =>
  import("./Editor").then((m) => ({ default: m.Editor })),
);

const MIN_SPLIT = 18;
const MAX_SPLIT = 82;
const DEFAULT_SPLIT = 52;

function clampSplit(value: number): number {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));
}

export function SandboxView() {
  const isPython = useSandbox((s) => s.activePreset) === "python";
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  const areaRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const applyFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const area = areaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const next = isDesktop
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100;
      setSplit(clampSplit(next));
    },
    [isDesktop],
  );

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = isDesktop ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    applyFromPointer(event.clientX, event.clientY);

    const onMove = (moveEvent: PointerEvent) => {
      applyFromPointer(moveEvent.clientX, moveEvent.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onSplitKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 5 : 2;
    if (isDesktop) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSplit((v) => clampSplit(v - step));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSplit((v) => clampSplit(v + step));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSplit((v) => clampSplit(v - step));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSplit((v) => clampSplit(v + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSplit(MIN_SPLIT);
    } else if (event.key === "End") {
      event.preventDefault();
      setSplit(MAX_SPLIT);
    }
  };

  if (isPython) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 border-b border-app-border">
          <Suspense fallback={<div className="h-full bg-app-bg" />}>
            <Editor />
          </Suspense>
        </div>
        <Console />
      </main>
    );
  }

  const editorStyle = isDesktop
    ? { width: `${split}%` }
    : { height: `${split}%` };

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div
        ref={areaRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        <div
          className="flex min-h-0 min-w-0 flex-col border-b border-app-border lg:border-b-0 lg:border-r"
          style={editorStyle}
        >
          <Suspense fallback={<div className="min-h-0 flex-1 bg-app-bg" />}>
            <Editor />
          </Suspense>
        </div>

        <div
          role="separator"
          aria-label="Resize output"
          aria-orientation={isDesktop ? "vertical" : "horizontal"}
          aria-valuenow={Math.round(split)}
          aria-valuemin={MIN_SPLIT}
          aria-valuemax={MAX_SPLIT}
          tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={onSplitKeyDown}
          className={
            isDesktop
              ? "w-1 shrink-0 cursor-col-resize bg-app-border transition-colors hover:bg-accent-hover active:bg-accent-hover"
              : "h-1 shrink-0 cursor-row-resize bg-app-border transition-colors hover:bg-accent-hover active:bg-accent-hover"
          }
        />

        <div className="min-h-0 min-w-0 flex-1">
          <Preview />
        </div>
      </div>
      <Console />
    </main>
  );
}
