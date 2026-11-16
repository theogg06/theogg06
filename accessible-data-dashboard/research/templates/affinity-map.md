# Affinity map template

There are two ways to use this:

1. **Spreadsheet / CSV:** Fill in `affinity-map.csv` (same columns as below), one row per atomic note. Sort and group by `theme`. This works fully with a screen reader and keyboard, so it's the preferred format if anyone on the synthesis team uses AT.
2. **Whiteboard (FigJam / Miro):** One sticky per row. Colour by `type`, **and** prefix the text with the type code (e.g. `[P]`) so the grouping doesn't rely on colour.

## Step 1: Atomise (one row per idea)

| id | participant | type | note | quote (verbatim) | decision it relates to | theme (fill in step 2) | jtbd_id | severity / importance |
|---|---|---|---|---|---|---|---|---|
| N001 | P01 | O | | | | | | |
| N002 | P01 | Q | | "…" (12:30) | | | | |
| N003 | P02 | P | | | | | | |

**type** = O observation · Q quote · D decision · P pain point · T trust signal · S sharing · A accessibility strategy
**severity / importance** (pain points): 1 cosmetic · 2 minor · 3 major (workaround needed) · 4 blocker (couldn't complete the decision)

Rules:
- One idea per row. If a note contains "and", split it.
- Quotes must be verbatim from the recording or notes. **Never paraphrase inside quotation marks.**
- Keep the participant ID on every row, so a theme can be traced back to the number of distinct participants.

## Step 2: Cluster into themes

Group rows bottom-up. Name each theme as a **statement from the user's point of view**, not a topic ("I can't tell whether this number is final", not "Data freshness").

| Theme | Statement (user voice) | Notes in theme (ids) | # distinct participants | Roles represented | Includes AT users? |
|---|---|---|---|---|---|
| T1 | | | /5 | | |
| T2 | | | /5 | | |

## Step 3: Insights → design implications

| Insight | Evidence (theme ids, # participants) | Confidence (low/med/high) | Design implication | Affects JTBD / persona | Priority (impact × frequency) |
|---|---|---|---|---|---|
| | | | | | |

**Confidence guide:** high = 3 or more participants across 2 or more roles, unprompted · medium = 2 participants, or prompted · low = 1 participant (log it, don't design around it alone).

## Step 4: Decisions log

For every recurring **decision** participants described:

| Decision | Who makes it | Frequency | Data needed | Comparison baseline | Current tool | Pain point(s) | Supported by prototype? |
|---|---|---|---|---|---|---|---|
| | | | | | | | ☐ |
