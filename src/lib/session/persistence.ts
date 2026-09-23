import { presets, type PresetKey } from "../../presets";

export const DRAFT_KEY_PREFIX = "codedesk_draft_";
export const ACTIVE_PRESET_KEY = "codedesk_active_preset";
const SCHEMA_VERSION = 1;
const LEGACY_DRAFT_KEY = "codedesk:draft";
const DRAFT_FLUSH_MS = 350;

interface DraftPayload {
  v: number;
  files: Record<string, string>;
}

export function draftKey(preset: PresetKey): string {
  return `${DRAFT_KEY_PREFIX}${preset}`;
}

export function saveDraft(
  preset: PresetKey,
  files: Record<string, string>,
): void {
  const payload: DraftPayload = { v: SCHEMA_VERSION, files };
  try {
    localStorage.setItem(draftKey(preset), JSON.stringify(payload));
  } catch {
    // Quota or private mode — drafts are best-effort.
  }
}

export function loadDraft(
  preset: PresetKey,
): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(draftKey(preset));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.v !== SCHEMA_VERSION ||
      typeof parsed.files !== "object" ||
      parsed.files === null
    ) {
      return null;
    }
    const files: Record<string, string> = {};
    for (const [name, content] of Object.entries(parsed.files)) {
      if (typeof content === "string") files[name] = content;
    }
    return files;
  } catch {
    return null;
  }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { preset: PresetKey; files: Record<string, string> } | null =
  null;

/**
 * Debounced write — localStorage on every keystroke is wasted work; the
 * trailing flush lands 350ms after typing stops (pagehide also forces it, so
 * reloads never drop a draft mid-burst).
 */
export function scheduleDraftSave(
  preset: PresetKey,
  files: Record<string, string>,
): void {
  pending = { preset, files };
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushDraftSave, DRAFT_FLUSH_MS);
}

export function flushDraftSave(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending) {
    const { preset, files } = pending;
    pending = null;
    saveDraft(preset, files);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushDraftSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushDraftSave();
  });
}

export function saveActivePreset(preset: PresetKey): void {
  try {
    localStorage.setItem(ACTIVE_PRESET_KEY, preset);
  } catch {
    // best-effort
  }
}

export function loadActivePreset(): PresetKey | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PRESET_KEY);
    if (raw !== null && raw in presets) return raw as PresetKey;
    return null;
  } catch {
    return null;
  }
}

/** Drop the pre-Phase-4 single-source draft key. */
export function cleanupLegacyDraft(): void {
  try {
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // best-effort
  }
}
