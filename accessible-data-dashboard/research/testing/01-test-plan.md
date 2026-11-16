# Usability test plan: Euro Area Monitor prototype

> **No results are recorded here.** This plan, and every template in this folder, is for you to run and fill in. The prototype tasks are built on the **hypothesis** JTBD in `../07-jtbd-hypotheses.md`. Revise them if the discovery interviews change those jobs.

## 1. Goals

1. Can professionals reach **decisions** with the dashboard (diverging country? fit to report? safe to present?) correctly and with confidence?
2. Do people notice data-trust signals (partial, stale, out-of-range, synthetic, provisional), understand them and act on them?
3. Can screen reader, magnifier and keyboard-only users complete the same decisions **in comparable time and with comparable accuracy** to other participants? This is the gap reported by Sharif et al. (2021) that the design is trying to close.
4. Are saved views, share links and export usable without help?

## 2. Research questions → measures

| Question | Measure | Source |
|---|---|---|
| Decision accuracy | Correct decision + correct justification (scored on the observation sheet rubric) | Observation sheet |
| Efficiency | Time on task (start = the moderator finishes reading the task; end = the participant states the decision) | Observation sheet |
| Trust-signal comprehension | Noticed the badge (Y/N, unprompted); explained it correctly (Y/N); changed the decision because of it (Y/N) | Observation sheet + probe |
| Effort | Single Ease Question (SEQ, 1–7) after each task | Moderator script |
| Overall usability | SUS (accessible version) at the end | `07-sus-questionnaire.md` |
| AT-specific barriers | Issues logged with severity, AT/browser and WCAG reference | Observation sheet + `09-manual-at-test-protocol.md` |

## 3. Participants (5 sessions)

| # | Profile | AT / settings | Notes |
|---|---|---|---|
| S1 | Analyst (macro, risk or data) | None, or keyboard-heavy | Pilot. Fix the script after this session |
| S2 | Finance manager | Screen magnifier or ≥ 200% zoom | Low-vision participant, **AT session** |
| S3 | Compliance / regulatory reporting | Screen reader (NVDA or JAWS) | **AT session** |
| S4 | Analyst or compliance | Screen reader (VoiceOver), keyboard-only, or voice control | AT session if recruitment allows |
| S5 | Finance manager or analyst | None | |

- At least 2 sessions with assistive technology users (required); 3 if possible.
- Recruit with `../03-recruitment.md`. Interview participants can come back for testing if they agreed to be contacted (consent item 7).
- Participants **use their own device and AT setup** wherever possible. Unfamiliar AT setups produce findings about the setup, not about the product.

## 4. Format and logistics

| | |
|---|---|
| Length | 60 min (75 min for AT sessions, with the extra time paid) |
| Mode | Remote by video with screen share (or in person). For screen reader users, ask them to share **system audio** so the moderator hears the screen reader. If that isn't possible, ask them to describe what they hear |
| Prototype URL | GitHub Pages: `https://theogg06.github.io/theogg06/` (enable Pages first; see README). Fallback: `npm run build && npx vite preview` |
| Task links | Each task has a prepared URL (`02-task-scenarios.md`). Simulated states are in the URL and **always show "Synthetic data"** |
| Reset between participants | Footer → "Prototype controls" → **Reset prototype (facilitator)**. This clears saved views, theme/density and filters |
| Roles | Moderator plus note-taker (camera off). Never more than 2 observers |
| Recording | Only with consent (consent item 4). Store as in the consent form; delete within 30 days |
| Analytics | **None.** The prototype has no tracking, no cookies and no third-party requests at runtime |

## 5. Session outline

| Min | Activity |
|---|---|
| 0–5 | Welcome, consent check, recording, AT/setup check |
| 5–8 | Think-aloud instructions + practice task (`04-think-aloud-instructions.md`) |
| 8–50 | 5–6 tasks from `02-task-scenarios.md`, each followed by the SEQ and a short probe |
| 50–55 | SUS questionnaire |
| 55–60 | Debrief: best/worst moment, anything missing, compensation |

**Task order:** rotate T2–T7 between participants (Latin-square style; see `02`) to limit learning effects. T1 always comes first, because it doubles as an orientation task.

## 6. Severity scale (used in the observation sheet and findings)

| Level | Name | Definition |
|---|---|---|
| 4 | Blocker | The participant could not complete the decision, or reached a **wrong decision with confidence** |
| 3 | Major | Completed only with a workaround, moderator help or a big time cost; or an AT barrier with no workaround |
| 2 | Minor | Hesitation or confusion that resolved without help |
| 1 | Cosmetic | Noticed but did not affect the task |

Accessibility issues also get a WCAG 2.2 success criterion where one applies. Issues with no WCAG criterion are still logged; they are often the most important ones.

## 7. Analysis

1. Within 24 h of each session, complete the observation sheet (`06-observation-sheet.md`).
2. After all sessions, move every issue into `08-findings-template.md`. Merge duplicates and count distinct participants per issue.
3. Prioritise by severity × frequency, with AT-blocking issues raised one level.
4. Calculate the mean SUS with the range. With n = 5, report it as **indicative only**. Don't compare it to benchmarks as if it were statistically meaningful.
5. Log design changes in `DECISIONS.md`, citing finding IDs.

## 8. Ethics and safety

- Use the consent form and verbal script in `../04-*`. Remind participants that **we are testing the prototype, not them**.
- Participants may skip any task. If one is stuck for more than 5 minutes, or visibly frustrated, move on. Record that as a finding, not as participant failure.
- AT participants: never take control of their machine. Don't ask them to change their usual settings.
- Pay compensation even if the session ends early.
