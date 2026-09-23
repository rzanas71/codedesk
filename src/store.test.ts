import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  flushDraftSave,
  loadActivePreset,
  loadDraft,
  saveActivePreset,
  saveDraft,
} from "./lib/session/persistence";
import { useSandbox } from "./store";

vi.mock("./runners/pyodideRunner", () => {
  class PythonRunSuperseded extends Error {}
  return {
    PythonRunSuperseded,
    runPython: vi.fn(
      async (
        code: string,
        handlers: { onOutput: (level: "log" | "error", text: string) => void },
      ) => {
        handlers.onOutput("log", `python:${code.split("\n")[0]}`);
      },
    ),
  };
});

vi.mock("./runners/sassRunner", () => ({
  compileSCSS: vi.fn(async () => "body h1 { color: #0b5fff; }"),
}));

beforeEach(() => {
  // Settle any debounced draft write from the previous test *before* wiping
  // storage — otherwise a trailing timer could repopulate cleared keys.
  flushDraftSave();
  // Drafts and the active-preset pointer persist across tests otherwise and
  // would contaminate default-state assertions.
  localStorage.clear();
  useSandbox.getState().selectPreset("html");
  useSandbox.getState().clearLogs();
});

describe("sandbox store", () => {
  it("defaults to the react preset with App.jsx active", async () => {
    localStorage.clear();
    vi.resetModules();
    const { useSandbox: freshStore } = await import("./store");
    const s = freshStore.getState();
    expect(s.activePreset).toBe("react");
    expect(s.activeFile).toBe("App.jsx");
    expect(s.files["App.jsx"]).toContain("React.useState");
  });

  it("hydrates files and preset from saved drafts on import", async () => {
    localStorage.clear();
    saveDraft("html", { "index.html": "<h1>restored</h1>" });
    saveActivePreset("html");
    vi.resetModules();
    const { useSandbox: freshStore } = await import("./store");
    const s = freshStore.getState();
    expect(s.activePreset).toBe("html");
    expect(s.files["index.html"]).toBe("<h1>restored</h1>");
    // Untouched preset files still fall back to defaults.
    expect(s.files["script.js"]).toContain("console.log");
  });

  it("selectPreset swaps files and active file, and clears output", () => {
    const store = useSandbox.getState();
    store.appendLog("log", "stale entry");
    store.selectPreset("python");

    const s = useSandbox.getState();
    expect(s.activePreset).toBe("python");
    expect(Object.keys(s.files)).toEqual(["main.py"]);
    expect(s.activeFile).toBe("main.py");
    expect(s.logs).toHaveLength(0);
    expect(s.srcdoc).toBeNull();
    expect(s.runPhase).toBe("idle");
  });

  it("selectPreset('react') opens App.jsx first", () => {
    useSandbox.getState().selectPreset("react");
    expect(useSandbox.getState().activeFile).toBe("App.jsx");
  });

  it("setFile updates only the named file and persists a draft", () => {
    const beforeHtml = useSandbox.getState().files["index.html"];
    useSandbox.getState().setFile("styles.css", "body { color: red; }");

    const s = useSandbox.getState();
    expect(s.files["styles.css"]).toBe("body { color: red; }");
    expect(s.files["index.html"]).toBe(beforeHtml);
    expect(s.files["script.js"]).toContain("console.log");

    // Writes are debounced — flush the trailing timer to observe the draft.
    flushDraftSave();
    const draft = loadDraft("html");
    expect(draft?.["styles.css"]).toBe("body { color: red; }");
  });

  it("selectPreset restores that preset's saved draft", () => {
    saveDraft("react", { "App.jsx": "// my saved component" });
    useSandbox.getState().selectPreset("react");

    const s = useSandbox.getState();
    expect(s.files["App.jsx"]).toBe("// my saved component");
    expect(loadActivePreset()).toBe("react");
  });

  it("setActiveFile switches the open tab", () => {
    useSandbox.getState().setActiveFile("script.js");
    expect(useSandbox.getState().activeFile).toBe("script.js");
  });

  it("appendLog assigns increasing ids; clearLogs empties them", () => {
    const store = useSandbox.getState();
    store.appendLog("log", "one");
    store.appendLog("error", "two");

    let s = useSandbox.getState();
    expect(s.logs.map((l) => l.text)).toEqual(["one", "two"]);
    expect(s.logs[1].id).toBeGreaterThan(s.logs[0].id);

    store.clearLogs();
    s = useSandbox.getState();
    expect(s.logs).toHaveLength(0);
  });

  it("appendLog auto-opens the console drawer", () => {
    useSandbox.getState().toggleConsole(false);
    expect(useSandbox.getState().consoleOpen).toBe(false);

    useSandbox.getState().appendLog("log", "hello");
    expect(useSandbox.getState().consoleOpen).toBe(true);
  });

  it("run() produces srcdoc for runtime-less presets", async () => {
    await useSandbox.getState().run();

    const s = useSandbox.getState();
    expect(s.srcdoc).toBeTruthy();
    expect(s.srcdoc).toContain("<!DOCTYPE html>");
    expect(s.runPhase).toBe("running");
    expect(s.runId).toBe(1);
    expect(s.logs).toHaveLength(0);
  });

  it("run() increments runId on each run (forces iframe remount)", async () => {
    await useSandbox.getState().run();
    await useSandbox.getState().run();
    expect(useSandbox.getState().runId).toBe(2);
  });

  it("run() python streams worker output and settles idle without srcdoc", async () => {
    useSandbox.getState().selectPreset("python");
    await useSandbox.getState().run();

    const s = useSandbox.getState();
    expect(s.runPhase).toBe("idle");
    expect(s.srcdoc).toBeNull();
    expect(s.logs[0]?.text).toContain("python:");
  });

  it("run() records metrics and an edit clears the filed outcome", async () => {
    useSandbox.getState().selectPreset("python");
    await useSandbox.getState().run();

    let s = useSandbox.getState();
    expect(s.lastOutcome).toBe("filed");
    expect(s.runCount).toBeGreaterThan(0);
    expect(typeof s.lastRunMs).toBe("number");

    s.setFile("main.py", "print('edited')");
    s = useSandbox.getState();
    expect(s.lastOutcome).toBeNull();
  });

  it("run() surfaces python runner failures as a console error", async () => {
    const { runPython } = await import("./runners/pyodideRunner");
    vi.mocked(runPython).mockRejectedValueOnce(new Error("Pyodide exploded"));

    useSandbox.getState().selectPreset("python");
    await useSandbox.getState().run();

    const s = useSandbox.getState();
    expect(s.runPhase).toBe("error");
    expect(s.srcdoc).toBeNull();
    expect(s.logs.at(-1)).toMatchObject({
      level: "error",
      text: "Pyodide exploded",
    });
  });

  it("run() compiles scss into styles.css ephemerally (no phantom tab)", async () => {
    useSandbox.getState().selectPreset("scss");
    await useSandbox.getState().run();

    const s = useSandbox.getState();
    expect(s.runPhase).toBe("running");
    expect(s.srcdoc).toBeTruthy();
    expect(s.srcdoc).toContain("color: #0b5fff");
    expect(s.files["styles.css"]).toBeUndefined();
    expect(Object.keys(s.files)).toEqual(["styles.scss", "index.html"]);
  });

  it("run() clears previous console output", async () => {
    useSandbox.getState().appendLog("log", "old");
    await useSandbox.getState().run();
    expect(useSandbox.getState().logs).toHaveLength(0);
  });
});
