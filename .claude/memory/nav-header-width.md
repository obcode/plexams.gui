---
name: nav-header-width
description: "The Nav header row has no spare width at any breakpoint; measured 360-1920px on 2026-09-24. How to check before adding anything to it."
metadata:
  type: project
---

On 2026-09-24 the header overflowed at 375px by 35px (the hamburger -- the only
way into the navigation on a phone -- sat off-screen), and the new todo pill
pushed it over at 640, 1280 and 1536px too. Fixed by:

- theme picker below `sm` moved into the hamburger menu (like the semester switch);
- brand text "Plexams" only at `md`..`xl` and from 1700px (was `sm`, `2xl`);
- user name in the identity chip only from `2xl` (was `lg`);
- no theme name next to the brush; todo pill without text label;
- semester chip `whitespace-nowrap` (it used to wrap to two lines when squeezed).

After that every width from 360 to 1920 fits with ~0-15px to spare. **Anything new
in the header needs a width budget**: measure `document.documentElement.scrollWidth`
at 360, 375, 640, 768, 1280, 1536 with a logged-in `me` (without a backend the
identity chip is missing and the numbers are 60px too optimistic) and a semester
that has todos (otherwise the todo pill is hidden).
