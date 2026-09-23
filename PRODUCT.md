# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js + TypeScript (user-selected). Deploy target: Vercel.

## Users

Students at a school that teaches coding on Chromebooks, currently learning React/JSX this semester. They need a ready-to-use, configured environment to practice without local tooling. More languages will be added as the curriculum covers them.

## Product Purpose

CodeDesk is an in-browser code playground: open it, write JSX/React, see it run. Success means a student on a locked-down Chromebook can practice the semester's JSX exercises with zero setup, and the school can add the next curriculum language without restructuring the product.

## Positioning

A school-configured playground, not a general-purpose IDE clone: preconfigured for whatever the class is learning right now (JSX first), extensible through a language plug-in seam so each new curriculum language is an adapter, not a rewrite. No account, no install, no server-side code execution required for client-runnable languages.

## Operating Context

- Chromebooks: locked-down browsers, modest CPU/RAM, no admin installs.
- Classroom sessions: short bursts of practice between instruction.
- Vercel deploy; open-source repository.
- Code execution for JSX is client-side (Babel transform + sandboxed iframe) so it works without backend runtimes; future non-JS languages may need different adapters (e.g. WASM or external APIs) behind the same seam.

## Capabilities and Constraints

- v1 scope: code playground only — editor, live preview, console/output for JSX/React practice.
- Starter JSX/React template preconfigured (React from CDN or bundled, sensible defaults).
- Language system designed as a seam from day one; v1 ships one language (JSX/React), more plug in later.
- No auth, no persistence server, no automated grading in v1 (localStorage drafts acceptable).
- No exercises/lessons/grading system in v1.

## Brand Commitments

- Name: CodeDesk.

## Evidence on Hand

None yet (greenfield). No real screenshots, testimonials, or school branding assets supplied. Future work must not invent school names, endorsements, or claims.

## Product Principles

1. Zero setup: the environment is preconfigured; students never install or configure tools.
2. Client-first execution: run code in the browser wherever the language allows; keep Chromebooks fast and the Vercel bill at zero.
3. Languages are adapters: adding a curriculum language means registering an adapter behind the runner seam, not redesigning the UI.
4. Practice over features: editor + preview + console are the product; resist IDE bloat.
5. Built for the semester's reality: the default state matches what the class is learning now.

## Accessibility & Inclusion

Standard web accessibility applies (keyboard navigation, contrast, focus states). School setting implies shared/public machines — no personalization assumptions. No specific standard confirmed yet.
