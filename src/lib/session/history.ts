import type { PresetKey } from "../../presets";

export const HISTORY_KEY = "codedesk_history";
export const ACTIVITY_KEY = "codedesk_activity";

const HISTORY_SCHEMA = 1;
const ACTIVITY_SCHEMA = 1;

/**
 * Save a snapshot after this much quiet time following an edit — short enough
 * that a delete-and-rewrite in the same second still leaves both versions.
 */
export const SNAPSHOT_IDLE_MS = 1_500;
/** Hard cap so a long lab session cannot blow the localStorage quota. */
export const MAX_SNAPSHOTS = 120;

export interface HistorySnapshot {
  id: string;
  preset: PresetKey;
  files: Record<string, string>;
  savedAt: number;
  chars: number;
}

export interface ActivityRecord {
  firstEditAt: number | null;
  lastEditAt: number | null;
  editEvents: number;
  runs: number;
}

interface HistoryPayload {
  v: number;
  snapshots: HistorySnapshot[];
}

interface ActivityPayload {
  v: number;
  activity: ActivityRecord;
}

function emptyActivity(): ActivityRecord {
  return { firstEditAt: null, lastEditAt: null, editEvents: 0, runs: 0 };
}

function countChars(files: Record<string, string>): number {
  let total = 0;
  for (const content of Object.values(files)) total += content.length;
  return total;
}

function sameFiles(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function makeId(now: number): string {
  return `${now}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPresetKey(value: unknown): value is PresetKey {
  return (
    value === "html" ||
    value === "bootstrap" ||
    value === "jquery" ||
    value === "scss" ||
    value === "react" ||
    value === "python"
  );
}

function isValidSnapshot(value: unknown): value is HistorySnapshot {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Partial<HistorySnapshot>;
  return (
    typeof s.id === "string" &&
    isPresetKey(s.preset) &&
    typeof s.savedAt === "number" &&
    typeof s.chars === "number" &&
    typeof s.files === "object" &&
    s.files !== null &&
    Object.values(s.files).every((c) => typeof c === "string")
  );
}

export function loadHistory(): HistorySnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<HistoryPayload>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.v !== HISTORY_SCHEMA ||
      !Array.isArray(parsed.snapshots)
    ) {
      return [];
    }
    return parsed.snapshots.filter(isValidSnapshot);
  } catch {
    return [];
  }
}

export function saveHistory(snapshots: HistorySnapshot[]): void {
  try {
    const payload: HistoryPayload = { v: HISTORY_SCHEMA, snapshots };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(payload));
  } catch {
    // Drop oldest half and retry once — long sessions on small quotas.
    try {
      const trimmed = snapshots.slice(Math.ceil(snapshots.length / 2));
      const payload: HistoryPayload = { v: HISTORY_SCHEMA, snapshots: trimmed };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(payload));
    } catch {
      // Best-effort: drafts still protect the current code.
    }
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // best-effort
  }
}

export function loadActivity(): ActivityRecord {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return emptyActivity();
    const parsed = JSON.parse(raw) as Partial<ActivityPayload>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.v !== ACTIVITY_SCHEMA ||
      typeof parsed.activity !== "object" ||
      parsed.activity === null
    ) {
      return emptyActivity();
    }
    const a = parsed.activity as Partial<ActivityRecord>;
    return {
      firstEditAt:
        typeof a.firstEditAt === "number" ? a.firstEditAt : null,
      lastEditAt: typeof a.lastEditAt === "number" ? a.lastEditAt : null,
      editEvents: typeof a.editEvents === "number" ? a.editEvents : 0,
      runs: typeof a.runs === "number" ? a.runs : 0,
    };
  } catch {
    return emptyActivity();
  }
}

export function saveActivity(activity: ActivityRecord): void {
  try {
    const payload: ActivityPayload = { v: ACTIVITY_SCHEMA, activity };
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(payload));
  } catch {
    // best-effort
  }
}

/**
 * In-memory activity + dirty files awaiting the next idle snapshot.
 * Flushed on the idle timer, pagehide, and visibilitychange — same pattern
 * as the draft debounce so a closed tab never loses the trailing snapshot.
 */
let activity: ActivityRecord = loadActivity();
let dirty: { preset: PresetKey; files: Record<string, string> } | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let listeners: Array<() => void> = [];

function notify(): void {
  for (const fn of listeners) fn();
}

export function subscribeHistory(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
}

export function getActivity(): ActivityRecord {
  return activity;
}

export function getHistory(): HistorySnapshot[] {
  return loadHistory();
}

/** Record a content-changing edit (in memory; persisted with the next flush). */
export function recordEdit(): void {
  const now = Date.now();
  if (activity.firstEditAt === null) {
    activity.firstEditAt = now;
    activity.lastEditAt = now;
    activity.editEvents = 1;
  } else {
    // Count bursts, not keystrokes — Monaco fires setFile per character.
    const prev = activity.lastEditAt;
    if (prev !== null && now - prev > 2_000) activity.editEvents += 1;
    activity.lastEditAt = now;
  }
  scheduleFlush();
}

export function recordRun(): void {
  activity.runs += 1;
  saveActivity(activity);
}

export function flushActivity(): void {
  saveActivity(activity);
}

export function scheduleSnapshot(
  preset: PresetKey,
  files: Record<string, string>,
): void {
  dirty = { preset, files };
  if (idleTimer !== null) clearTimeout(idleTimer);
  idleTimer = setTimeout(commitSnapshot, SNAPSHOT_IDLE_MS);
}

/** Git-style checkpoint: commit this content immediately if it changed. */
export function snapshotNow(
  preset: PresetKey,
  files: Record<string, string>,
): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  dirty = { preset, files };
  commitSnapshot();
}

function clearIdleTimer(): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function scheduleFlush(): void {
  // Coalesce activity writes — one disk hit per burst, not per keystroke.
  if (idleTimer !== null) return;
  idleTimer = setTimeout(() => {
    commitSnapshot();
  }, SNAPSHOT_IDLE_MS);
}

/** Append the pending snapshot (if content changed) and persist activity. */
export function commitSnapshot(): void {
  clearIdleTimer();
  saveActivity(activity);

  if (!dirty) return;
  const { preset, files } = dirty;
  dirty = null;

  const snapshots = loadHistory();
  const last = snapshots[0];
  const now = Date.now();

  // Content equality is the only gate — never drop a distinct version
  // because of a time window (that lost intermediate edits before).
  if (last && sameFiles(last.files, files)) return;

  snapshots.unshift({
    id: makeId(now),
    preset,
    files: { ...files },
    savedAt: now,
    chars: countChars(files),
  });

  const capped =
    snapshots.length > MAX_SNAPSHOTS
      ? snapshots.slice(0, MAX_SNAPSHOTS)
      : snapshots;
  saveHistory(capped);
  notify();
}

/** Force a pending snapshot now (page hide / tab blur). */
export function flushHistory(): void {
  commitSnapshot();
  saveActivity(activity);
}

/** Replace the stored list after a restore/clear mutation. */
export function replaceHistory(snapshots: HistorySnapshot[]): void {
  saveHistory(snapshots);
  notify();
}

/** Test helper — drop timers and pending state between cases. */
export function resetHistoryForTests(): void {
  clearIdleTimer();
  dirty = null;
  activity = emptyActivity();
  listeners = [];
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushHistory);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushHistory();
  });
}
