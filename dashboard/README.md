# Ardea Market Board

A fictional, animated market dashboard built from the XRS1 closing table of 30.10.2026 18:00:00
(top 10 symbols by traded value, plus the session totals).

- Open `index.html` in a browser (GSAP 3.12.5 and Flip load from cdnjs).
- Sliding pills (nav, filters, sort) use `slidePill`: the leading edge of a `clip-path: inset()` moves
  first and faster (`power3.out`, 0.36s) and the trailing edge catches up (`power3.inOut`, 0.55s), so the pill
  stretches like a drop.
- Filtering and sorting reflow the cards with GSAP Flip; prices and totals count up; sparklines draw in.
- Sparklines are synthetic intraday paths that start at the open, touch the day's high and low, and end at the close.
