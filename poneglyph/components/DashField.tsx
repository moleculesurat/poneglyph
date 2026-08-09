"use client";

/* Seeded dash-field — the Poneglyph incised-rule motif, rendered as broken
   dashes. Deterministic (mulberry32) so SSR and client render identically.
   Decoration only. */

function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function DashField({
  rows = 14,
  seed = 7,
  style,
  className,
}: {
  rows?: number;
  seed?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const rand = mulberry32(seed);
  const W = 1200;
  const ROW_H = 14;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = r * ROW_H + 6;
    let x = rand() * 40;
    while (x < W) {
      const len = 6 + rand() * rand() * 90;
      if (rand() > 0.45) {
        rects.push(
          <rect key={`${r}-${x.toFixed(0)}`} x={x.toFixed(1)} y={y} width={len.toFixed(1)} height={4} rx={1} />
        );
      }
      x += len + 8 + rand() * 26;
    }
  }
  return (
    <div
      aria-hidden
      className={className}
      style={{ pointerEvents: "none", color: "var(--orange)", ...style }}
    >
      <svg
        viewBox={`0 0 ${W} ${rows * ROW_H}`}
        preserveAspectRatio="xMidYMid slice"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        {rects}
      </svg>
    </div>
  );
}
