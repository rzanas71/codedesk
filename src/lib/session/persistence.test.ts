import { beforeEach, describe, expect, test } from "vitest";
import {
  ACTIVE_PRESET_KEY,
  cleanupLegacyDraft,
  draftKey,
  flushDraftSave,
  loadActivePreset,
  loadDraft,
  saveActivePreset,
  saveDraft,
  scheduleDraftSave,
} from "@/lib/session/persistence";

describe("preset draft persistence", () => {
  beforeEach(() => {
    // Settle + drop any pending debounced write before wiping storage.
    flushDraftSave();
    localStorage.clear();
  });

  test("uses per-preset keys like codedesk_draft_react", () => {
    expect(draftKey("react")).toBe("codedesk_draft_react");
    expect(draftKey("html")).toBe("codedesk_draft_html");
  });

  test("round-trips files through save and load", () => {
    saveDraft("react", { "App.jsx": "const a = 1;", "index.html": "<html>" });
    expect(loadDraft("react")).toEqual({
      "App.jsx": "const a = 1;",
      "index.html": "<html>",
    });
  });

  test("drafts are isolated per preset", () => {
    saveDraft("react", { "App.jsx": "react edits" });
    expect(loadDraft("html")).toBeNull();
    expect(loadDraft("react")).toEqual({ "App.jsx": "react edits" });
  });

  test("returns null when nothing was saved", () => {
    expect(loadDraft("python")).toBeNull();
  });

  test("returns null for corrupt payloads", () => {
    localStorage.setItem(draftKey("html"), "{not json");
    expect(loadDraft("html")).toBeNull();
  });

  test("returns null when the schema version does not match", () => {
    localStorage.setItem(
      draftKey("html"),
      JSON.stringify({ v: 999, files: { "index.html": "x" } }),
    );
    expect(loadDraft("html")).toBeNull();
  });

  test("drops non-string file entries", () => {
    localStorage.setItem(
      draftKey("html"),
      JSON.stringify({ v: 1, files: { "index.html": "ok", evil: { x: 1 } } }),
    );
    expect(loadDraft("html")).toEqual({ "index.html": "ok" });
  });

  test("overwrites previous drafts", () => {
    saveDraft("python", { "main.py": "one" });
    saveDraft("python", { "main.py": "two" });
    expect(loadDraft("python")).toEqual({ "main.py": "two" });
  });
});

describe("debounced draft scheduling", () => {
  beforeEach(() => {
    flushDraftSave();
    localStorage.clear();
  });

  test("scheduleDraftSave defers the write until flushed", () => {
    scheduleDraftSave("react", { "App.jsx": "debounced" });
    expect(loadDraft("react")).toBeNull();
    flushDraftSave();
    expect(loadDraft("react")).toEqual({ "App.jsx": "debounced" });
  });

  test("a later schedule supersedes an earlier pending write", () => {
    scheduleDraftSave("react", { "App.jsx": "one" });
    scheduleDraftSave("react", { "App.jsx": "two" });
    flushDraftSave();
    expect(loadDraft("react")).toEqual({ "App.jsx": "two" });
  });

  test("flushDraftSave is safe with nothing pending", () => {
    expect(() => flushDraftSave()).not.toThrow();
  });
});

describe("active preset persistence", () => {
  beforeEach(() => {
    flushDraftSave();
    localStorage.clear();
  });

  test("round-trips the active preset", () => {
    saveActivePreset("scss");
    expect(loadActivePreset()).toBe("scss");
  });

  test("returns null when unset or not a known preset", () => {
    expect(loadActivePreset()).toBeNull();
    localStorage.setItem(ACTIVE_PRESET_KEY, "cobol");
    expect(loadActivePreset()).toBeNull();
  });
});

describe("legacy cleanup", () => {
  test("removes the old single-source draft key", () => {
    localStorage.setItem("codedesk:draft", JSON.stringify({ v: 1, source: "x" }));
    cleanupLegacyDraft();
    expect(localStorage.getItem("codedesk:draft")).toBeNull();
  });
});
