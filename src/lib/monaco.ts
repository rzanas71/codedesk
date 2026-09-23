import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
// monaco-editor@0.56 exports map rewrites "./*" → "./esm/vs/*.js",
// so deep imports must omit the esm/vs prefix.
import editorWorker from "monaco-editor/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/language/json/json.worker?worker";
import cssWorker from "monaco-editor/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/language/html/html.worker?worker";
import tsWorker from "monaco-editor/language/typescript/ts.worker?worker";
import { errorHandler } from "monaco-editor/base/common/errors";
import { TOKENS } from "../styles/tokens";

// monaco standalone's default unexpectedErrorHandler rethrows via
// setTimeout → uncaught window error. VS Code itself replaces it with a
// log-only handler in the product (microsoft/vscode#244451): known upstream
// tokenizer quirks (mismatched LineTokens lengths → sparse-store /
// bracket-pair parser noise, microsoft/vscode#243450) must log, not crash.
errorHandler.unexpectedErrorHandler = (e: unknown) => {
  console.warn("[monaco]", e);
};

(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string): Worker {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

monaco.editor.defineTheme("codedesk-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6a9955" },
    { token: "string", foreground: "ce9178" },
    { token: "keyword", foreground: "c586c0" },
    { token: "number", foreground: "b5cea8" },
    { token: "tag", foreground: "569cd6" },
    { token: "attribute.name", foreground: "9cdcfe" },
    { token: "attribute.value", foreground: "ce9178" },
  ],
  colors: {
    "editor.background": TOKENS.bg,
    "editor.foreground": TOKENS.text,
    "editorCursor.foreground": "#aeafad",
    "editor.selectionBackground": "#264f78",
    "editor.lineHighlightBackground": "#2a2a2a",
    "editorLineNumber.foreground": TOKENS.faint,
    "editorLineNumber.activeForeground": TOKENS.text,
    "editorIndentGuide.background1": "#404040",
    "editorWidget.background": TOKENS.elevated,
    "editorWidget.border": TOKENS.border,
    "editorSuggestWidget.background": TOKENS.elevated,
    "editorSuggestWidget.border": TOKENS.border,
    "input.background": TOKENS.panel,
    focusBorder: TOKENS.accentHover,
  },
});

loader.config({ monaco });
