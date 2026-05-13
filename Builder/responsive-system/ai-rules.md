# AI Prompt Rules — paste at the top of any "build me a website" prompt

When generating any HTML, JSX, or CSS for a website or component, you MUST follow these rules. Violating them produces amateur output.

## Hard rules (no exceptions)

1. **Use design tokens, not raw values.** Never write a literal pixel value for font-size, padding, margin, or gap more than once in the same project. If `foundation.css` is available, use its CSS variables (`var(--space-4)`, `var(--fs-base)`, etc.). If not, define a `:root { --space-*: ...; --fs-*: ... }` block at the top of the stylesheet and use only those.

2. **All font sizes use `rem` or `clamp()`. Never `px`.** Body is `1rem`. Headings use fluid `clamp(MIN, fluid, MAX)` so they shrink on mobile without media queries.

3. **All horizontal padding on full-width sections uses a fluid gutter.** Example: `padding-inline: clamp(1rem, 0.5rem + 2vw, 2rem)`. Never `padding: 0 20px`.

4. **All vertical section padding is fluid.** Example: `padding-block: clamp(2.5rem, 1.5rem + 4vw, 5rem)`. Never `padding: 80px 0`.

5. **Borders, hairlines, and outline thickness stay in `px`.** A 1px border is 1px.

6. **Media query breakpoints use `em`, not `px`.** Example: `@media (min-width: 48em)`. This honors browser zoom.

7. **Prefer container queries over media queries for components.** A card should respond to its container, not the viewport. Use media queries only for *page-level* rearrangement (nav, sidebar collapse).

8. **Layout uses the 5 primitives, not bespoke flex/grid for every section:**
   - Vertical rhythm → `.stack` (flex column with gap)
   - Horizontal wrapping group → `.cluster`
   - Cards/feature grid → `.auto-grid` (`grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`)
   - Content + sidebar that collapses → `.sidebar`
   - Row-or-column flip → `.switcher`

9. **Text columns max-width is 60–75ch.** Set `max-inline-size: 65ch` on `<p>` and prose blocks. Long lines look amateur.

10. **`h1`/`h2`/`h3` use `text-wrap: balance`. Body `<p>` uses `text-wrap: pretty`.**

11. **Touch targets are at least 44×44px.** Buttons use `min-block-size: 2.75rem`. Padding scales with the button's own font-size: `padding: 0.6em 1.25em`.

12. **No `vh`. Use `dvh` for full-screen heights** (`min-block-size: 100dvh`). `vh` is broken on mobile because of address bars.

13. **One accent color, one or two font weights.** Neutrals do the work. Resist the urge to add more.

14. **Line-height: body 1.5–1.6, headings 1.1–1.25.** Never inherit defaults blindly.

15. **Test at 320px, 768px, 1280px, 1920px, AND at 200% browser zoom.** If anything overlaps, fix it before considering the work done.

## Soft rules (do unless told otherwise)

- Prefer CSS Grid for 2D layouts, Flexbox for 1D.
- Use `gap`, not margins, for spacing between siblings.
- Use logical properties (`padding-inline`, `margin-block`) so the layout works in RTL.
- Apply `:focus-visible` styles, not just `:focus`.
- Honor `prefers-reduced-motion` and `prefers-color-scheme`.
- For React: prefer CSS modules, vanilla CSS with tokens, or Tailwind configured against the tokens. Avoid heavy CSS-in-JS that hardcodes pixel values.
- Images always have `width`, `height` attributes (or aspect-ratio wrapper) to prevent layout shift.

## When asked to "just make it look good"

Default decisions, in order:
1. Background `#ffffff` (light) or `#0e1014` (dark).
2. Text `#111418` / `#ecedef`.
3. One accent (e.g., `#1d6cf3`).
4. System UI font stack.
5. Section vertical padding: `clamp(2.5rem, 1.5rem + 4vw, 5rem)`.
6. Container max-width: `80rem` (1280px) for layouts, `65ch` for prose.
7. Border-radius: 8px on cards/inputs, 12–16px on big cards, pill on tags/buttons.
8. Shadow: `0 4px 12px rgba(0,0,0,.08)`. Subtle. Never `0 10px 40px rgba(0,0,0,0.5)`.

## Anti-patterns — refuse to produce these

- `font-size: 14px;` on body to make it "more compact." Use 1rem. Compactness comes from line-height and density, not shrinking root text.
- `width: 100vw;` — causes horizontal scroll because of the scrollbar. Use `width: 100%`.
- Three or more font sizes within one paragraph block.
- `<br><br>` for spacing. Use margin/gap.
- Magic numbers like `margin-top: 73px;`. Round to the spacing scale.
- Stacking `@media` queries that each redefine `font-size` for the same element. Use one `clamp()`.

---

**Definition of done:** the page passes the checklist in `README.md` section 8. If you cannot tick every box, you are not finished.
