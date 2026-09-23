---
name: CodeDesk
description: Emission Line Rail — a charcoal spectrograph instrument where language, panels, and run state ride one off-centre rail as line forms.
colors:
  continuum-0: "#101114"
  continuum-1: "#16181c"
  continuum-2: "#1d2025"
  continuum-3: "#262a30"
  continuum-4: "#32373f"
  bone: "#e6e1d6"
  bone-dim: "#9b968c"
  bone-faint: "#8f8a81"
  output-paper: "#f4f1ea"
  wl-405: "#6b5cff"
  wl-436: "#4c7cff"
  wl-486: "#39b5e8"
  wl-546: "#3dd68c"
  wl-589: "#f5c542"
  wl-615: "#ff8a3d"
  wl-656: "#ff4d4d"
typography:
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.22em"
  label-wordmark:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.4em"
  tick:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.625
  editor:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  metric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "30px"
    fontWeight: 400
    letterSpacing: "-0.025em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  run-button:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  run-button-hover:
    textColor: "{colors.wl-589}"
  console-toggle:
    backgroundColor: "color-mix(in srgb, #101114 92%, transparent)"
    textColor: "{colors.bone-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  console-panel:
    backgroundColor: "color-mix(in srgb, #101114 94%, transparent)"
    textColor: "{colors.bone-dim}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 10px"
  output-plate:
    backgroundColor: "{colors.output-paper}"
    textColor: "rgba(0, 0, 0, 0.7)"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  rail-stop:
    textColor: "{colors.bone-dim}"
    typography: "{typography.label}"
  rail-stop-active:
    textColor: "{colors.bone}"
  rail-stub:
    width: "5px"
    height: "100%"
---

# Design System: CodeDesk

## Overview

**Creative North Star: "The Emission Line Rail"**

CodeDesk reads as a laboratory instrument for code, not a website and not an IDE clone. The whole interface is one off-centre emission rail: languages, panel destinations, and the run lifecycle all exist as lines on that spine, and the workspace blooms off it as a single giant plate. The ground is a procedural charcoal continuum — banded, never flat — with bone legends burned over it like plate annotations.

Color is scarce and strictly physical. It exists only where a spectrometer would show it: as 1px hairline emission lines at seven named wavelengths (405, 436, 486, 546, 589, 615, 656 nm), one slot per curriculum language, JSX holding 486 nm today. State is carried in line form — half-height idle, dashed pending, solid live, doubled for filed/fault — so the instrument stays readable without relying on hue. Everything else is ink: one grotesque at one UI size, ranked by tracking and bone depth, with mono reserved for readings.

Density is high and chrome is singular. A single bone hairline header row sits above the plates; the console hangs as a dashed stub off the rail's lower third; there is no hero and no marketing surface — the instrument itself is the first viewport. Confirmed rejection: the three-pane dark IDE clone with chrome scattered across all four edges.

**Key Characteristics:**

- One left-of-centre rail owns navigation, language identity, and run state as line forms
- Color appears only as emission lines at seven wavelengths (405–656 nm); ground and ink stay on the continuum/bone axes
- Procedural banded charcoal continuum ground; exactly one light surface (the output paper plate)
- Single grotesque (Geist) at one UI size ranked by tracking; Geist Mono for ticks, code, console, and metrics
- Zero radius, zero shadows — 1px hairlines, dashes, and doubled lines do all structural work
- Full-viewport instrument: hairline header row, bloomed 55/45 source/output plate, console slip off the rail

## Colors

The palette is two neutral axes — a charcoal continuum for matter, warm bone for ink — punctured only by spectral emission lines that are never used as fills.

### Primary

