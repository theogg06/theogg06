# Project Village: morning routine

Village page: https://claude.ai/artifact/XCFLKwtfsbMCR9nZiNYri9
Data lives in the page's database (ArtifactData tool):
- `projects/<id>`: name, short, district, status (needs-you | in-progress | review | done | paused),
  summary, needsYou (string or null), nextStep, sessions (session ids), updated (ISO time)
- `meta/village`: assistantSession, updatedAt, districts[{id,name,color r1..r7}],
  digest{date, headline, items[]}, suggestions[{project,title,why}] (3 to 4 items)

The database is the source of truth; no project data is kept in git.

## Every morning
1. `list_sessions` (mine, limit 100). Keep sessions whose `updated_at` falls on yesterday
   (Europe/Bucharest). Skip this assistant session.
2. For each one, read `post_turn_summary`. Only if that isn't enough, read its last few
   assistant/result events with `list_events`.
3. Read all `projects`. Match each session to a house through its `sessions` list. If a
   session belongs to no house, add it to the right house or create a new one. A new
   district goes into `meta.districts`, up to 7 in total.
4. Update the houses that changed (status, summary, needsYou, nextStep, updated). Pin every
   write with `if_version`. Use a single batch. Never clear a needsYou that the user hasn't
   resolved.
5. Write `meta/village`:
   - `digest` for yesterday: a one-line headline and up to 6 items.
   - 3 to 4 `suggestions`: the cheapest unblockers first, then momentum on active work.
     Each suggestion has a one-sentence why.
   - `updatedAt`
6. Reply in chat with a short morning note:
   - what was done yesterday
   - what needs you
   - the top suggestions
   - the village link

## When the user says "Open house X" (or a "[From Project Village]" message arrives)
1. Read `projects/X`.
2. Summarize where the house stands and what's next.
3. Offer to continue the work. If the work lives on the user's PC (bridge sessions), say so
   and give them the session link: https://claude.ai/code/<session id>.
