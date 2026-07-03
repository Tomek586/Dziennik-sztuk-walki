import { useId } from 'react';

/**
 * Krótki zamaszysty ślad pędzla pod nagłówkiem sekcji.
 * Rysuje się (stroke-dashoffset → 0), gdy rodzic [data-reveal] dostanie
 * klasę .revealed — patrz style .draw-path w styles.css.
 */
export function BrushUnderline({ delay = 0 }: { delay?: number }) {
  // useId zawiera dwukropki — nielegalne w url(#...); sanityzacja konieczna
  const filterId = 'brush-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg
      className="brush-underline"
      viewBox="0 0 300 26"
      aria-hidden="true"
      style={{ ['--draw-delay' as string]: `${delay}s` }}
    >
      <defs>
        <filter id={filterId} x="-10%" y="-60%" width="120%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.5" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <path
          className="draw-path"
          d="M 8 14 C 70 7, 150 5, 200 10 C 240 14, 272 13, 292 9"
          pathLength={1}
          fill="none"
          stroke="var(--vermilion)"
          strokeWidth={9}
          strokeLinecap="round"
        />
        <path
          className="draw-path echo"
          d="M 14 21 C 80 15, 160 14, 288 17"
          pathLength={1}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.5}
        />
      </g>
    </svg>
  );
}
