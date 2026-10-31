# Decisions log

A short rationale for every non-obvious choice. Newest at the bottom of each phase. Format: **Decision**, then *why*, then alternatives considered.

## Setup

**D-001 · The project lives in `accessible-data-dashboard/` inside `theogg06/theogg06`.**
*Why:* This session can only push to this repository, and the root README is the GitHub profile page, so a subfolder keeps the profile intact. *Alternative:* a dedicated repository. The folder can be moved later with `git filter-repo --subdirectory-filter` without losing history.

**D-002 · Charting library: Highcharts (with the accessibility, pattern-fill and sonification modules).**
*Why:* It has the most complete built-in screen reader and keyboard support available: point-by-point keyboard navigation, screen reader region descriptions, an accessible data table, pattern fills, dash styles, marker symbols, and sonification for the stretch goal. Building the equivalent on ECharts would take significant custom work and be less battle-tested. *Licence:* Highcharts is free for non-commercial use only, which covers a personal portfolio. Commercial use requires a paid licence. This is documented in the README. *Alternative:* ECharts (Apache-2.0) with a custom keyboard layer, chosen by user decision on 2026-10-31.

**D-003 · Design tokens: create a minimal placeholder set (light, dark, high-contrast).**
*Why:* No `packages/tokens` exists in this repository, and the user chose to create placeholders. Tokens are written in a format that can be swapped for the Accessible Design System's tokens later. They're mirrored as Figma variables and marked **placeholder**.

**D-004 · Figma file is created in the user's drafts on their only available plan.**
*Why:* User decision on 2026-10-31. The file can be moved to a personal team later.

**D-005 · Real data is fetched by a build-time script and cached as committed JSON snapshots.**
*Why:* The brief calls for build-time fetching. Snapshots make the prototype deterministic for testing and usable offline. *Blocker at setup:* the container's network policy denies `data-api.ecb.europa.eu` and `ec.europa.eu`. The user will allowlist them. Until then, no "real" snapshot is fabricated.

## Phase 0: Research

**D-010 · Personas spread accessibility needs across all three roles. There's no separate "accessibility persona".**
*Why:* A separate disabled persona tends to become a checklist item that's easy to ignore. Making disability one attribute of an expert professional (low vision in the finance manager, a screen reader and braille in the compliance officer, situational high zoom in the analyst) keeps those needs in every design decision. It also avoids defining someone by their impairment.

**D-011 · Interview guide is decision-centred (critical incident technique), with no prototype shown.**
*Why:* Showing a prototype in discovery anchors people on its UI. Asking about a real decision from last week gets real behaviour, workarounds and trust checks instead of opinions about charts.

**D-012 · Affinity map has a CSV form as well as a whiteboard form.**
*Why:* Whiteboard tools are hard to use with a screen reader. A CSV can be sorted and filtered with any AT, so synthesis can include AT-using collaborators. On the whiteboard, sticky types are coded by text prefix as well as colour (1.4.1).

**D-013 · Consent uses GDPR Art. 6(1)(a) consent, plus Art. 9(2)(a) explicit consent for any disability or AT information.**
*Why:* Information about assistive technology use can reveal health data, which is a special category. The form asks about tools, never conditions, and gets explicit consent for recording it. The data minimisation choices: 30-day recording deletion, contact details kept separately.

**D-014 · Desk research cites only sources that were checked during this session. Figures are quoted only where they appear in the source's abstract.**
*Why:* The rule against fabrication. Anything not checked against full text is flagged for re-checking before it goes into the case study.
