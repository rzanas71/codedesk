import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  ACTIVITY_KEY,
  clearHistory,
  commitSnapshot,
  flushHistory,
  getActivity,
  getHistory,
  HISTORY_KEY,
  loadActivity,
  loadHistory,
  MAX_SNAPSHOTS,
  recordEdit,
  recordRun,
  replaceHistory,
  resetHistoryForTests,
  SNAPSHOT_IDLE_MS,
  saveHistory,
  scheduleSnapshot,
  snapshotNow,
} from "@/lib/session/history";

describe("history snapshots", () => {
  beforeEach(() => {
    resetHistoryForTests();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T10:00:00Z"));
  });

  afterEach(() => {
    resetHistoryForTests();
    vi.useRealTimers();
    localStorage.clear();
  });

  test("commitSnapshot stores a timestamped snapshot", () => {
    scheduleSnapshot("react", { "App.jsx": "const a = 1;" });
    commitSnapshot();

    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].preset).toBe("react");
    expect(history[0].files["App.jsx"]).toBe("const a = 1;");
    expect(history[0].savedAt).toBe(Date.now());
    expect(history[0].chars).toBeGreaterThan(0);
  });

  test("idle timer fires a snapshot without an explicit commit", () => {
    scheduleSnapshot("html", { "index.html": "<p>hi</p>" });
    expect(getHistory()).toHaveLength(0);
    vi.advanceTimersByTime(SNAPSHOT_IDLE_MS);
    expect(getHistory()).toHaveLength(1);
  });

  test("snapshotNow commits immediately (Run checkpoint)", () => {
    scheduleSnapshot("python", { "main.py": "print('a')" });
    snapshotNow("python", { "main.py": "print('a')" });
    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0].files["main.py"]).toBe("print('a')");
  });

  test("rapid distinct versions are all kept (no time-window drops)", () => {
    // Student runs print A, deletes it, writes print B — same second.
    snapshotNow("python", { "main.py": "print('a')" });
    snapshotNow("python", { "main.py": "print('b')" });
    scheduleSnapshot("python", { "main.py": "print('c')" });
    commitSnapshot();

    const history = getHistory();
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.files["main.py"])).toEqual([
      "print('c')",
      "print('b')",
      "print('a')",
    ]);
  });

  test("run-style checkpoint keeps the first print after a rewrite", () => {
    snapshotNow("python", { "main.py": "print('first')" });
    // Rewrite without waiting — still a new commit because content changed.
    scheduleSnapshot("python", { "main.py": "print('second')" });
    commitSnapshot();

    expect(getHistory()).toHaveLength(2);
    expect(getHistory()[1].files["main.py"]).toBe("print('first')");
    expect(getHistory()[0].files["main.py"]).toBe("print('second')");
  });

  test("identical files do not create a duplicate snapshot", () => {
    scheduleSnapshot("react", { "App.jsx": "same" });
    commitSnapshot();
    vi.setSystemTime(Date.now() + 60_000);
    scheduleSnapshot("react", { "App.jsx": "same" });
    commitSnapshot();
    expect(getHistory()).toHaveLength(1);
  });

  test("snapshots are newest-first and capped at MAX_SNAPSHOTS", () => {
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i += 1) {
      vi.setSystemTime(Date.now() + 60_000);
      scheduleSnapshot("html", { "index.html": `v${i}` });
      commitSnapshot();
    }
    const history = getHistory();
    expect(history).toHaveLength(MAX_SNAPSHOTS);
    expect(history[0].files["index.html"]).toBe(
      `v${MAX_SNAPSHOTS + 4}`,
    );
  });

  test("clearHistory empties the stored list", () => {
    scheduleSnapshot("python", { "main.py": "print(1)" });
    commitSnapshot();
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  test("loadHistory returns [] for corrupt payloads", () => {
    localStorage.setItem(HISTORY_KEY, "{not json");
    expect(loadHistory()).toEqual([]);
  });

  test("replaceHistory overwrites storage", () => {
    scheduleSnapshot("react", { "App.jsx": "x" });
    commitSnapshot();
    replaceHistory([]);
    expect(getHistory()).toEqual([]);
  });

  test("saveHistory/loadHistory round-trip", () => {
    saveHistory([
      {
        id: "a",
        preset: "scss",
        files: { "styles.scss": "a{}" },
        savedAt: 1,
        chars: 3,
      },
    ]);
    expect(loadHistory()).toHaveLength(1);
    expect(loadHistory()[0].preset).toBe("scss");
  });
});

describe("activity record", () => {
  beforeEach(() => {
    resetHistoryForTests();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T10:00:00Z"));
  });

  afterEach(() => {
    resetHistoryForTests();
    vi.useRealTimers();
    localStorage.clear();
  });

  test("recordEdit sets first/last timestamps and counts bursts", () => {
    recordEdit();
    vi.setSystemTime(Date.now() + 10_000);
    recordEdit();
    // Within 2s of the last burst — still one burst.
    recordEdit();

    const a = getActivity();
    expect(a.editEvents).toBe(2);
    expect(a.firstEditAt).toBeLessThan(a.lastEditAt as number);
    expect(a.firstEditAt).not.toBeNull();
  });

  test("recordRun increments and persists runs", () => {
    recordRun();
    recordRun();
    expect(getActivity().runs).toBe(2);
    expect(loadActivity().runs).toBe(2);
  });

  test("activity with no edits reports null timestamps (student idle)", () => {
    const a = loadActivity();
    expect(a.firstEditAt).toBeNull();
    expect(a.lastEditAt).toBeNull();
    expect(a.editEvents).toBe(0);
  });

  test("flushHistory persists pending activity", () => {
    recordEdit();
    expect(localStorage.getItem(ACTIVITY_KEY)).toBeNull();
    flushHistory();
    expect(loadActivity().editEvents).toBe(1);
  });

  test("loadActivity returns empty record for corrupt JSON", () => {
    localStorage.setItem(ACTIVITY_KEY, "nope");
    expect(loadActivity()).toMatchObject({ firstEditAt: null, runs: 0 });
  });
});
