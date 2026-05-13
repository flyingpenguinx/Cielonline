/**
 * tokens.js
 * Mirrors foundation.css for use in React / JS-in-JS contexts.
 * Import where you need the raw values (e.g. for styled-components,
 * Framer Motion, or computed inline styles).
 *
 * Prefer the CSS variables from foundation.css whenever possible —
 * they automatically respond to dark mode and reduced motion. Only
 * use this file when you truly need the value in JavaScript.
 */

// Fluid clamp() helper — generate a string at runtime.
//   minPx/maxPx: the font/space sizes (in CSS pixels).
//   minVwPx/maxVwPx: the viewport widths the ramp runs between.
// Returns a clamp() string in rem so it respects user font-size.
export function fluid(minPx, maxPx, minVwPx = 320, maxVwPx = 1440) {
  const toRem = (px) => px / 16;
  const slope = (maxPx - minPx) / (maxVwPx - minVwPx);
  const intercept = toRem(minPx - slope * minVwPx);
  const slopeVw = slope * 100;
  return `clamp(${toRem(minPx)}rem, ${intercept.toFixed(4)}rem + ${slopeVw.toFixed(4)}vw, ${toRem(maxPx)}rem)`;
}

// Modular scale generator. step 0 = base. Negative steps shrink.
export function scale(baseRem = 1, ratio = 1.25, step = 0) {
  return baseRem * Math.pow(ratio, step);
}

export const fs = {
  xs:   'var(--fs-xs)',
  sm:   'var(--fs-sm)',
  base: 'var(--fs-base)',
  md:   'var(--fs-md)',
  lg:   'var(--fs-lg)',
  xl:   'var(--fs-xl)',
  '2xl':'var(--fs-2xl)',
  '3xl':'var(--fs-3xl)',
  '4xl':'var(--fs-4xl)',
};

export const space = {
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  7: 'var(--space-7)',
  8: 'var(--space-8)',
  9: 'var(--space-9)',
  10:'var(--space-10)',
};

export const section = {
  ySm: 'var(--section-y-sm)',
  yMd: 'var(--section-y-md)',
  yLg: 'var(--section-y-lg)',
  gutter: 'var(--gutter)',
};

export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
};

export const container = {
  measureNarrow: 'var(--measure-narrow)',
  measure:       'var(--measure)',
  measureWide:   'var(--measure-wide)',
  sm: 'var(--container-sm)',
  md: 'var(--container-md)',
  lg: 'var(--container-lg)',
  xl: 'var(--container-xl)',
  '2xl': 'var(--container-2xl)',
};

// Breakpoints in em (so they honor browser zoom). Use for matchMedia.
export const bp = {
  sm: '36em',  // 576
  md: '48em',  // 768
  lg: '64em',  // 1024
  xl: '80em',  // 1280
  '2xl': '96em', // 1536
};

// Useful React hook for container-aware logic.
// Usage:
//   const ref = useRef(null);
//   const width = useContainerWidth(ref);
//   return <div ref={ref}>{width > 480 ? <Wide/> : <Narrow/>}</div>
//
// Uncomment if you want it ready to paste into a component file.
/*
import { useEffect, useState } from 'react';
export function useContainerWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}
*/
