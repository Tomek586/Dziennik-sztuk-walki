import { useEffect, useRef } from 'react';
import { scrollState } from '@/scroll';

/**
 * „Kręgosłup tuszu" — jedna długa kreska pędzla płynąca przez całą stronę,
 * rysująca się w rytm scrolla (stroke-dashoffset na znormalizowanym pathLength).
 * Krawędzie faluje feTurbulence — ślad wygląda jak prowadzony ręką.
 * Nić przechodzi POD kartami washi (sekcje są pozycjonowane i malują się wyżej).
 */
export function InkSpine() {
  const mainRef = useRef<SVGPathElement>(null);
  const echoRef = useRef<SVGPathElement>(null);
  const dropRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollState.progress;
      // kreska lekko wyprzedza scroll — czubek pędzla prowadzi oko
      const drawn = Math.min(1, p * 1.06 + 0.02);
      const main = mainRef.current;
      const echo = echoRef.current;
      if (main) main.style.strokeDashoffset = String(1 - drawn);
      // „suchy pędzel": echo goni główną kreskę
      if (echo) echo.style.strokeDashoffset = String(1 - Math.max(0, drawn - 0.015));
      // złota kropla na czubku kreski
      const drop = dropRef.current;
      const path = mainRef.current;
      if (drop && path) {
        const len = path.getTotalLength();
        const pt = path.getPointAtLength(len * drawn);
        drop.setAttribute('cx', String(pt.x));
        drop.setAttribute('cy', String(pt.y));
        drop.style.opacity = drawn > 0.03 && drawn < 0.99 ? '1' : '0';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wijąca się trasa: hero → prawo (głos) → lewo (technika) → prawo (droga)
  // → środek (rytuał) → finał. Współrzędne w viewBox 0..1000 × 0..4000.
  const d =
    'M 150 330 ' +
    'C 420 520, 820 620, 800 950 ' +
    'C 785 1210, 420 1300, 260 1560 ' +
    'C 120 1790, 300 2080, 640 2260 ' +
    'C 880 2390, 860 2680, 700 2900 ' +
    'C 560 3090, 420 3220, 480 3450 ' +
    'C 520 3610, 510 3760, 500 3900';

  return (
    <svg
      className="ink-spine"
      viewBox="0 0 1000 4000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="ink-rough" x="-5%" y="-2%" width="110%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter="url(#ink-rough)">
        {/* echo — cieńszy, złoty ślad suchego pędzla */}
        <path
          ref={echoRef}
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={2.4}
          strokeLinecap="round"
          opacity={0.28}
          strokeDasharray={1}
          strokeDashoffset={1}
          vectorEffect="non-scaling-stroke"
        />
        {/* główna nić cynobru */}
        <path
          ref={mainRef}
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--vermilion)"
          strokeWidth={5.5}
          strokeLinecap="round"
          opacity={0.5}
          strokeDasharray={1}
          strokeDashoffset={1}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* kropla na czubku pędzla (poza filtrem — ostra) */}
      <circle ref={dropRef} r={5} fill="var(--gold)" opacity={0} />
    </svg>
  );
}
