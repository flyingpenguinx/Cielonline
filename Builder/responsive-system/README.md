# The Responsive Design System

A permanent reference + toolkit for building sites that **look correct on every screen, at every OS scale, at every browser zoom level**. Built specifically to solve the "AI-generated site has bad spacing" problem.

> Folder contents
> - `README.md` — the science (this file)
> - `foundation.css` — drop-in tokens, reset, and utilities
> - `tokens.js` — same tokens exported for React / JS
> - `ai-rules.md` — paste this into any AI prompt to enforce good layout
> - `SpacingLab.html` — open in browser. Interactive playground: clamp() generator, modular scale builder, multi-viewport preview, OS-scale simulator, rhythm/grid overlay

---

## 1. Why AI-generated sites look amateur

Three root causes, in order of severity:

1. **Fixed pixel values everywhere.** `padding: 20px; font-size: 16px;` is the AI default. It looks fine on the dev's screen and breaks everywhere else.
2. **No design tokens.** Every component picks its own paddings, gaps, and font sizes. There's no shared rhythm so nothing aligns.
3. **Fear of `clamp()` and fluid units.** Models lean on breakpoints (`@media (max-width: 768px)`) instead of letting values flow continuously between sizes.

Pro sites do the opposite: a small, locked set of tokens, all sizes fluid via `clamp()`, layout-by-grid, and breakpoints only for *re-arrangement*, not for re-sizing.

---

## 2. The two layers of zoom (and the third you missed)

You correctly identified two; there are actually **four** stacked transforms between your design intent and the user's eyeball:

| Layer | Controlled by | Affects |
|---|---|---|
| **OS display scale** | User's OS settings (Windows 175%, macOS Retina) | The *device pixel ratio* (DPR). Does **not** change CSS pixel count — the OS just renders each CSS pixel onto more physical pixels. |
| **Browser zoom** | Ctrl + / − | Multiplies CSS pixel sizes. A 16px font at 150% zoom becomes 24 CSS px. **This changes layout.** |
| **Viewport size** | Window dimensions | The `width` your CSS sees. 175% OS scale on a 3840×2160 monitor reports a viewport of ~2194px wide, not 3840px. |
| **User font-size preference** | Browser settings → "default font size" | Only affects layout if you use `rem` / `em`. Using `px` ignores accessibility settings. |

### The crucial consequence
Because OS scale folds into the reported viewport width *before* CSS runs, **you do not need to detect it**. A 1920×1080 monitor at 100% and a 4K monitor at 200% scale both report ~1920 CSS px. Your media queries see the same thing. The user's text just looks crisper on the 4K display.

What you *do* need to handle:
- Viewports anywhere from **320px → 2560px** wide
- Browser zoom **50% → 200%**
- The user's **`prefers-reduced-motion`**, **`prefers-color-scheme`**, and **default font size**

That's it. If your site handles those four axes, it handles every laptop and every monitor scale automatically.

---

## 3. The unit cheat sheet

Stop using `px` for almost everything. Use this table:

| Property | Use | Why |
|---|---|---|
| Font size | `rem` (or `clamp(... , vw, ...)` for headings) | Respects user's default font size. Scales with browser zoom. |
| Padding / margin between sections | `clamp(min, vw-based, max)` | Big on desktop, tight on mobile, no breakpoint needed. |
| Padding inside small components (buttons, chips) | `em` | Padding scales with the component's own font size. |
| Gaps in grids/flex | `rem` | Locked rhythm. |
| Borders, hairlines | `px` | Should not scale. 1px is 1px. |
| Container max-widths | `ch` for text, `rem` for layout | `65ch` ≈ optimal reading line length. |
| Media query breakpoints | `em` | Honors zoom. `@media (min-width: 48em)` triggers correctly when the user zooms in. |
| Icon sizes inline with text | `em` or `1lh` | Icon matches surrounding text. |
| Full-bleed heights | `svh`/`dvh`/`lvh`, not `vh` | `vh` is broken on mobile because of the URL bar. `dvh` updates dynamically. |

### The single rule that fixes 80% of bad AI sites
> **Never write a raw px number twice in the same file.** If you see `16px` in two places, it should be a token.

---

## 4. The fluid type scale (the heart of the system)

A **modular scale** generates harmonious sizes from one base value and one ratio.

- Base: `1rem` (= 16px by default)
- Ratio: `1.25` (Major Third) — safe, professional. Use `1.333` for more drama, `1.125` for dense UI.

| Step | Multiplier | Token | Default px | Use |
|---|---|---|---|---|
| -2 | ÷1.25² | `--fs-xs` | 10.24 | Microcopy, captions |
| -1 | ÷1.25 | `--fs-sm` | 12.8 | Secondary text |
| 0 | ×1 | `--fs-base` | 16 | Body |
| 1 | ×1.25 | `--fs-md` | 20 | Lead paragraph |
| 2 | ×1.25² | `--fs-lg` | 25 | H4 |
| 3 | ×1.25³ | `--fs-xl` | 31.25 | H3 |
| 4 | ×1.25⁴ | `--fs-2xl` | 39 | H2 |
| 5 | ×1.25⁵ | `--fs-3xl` | 48.8 | H1 |
| 6 | ×1.25⁶ | `--fs-4xl` | 61 | Display |

