import { useState, useCallback } from "react";

export default function CloudLogo() {
  const [animating, setAnimating] = useState(true);

  const replay = useCallback(() => setAnimating(false), []);
  const start = useCallback(() => {
    // Force re-mount by toggling key
    setAnimating(false);
    requestAnimationFrame(() => setAnimating(true));
  }, []);

  return (
    <svg
      className={`cloud-logo ${animating ? "animate" : ""}`}
      viewBox="0 -8 260 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CielOnline"
      onMouseEnter={start}
      onAnimationEnd={replay}
    >
      {/* Cloud outline: C shape → bumps left-to-right → right curve top-to-down */}
      <path
        className="cloud-path"
        d="M 38,64
           C 14,64 2,52 2,38
           C 2,22 14,10 32,12
           C 36,-2 50,-6 64,0
           C 76,-8 92,-2 100,8
           C 110,-4 126,4 130,14
           C 142,8 150,22 148,36
           C 146,50 136,62 122,62"
        pathLength="1"
      />
      {/* "iel" text */}
      <text className="cloud-text cloud-text-iel" x="44" y="56" fontSize="43" letterSpacing="-1.5">
        iel
      </text>
      {/* "Online" text */}
      <text className="cloud-text cloud-text-online" x="128" y="56" fontSize="43" letterSpacing="-1.5">
        Online
      </text>
    </svg>
  );
}
