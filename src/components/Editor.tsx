import { useRef, type KeyboardEvent } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useSandbox } from "../store";
import { presets } from "../presets";
import "../lib/monaco";

const LANG_BY_EXT: Record<string, string> = {
  html: "html",
  css: "css",
  scss: "scss",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  py: "python",
};

function languageFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG_BY_EXT[ext] ?? "plaintext";
}

export function Editor() {
  const files = useSandbox((s) => s.files);
  const activeFile = useSandbox((s) => s.activeFile);
  const activePreset = useSandbox((s) => s.activePreset);
  const setActiveFile = useSandbox((s) => s.setActiveFile);
  const setFile = useSandbox((s) => s.setFile);

  const tabs = Object.keys(files);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const langLabel = presets[activePreset].language;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.indexOf(activeFile);
    let next = -1;
    if (event.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (idx - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      event.preventDefault();
      setActiveFile(tabs[next]);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-bg">
      <div className="flex shrink-0 items-center gap-1 border-b border-app-border bg-app-panel px-1">
        <div
          role="tablist"
          aria-label="Open files"
          onKeyDown={onKeyDown}
          className="flex min-w-0 flex-1 items-stretch"
        >
          {tabs.map((name) => {
            const active = name === activeFile;
            return (
              <button
                key={name}
                ref={(el) => {
                  tabRefs.current[tabs.indexOf(name)] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${name}`}
                aria-selected={active}
                aria-controls={`panel-${name}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveFile(name)}
                className={[
                  "min-h-9 shrink-0 border-r border-app-border px-3 font-mono text-[12px]",
                  active
                    ? "border-t-2 border-t-accent-hover bg-app-bg text-app-text"
                    : "bg-app-elevated text-app-dim hover:text-app-text",
                ].join(" ")}
              >
                {name}
              </button>
            );
          })}
        </div>

        <span className="hidden shrink-0 px-2 font-mono text-[11px] text-app-faint sm:inline">
          {langLabel}
        </span>
      </div>

      <div
        role="tabpanel"
        id={`panel-${activeFile}`}
        aria-labelledby={`tab-${activeFile}`}
        className="min-h-0 flex-1"
      >
        <MonacoEditor
          key={activePreset}
          // No `value` prop: the wrapper's value-sync effect can race fast
          // typing and full-document-replace with a stale string, corrupting
          // the token stream ("Token length and text length do not match").
          // With defaultValue the sync effect no-ops (value === undefined).
          // Preset-scoped paths keep models from going stale across switches —
          // the wrapper disposes the active model on unmount and recreates it
          // from defaultValue (store content) when the preset returns.
          defaultValue={files[activeFile] ?? ""}
          path={`file:///${activePreset}/${activeFile}`}
          language={languageFor(activeFile)}
          onChange={(value) => setFile(activeFile, value ?? "")}
          theme="codedesk-dark"
          saveViewState={false}
          options={{
            fontSize: 13,
            fontFamily:
              "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "line",
            tabSize: 2,
            smoothScrolling: false,
            // Suggest's synchronous refilter runs inside content-change events
            // and can read the line tokenizer mid-update ("Token length and
            // text length do not match"). Keep Ctrl+Space for manual completion.
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
          }}
        />
      </div>
    </div>
  );
}
