# Interview guide: decisions made with data

**Format:** 45 minutes, remote or in person, one participant and one moderator (plus an optional note-taker with the camera off).
**Planned sessions:** 4–5 (see `03-recruitment.md` for the mix).
**Focus:** *Decisions, not charts.* We want to know what people needed to decide, what they needed to know to decide it, and what happened when the data let them down. Don't show the prototype in these sessions; it gets tested separately (see `testing/`).

## Research objectives

1. Find the recurring decisions each role makes with economic or financial data, and how often they make them.
2. Learn what "enough information to decide" means to them: which numbers, comparisons and context.
3. Find out how they detect missing, late or suspect data, and what they do when that happens.
4. Map how findings get shared and what gets lost along the way.
5. For assistive technology (AT) users: learn their current strategies for charts and dashboards, and what those strategies cost them.

## Before the session

- [ ] Signed consent form received, or verbal consent script ready (`04-verbal-consent-script.md`).
- [ ] Participant's access needs confirmed in advance. Ask: "Is there anything that would make the session work better for you?" Examples: extra time, captions, camera off, sending the questions beforehand, breaks, a particular platform.
- [ ] Meeting platform tested with the participant's AT if they said they use one. Have a dial-in fallback ready.
- [ ] Note template open (`templates/interview-notes.md`). Participant ID assigned (e.g. P03). **Never record names in notes.**
- [ ] Recording started only *after* consent is given on the recording.

## Moderator principles

- Ask about **specific past events** ("last Tuesday"), not general habits ("usually").
- Ask "What did you do next?" more than "Why?". Follow their story.
- Don't name features ("Would a filter help?"). Ask what they were trying to do.
- Silence is fine. Count to five before you fill a pause.
- If they ask how *you* would do it, say: "I'm more interested in how you see it; there's no right answer."
- Adapt pace to the participant. Screen reader users may be listening to both you and their AT, so pause after questions and offer to repeat.

---

## 0. Warm-up (5 min)

> Thanks for making the time. I'm [name], and I'm researching how people in finance and analysis use data to make decisions. I'm not testing you, and there are no wrong answers. I'm trying to learn from your experience. We'll take about 45 minutes. You can skip any question or stop at any time.
>
> [If recording] You agreed to recording on the form. I'll start the recording now. Can you confirm for the recording that you're OK with it? [Wait for "yes".]

1. Tell me a bit about your role. What are you responsible for?
2. Who relies on your work? Who do you rely on?
3. Roughly what share of a normal week do you spend working with numbers, reports or dashboards?

## 1. Context: the data in their work (8 min)

4. Which data sources or reports do you look at most often? *(Listen for: internal, ECB/Eurostat, Bloomberg, Excel, BI tools.)*
5. Walk me through the first time you look at data on a typical day. What are you checking for?
   - *Probe:* What would make you stop and look more closely?
6. Which tools do you use to look at or work with that data?
   - *Probe:* Which one do you trust most? Why?
   - *AT probe (if they mentioned AT in screening):* How do these tools work with your [screen reader / magnifier / settings]?

## 2. Critical incident: a recent decision (15 min). Core section.

7. Think of a decision you made, or helped make, in the last week or two where data mattered. What was the decision?
   - *If stuck:* "It could be small, like whether to flag something, whether to escalate, what to put in a report, or whether to change a forecast."
8. What did you need to know to make that decision?
   - *Probe:* What did you look at first? And then?
   - *Probe:* What were you comparing it to (last month, a target, another country, a threshold)?
   - *Probe:* At what point did you feel you knew enough?
9. How did you find that information? Walk me through it step by step.
   - *Probe:* Where did you click, search, ask or export?
   - *Probe:* How long did it take? Was that normal?
10. What did you decide in the end? Who did you tell, and how?
11. Looking back, was there anything you wished you'd known, or known sooner?

## 3. When data is missing or suspect (8 min)

12. Tell me about a time the data you needed was missing, late or looked wrong.
    - *Probe:* How did you notice? Did the tool tell you, or did you spot it?
    - *Probe:* What did you do next (wait, estimate, use another source, escalate, add a caveat)?
    - *Probe:* What happened as a result?
13. How do you decide whether a number is trustworthy enough to act on?
    - *Probe:* What do you check (source, date, method, who produced it)?
14. *(Compliance or risk participants)* When someone challenges a number you reported, what do you need to be able to show them?

## 4. When the dashboard fails them, and sharing (6 min)

15. Tell me about the last time a dashboard or report didn't give you what you needed. What did you do instead?
    - *AT probe:* Are there parts of dashboards or charts you usually skip or work around? What do you do instead (export, ask a colleague, use a table)? How much extra time does that take?
16. When you share a finding, what form does it take: a screenshot, an exported file, a link, an email summary, a slide?
    - *Probe:* What gets lost or misunderstood when you share it?
    - *Probe:* Have you ever sent a chart to someone who couldn't use it (on a phone, printed in black and white, with a screen reader)?

## 5. Wrap-up (3 min)

17. If you could change one thing about how you get the numbers you need, what would it be?
18. Is there anything I should have asked but didn't?
19. Would you be willing to try out an early prototype in a separate session later? *(Record yes/no only. Contact details stay in the separate recruitment sheet, never in notes.)*

> Thank you, this has been really helpful. [Explain compensation, if any, and when it will arrive.] If you want to withdraw your data later, just email [contact] with your participant ID: **P__**.

Stop the recording. Write a 5-minute debrief in the note template straight away (top three surprises, strongest quote, follow-ups).

---

## Timing cheat-sheet

| Section | Minutes | Cumulative |
|---|---|---|
| Warm-up | 5 | 5 |
| Context | 8 | 13 |
| Critical incident | 15 | 28 |
| Missing or suspect data | 8 | 36 |
| Failure and sharing | 6 | 42 |
| Wrap-up | 3 | 45 |

If you're running over, **cut section 1 questions 5–6 first**. Never cut section 2.

## Adapting for participants with disabilities

- **Screen reader users:** Don't screen-share visual stimuli. Read out anything you'd normally show. Allow extra time; the 45-minute target can stretch to 60 if they agree (compensate for the extra time).
- **Low vision:** Ask about their preferred zoom, contrast or magnifier setup. If you share your screen, make sure the platform supports their zoom.
- **Cognitive or learning disabilities, fatigue, attention:** Offer the questions in advance. Use one question at a time with no compound questions. Offer a break at the halfway point. Let them answer in writing via chat if they prefer.
- **Deaf or hard of hearing:** Turn on live captions, or arrange a sign language interpreter (book in advance and budget for it).
- Never ask about diagnosis or medical details. Ask only about tools, settings and strategies they choose to share.
