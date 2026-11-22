# Gabby's Dollhouse — Homepage prototype

A responsive HTML/CSS build of the Gabby's Dollhouse homepage design (Figma: `Gabbys_Int_Design` → **Homepage**, node `11:18080`). It's a portfolio project, deployed with GitHub Pages.

No build step and no dependencies. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Structure

```
index.html          one page, 9 sections in Figma order
css/tokens.css      design tokens: primitives → semantic → typography/radius (+ mobile mode)
css/base.css        reset, typography role classes (.t-h1 … .t-overline), colour roles, .container, .btn
css/sections.css    section backgrounds, art slots, components and each section's layout
js/main.js          nav dropdowns, mobile menu, character carousel
assets/img/         content imagery (hero art, episode/activity thumbnails, characters)
assets/art/         decorative artwork (clouds, stars, bubbles, kitties)
assets/icons/       logo, nav icons, social icons, UI glyphs
```

## How it maps to the design system

- **Tokens** follow the Figma chain. Raw values live in `--px-*` and `--color-*`. Semantic tokens (`--text-primary`, `--surface-profile`, `--radius-5xl`, …) reference those raw values.
- **Typography** uses one class per Figma text style (`.t-h3`, `.t-label-uppercase`, …). Desktop and Mobile modes are a single media query in `tokens.css` that swaps the variable values. Visual role and HTML heading level are kept separate.
- **Container sizes are max widths.** Diptych panels are 1224px, 3-column panels 1420px, the menu bar 1181px, the profile panel 986px and the video frame 700px. Below those widths they shrink with a 24px gutter (16px on mobile).
- **`Color/surface/container`** keeps its exact stops (1.253% → 99.542%). The angle comes from each Figma layer (65.6° diptych, 71.1° episodes, 72.3° activities) and is passed in with `--container-angle`.

## Section backgrounds

Each section paints its own gradient (`--bkg-hero`, `--bkg-events`, …). When content reflows on mobile and a section gets taller, its colour band stretches with it. Each section's last stop is the next section's first stop, so the page still reads as one continuous rainbow.

> These stops were **sampled from the Figma page-background artwork**. They are not design-system tokens. Replace them with the exact values if the background gets defined in Figma.

## Decorative art slots

Every section has an `.art` layer (`aria-hidden`, doesn't block clicks). Items are positioned with values taken straight from the 1680px Figma frame:

```html
<img class="art__item" src="assets/art/star-gold.png" alt=""
     style="--l:92px; --t:389px; --w:52px; --rot:-18deg" data-hide="mobile">
```

- `--l` / `--r` is the offset from the section's left or right edge. `--c` is the offset from the section's centre. `--t` is the offset from the section's top.
- `--rot` and `--sy` handle rotation and flips.
- `.art--front` puts items above the panels. A `.panel-wrap > .art` anchors items to a panel instead of the viewport edges.
- `data-hide` sets the width at which an item is dropped: `laptop` ≤1439, `stacked` ≤1239, `tablet` ≤1023, `mobile` ≤767. Art also scales down to 70% (tablet) and 50% (mobile).

## Breakpoints (implementation choices, not approved design-system rules)

| Width | What changes |
| --- | --- |
| ≤1239 | Menu bar collapses to a Menu button. Hero stacks (copy above art). |
| ≤1099 | Diptychs stack (image on top). |
| ≤899 | 3-column card grids become one column (max 480px). |
| ≤767 | Mobile Typography + Radius modes. Tighter panel padding. Smaller cast carousel. |

## Open items / flags

- **Contrast:** `cyan-bright` was changed from `#3CC9F0` to `#099BC3`. The play button, cast arrows and the triangle icon were updated to match. White on `#099BC3` is 3.2:1. That passes for large text and UI shapes (3:1) but not for the 16px button labels, which need 4.5:1 for WCAG AA. `#00809F` would give 4.6:1 on white.
- **Nav type size** is 21px/18px in Figma, which is outside the type scale. It's matched exactly here and flagged.
- **Dropdown items** come from the Figma Resources page: Watch = Where to Watch / Videos / Episodes, Fun = 6 items, Grown-Ups = Shop / Partners / Subscribe. On desktop the menus open on hover or click. On smaller screens they open on tap.
- **Bubbles:** a separate bubble animation will be added later, so the bubble artwork from the Figma background isn't included.
- **Character carousel:** placeholder cast for now, to be filled in once the character assets arrive.
- **Image resolution:** assets were exported at 1×. Re-export the content imagery at 2× for retina before final deployment.