- **Cyan Emission 486 nm** (#39b5e8): the active language line (JSX). Marks the live/solid run form, active tick label, editor caret and selection, focus rings, the active-line tint, and the open console stub. It is the only accent a student sees during a normal run.

### Secondary

- **Sodium Emission 589 nm** (#f5c542): the run-control wavelength. Dashed pending form while compiling, sodium-doubled "Filed" success form, Run button hover/focus, and console warn lines.

### Tertiary

- **Red Emission 656 nm** (#ff4d4d): fault wavelength only — the error-doubled rail form, the fault phase label, and console error entries.

### Reserved Emissions

- **Violet 405** (#6b5cff), **Blue 436** (#4c7cff), **Green 546** (#3dd68c), **Orange 615** (#ff8a3d): future-language slots, already ticked on the rail; 436 also serves console info lines until its language arrives.

### Neutral

- **Continuum Base** (#101114): root ground and the base of every translucent surface; **Continuum 1–3** (#16181c, #1d2025, #262a30) band the ground gradient; **Continuum High** (#32373f): scrollbar thumb.
- **Bone** (#e6e1d6): primary ink — editor text, active labels, wordmark, run metrics.
- **Bone Dim** (#9b968c): secondary ink — default labels, tick numerals, console log lines, stop subtitles.
- **Bone Faint** (#8f8a81): the instrument's etched lines — rail spine, ticks, idle run line, Run border, gutter numerals.
- **Output Paper** (#f4f1ea): the single light surface; the output plate only.

### Named Rules

**The Wavelength Rule.** Chromatic color appears only as emission lines at the seven named wavelengths — lines, ticks, carets, and console levels. A new surface does not get a new hue; the ground and ink stay on the continuum/bone axes.

**The Line-Form State Rule.** State reads as line form first — half = idle, dashed = pending, solid = live, doubled = filed or fault. Hue reinforces the form; it never carries state alone.

## Typography

**Display Font:** Geist (with system-ui, sans-serif fallback)
**Body Font:** Geist (same stack; UI prose is rare)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace fallback) — ticks, code, console, keycaps, metrics

**Character:** One utilitarian grotesque doing instrument-legend duty, paired with a mono that behaves like readout tape. The system is deliberately monotonous in size and expressive in tracking.

### Hierarchy

- **Wordmark** (500, 10px, 0.4em tracking, uppercase): the CodeDesk header mark — the label rank opened to its widest tracking.
- **Label** (500, 10px, 0.22em tracking, uppercase): every legend, stop title, plate header, and phase readout — the single UI size.
- **Active label** (500, 10px, 0.28em tracking, uppercase, ink lifted to bone): the selected rail stop.
- **Tick** (400, 9px mono, 0.04em, tabular): wavelength numerals beside the spine.
- **Body** (400, 11px mono, 1.625 line-height): console entries, slip copy, plate empty states.
- **Editor** (400, 13px mono, 1.55 line-height): source plate code; 11px mono gutters.
- **Metric** (400, 30px mono, -0.025em, tabular): run counter in the rail footer. Stop subtitles and keycaps sit at 10px mono (0.14–0.2em).

### Named Rules

**The One-Rank Rule.** All chrome labels are the same 10px/500 uppercase grotesque; hierarchy comes from tracking (0.22em → 0.28em active → 0.4em wordmark) and ink (bone-dim → bone), never from a second size. Mono is reserved for readings.

## Layout

Full-viewport instrument (100dvh, no page scroll). A fixed rail column — 132px (168px ≥640px) — sits at the left edge with a bone@14% hairline border; the 1px bone-faint spine runs its full height at 24px from the viewport edge, ticked at seven wavelengths (14%–86% of height), with rail content in a 40px gutter and stop connectors bridging toward the spine.

The field right of the rail stacks a single hairline header row (px-4/6, py-2.5) over the plates. Plates split **50/50 as rows below 1024px** and **55/45 as columns (source left, output right) at ≥1024px**. The console slip is absolutely pinned off the rail (left = rail width, top 64%, z-20): 120px wide on small screens, 320px ≥640px, 400px ≥1024px, panel capped at 176px tall; plates reserve a 64px (56px ≥640px) bottom inset so it never covers code. Spacing rides the standard step scale (8 / 12 / 16 / 24 / 32 / 40px). Below 640px the header subtitle hides and the rail narrows; nothing reflows into a hamburger or drawer — the rail stays.

### Named Rules

**The One-Spine Rule.** Every destination, state readout, and control hangs off the single left rail; chrome never migrates to the other three edges.

## Elevation & Depth

The system is flat: no box-shadows ship anywhere. Depth comes from the continuum's tonal banding (the 100deg ground gradient plus a 3px-pitch 1.5% white hairline repeat), 1px hairlines at bone 12–18% for structure, and the console slip's translucent continuum base (92–94%) with a 2px backdrop blur floating over the plates. Focus is a 1px wl-486 outline at 2px offset; selection is wl-486 at 45%.

### Named Rules

**The Flat Instrument Rule.** Surfaces sit flat on the continuum. If something needs to feel closer, raise its ink or tighten a hairline — never a shadow.

## Shapes

Radius is 0 everywhere — plates, buttons, slip, scrollbars (the thumb is explicitly square). The silhouette vocabulary is linear, not cornered: 1px spine and hairlines, 9px tick stubs, 16px stop connectors, a 2px solid run line, 5px doubled run forms, 6px-on/6px-off vertical dashes (pending) and 5px dashes (console stubs), and dashed 1px borders on the slip. No clipping or rounded masks; the only clip in the system is the rail-travel `clip-path` reveal on the solid run line.

### Named Rules

**The Zero-Radius Rule.** Every corner is a hard 90°. Form is expressed by line weight, dash, and doubling — never by radius.

## Components

Character: instrument parts — etched, square, labeled in the one rank, alive only where a reading changes.

### Buttons

- **Shape:** square (radius 0), 1px bone-faint border, full width of the rail gutter, padding 8px 12px.
- **Primary (Run):** transparent over the continuum; label-rank "Run" in bone with a 10px mono keycap hint (⌘/Ctrl ↵) in bone-dim. A 5px line-form stub hugs its left edge — sodium-doubled (wl-589) at rest/pending, language-doubled (wl-486) when live, error-doubled (wl-656) on fault — pre-echoing the rail state.
- **Hover / Focus:** border and label shift to sodium (wl-589); focus-visible takes the global 1px wl-486 outline at 2px offset.

### Cards / Containers

- **Console slip:** dashed hairline borders (bone at 22–28%), translucent continuum base (92–94%) with 2px backdrop blur, radius 0, padding 12px 10px, max-height 176px, pinned at 64% viewport height off the rail. A 32px horizontal stub leads the toggle: dashed bone at rest, solid wl-486 when open, dashed wl-656 on error. Entries: mono 11px, level colors log → bone-dim, info → 436, warn → 589, error → 656.
- **Output plate:** the only light card — Output Paper ground, chrome labels at black/70 with black/55 state text over a black/15 hairline, radius 0. The sandbox iframe paints its own near-match canvas (treat output-paper as normative).
- **Source plate:** transparent over the continuum; label-rank header ("Source plate" / "JSX"), editor inset with 64px/56px bottom reserve for the slip.

### Inputs / Fields

- **Style:** CodeMirror with a transparent editor over the continuum — bone text (13px mono, 1.55), wl-486 caret, transparent gutters behind a bone@12% hairline (11px bone-faint numerals), placeholder at #6e6a63.
- **Focus:** the editor suppresses its own outer ring; focus reads through caret, active line (wl-486 @6%), and active gutter numeral (wl-486). Interactive chrome outside the editor uses the global focus-visible outline.

### Navigation

- **Rail stops:** four destinations (Language / Source / Output / Slip), each a label-rank title over a 10px mono subtitle (0.14em), with a 16px hairline connector reaching toward the spine — bone-faint at rest, language-colored when active. Active lifts ink to bone and widens tracking to 0.28em.
- **Header row:** static bone hairline; wordmark at 0.4em tracking, descriptor label (hidden <640px), wavelength readout in the language color, and line count in bone-dim. Mobile keeps the rail — no drawer, no collapse.

### Instrument Rail (Signature)

The spine is the product. A 1px bone-faint line runs full height with seven ticks; the active language's tick numeral burns wl-486. The run line overlays it at left −2px, morphing between five forms: **half** (half-height, 1px bone-faint — "Idle · half"), **dashed** (wl-589 6px on/off — "Compiling · dashed"), **solid** (2px, language line, 900ms clip-path travel reveal — "Live · solid"), **sodium-double** (5px: 1px wl-589 / 2px gap / 1px wl-589 — "Filed · sodium"), **error-double** (same geometry in wl-656 — "Fault · doubled"). Transitions: top 420ms and width 320ms on cubic-bezier(0.22, 1, 0.36, 1), color 280–320ms ease; all of it disabled under prefers-reduced-motion. The rail footer carries the run counter (30px mono tabular) and last-run milliseconds above the Run control.

## Do's and Don'ts

### Do:

- **Do** carry run and language state as line form on the rail first — half / dashed / solid / sodium-double / error-double — and let hue reinforce it.
- **Do** separate structure with 1px bone hairlines (bone at 12–18% mix; dashed at 22–28% on the slip).
- **Do** rank every label with the one rank: Geist 10px/500 uppercase at 0.22em; widen to 0.28em and lift to bone when active.
- **Do** keep corners at radius 0 and surfaces shadow-free; depth is the continuum band plus hairlines.
- **Do** reserve the seven wl-* hues for lines, ticks, carets, and console levels — on the paper plate, chrome switches to black-alpha ink.
- **Do** hang new destinations, readouts, and controls off the left rail as stops and stubs.

### Don't:

- **Don't** signal state by hue alone — a state without a distinct line form doesn't ship.
- **Don't** paint fills, panels, or gradients with wavelength hues; the ground stays continuum and the ink stays bone.
- **Don't** add box-shadows or rounded corners to lift a surface; raise ink or tighten a hairline instead.
- **Don't** scatter chrome onto the top, right, or bottom edges — the rail owns navigation and controls, the header owns one row.
- **Don't** introduce a second UI type size for chrome; new labels join the one rank and differentiate by tracking.