Then each one is wrapped in `clamp()` so it shrinks ~25% on mobile. See `foundation.css`.

---

## 5. The spacing scale

Same idea, different ratio. Use a **base of 4px** and a quasi-geometric scale:

| Token | px | Use |
|---|---|---|
| `--space-0` | 0 | |
| `--space-1` | 4 | Hairline gaps |
| `--space-2` | 8 | Icon ↔ text |
| `--space-3` | 12 | Small padding |
| `--space-4` | 16 | Default padding |
| `--space-5` | 24 | Card padding |
| `--space-6` | 32 | Section gap |
| `--space-7` | 48 | Large section gap |
| `--space-8` | 64 | Block separation |
| `--space-9` | 96 | Hero padding |
| `--space-10` | 128 | Major section vertical rhythm |

**Section vertical padding** should always be fluid:
```css
padding-block: clamp(2rem, 6vw, 6rem);
```

---

## 6. Container queries > media queries (in 2024+)

Old way: `@media (min-width: 768px)` — based on the **viewport**. Breaks when the same component lives in a sidebar.

New way:
```css
.card-grid { container-type: inline-size; }
.card { padding: 1rem; }
@container (min-width: 30rem) { .card { padding: 2rem; display: grid; grid-template-columns: 1fr 2fr; } }
```

Use media queries only for **page-level** rearrangement (sidebar collapses, nav becomes hamburger). Use container queries for **component** responsiveness.

---

## 7. Layout primitives (you only need 5)

Forget complicated layouts. Every page is some combination of:

1. **Stack** — vertical rhythm. `display: flex; flex-direction: column; gap: var(--space-5);`
2. **Cluster** — horizontal grouping that wraps. `display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;`
3. **Sidebar** — content + sidebar that collapses. `display: flex; flex-wrap: wrap;` with `flex-basis` tricks.
4. **Switcher** — flips between row and column at a container threshold. Pure flexbox with `flex-basis: calc((30rem - 100%) * 999)`.
5. **Auto-grid** — responsive cards without media queries. `grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));`

These are all in `foundation.css` as utility classes. Use them.

---

## 8. The "looks professional" checklist

Before shipping any page, verify:

- [ ] **Body line-height ≥ 1.5**, headings 1.1–1.25.
- [ ] **Paragraphs max-width 60–75ch.** Long lines feel amateur.
- [ ] **Vertical rhythm**: every section's top/bottom padding comes from the same `clamp()` token.
- [ ] **Touch targets ≥ 44×44px** (Apple HIG) / 48×48px (Material).
- [ ] **No horizontal scroll at 320px.** Test it.
- [ ] **No layout shift between 1280px and 1281px.** If there is, your breakpoint is doing the work `clamp()` should do.
- [ ] **Zoom to 200%** in browser. Nothing should overlap.
- [ ] **Browser DevTools → Rendering → Emulate vision deficiency → contrast.** Text passes WCAG AA.
- [ ] **One font family, max two weights** (e.g., 400 + 700). Three is the limit. Don't be a hero.
- [ ] **One accent color.** Neutrals do 90% of the work.

---

## 9. How to use this folder

### In any new HTML project
```html
<link rel="stylesheet" href="responsive-system/foundation.css">
```

### In a React/Vite project (like Cielonline)
1. Copy `foundation.css` into `src/styles/`.
2. Import it in `main.jsx`: `import './styles/foundation.css';`
3. Import tokens where needed: `import { space, fs } from './styles/tokens';`

### When prompting AI to build a page
Paste the contents of `ai-rules.md` at the top of your prompt. It instructs the model to use tokens, `clamp()`, container queries, and the 5 layout primitives. This alone fixes most of the issues you're describing.

### When debugging spacing
Open `SpacingLab.html`. It includes:
- **Multi-viewport preview** — see your URL at 375 / 768 / 1280 / 1920 side by side.
- **Clamp generator** — give it min/max font-size and min/max viewport, get the `clamp()` string.
- **Modular scale builder** — pick a ratio, copy the CSS variables.
- **Rhythm overlay** — projects an 8px baseline grid over any page in an iframe.
- **OS scale simulator** — simulates how browser zoom (which is what OS scale effectively becomes for layout) changes your page.

---

## 10. Further reading (canonical sources)

- Andy Bell & Heydon Pickering — *Every Layout* (the 5 primitives)
- Utopia.fyi — fluid type/space calculator (we replicate the math in SpacingLab)
- MDN — `clamp()`, `container-type`, `dvh`/`svh`/`lvh`
- WCAG 2.2 — touch targets, contrast, zoom
- Refactoring UI by Adam Wathan & Steve Schoger — *the* book on why pro UIs look pro
