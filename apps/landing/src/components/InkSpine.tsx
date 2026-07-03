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
      // kreska WYRAŹNIE wyprzedza scroll — czubek pędzla leci przed okiem,
      // dzięki czemu aktywny front zawsze zostaje w kadrze
      const drawn = Math.min(1, p * 1.5 + 0.05);
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

  // Trasa zawsze schodzi w dół (bez pętli o stałym Y, które powodowały
  // „zawieszanie" czubka), z miękkim falowaniem lewo-prawo. viewBox 1000×4000.
  const d =
    'M 170 180 ' +
    'C 560 460, 820 700, 720 1040 ' +
    'C 630 1360, 230 1470, 300 1840 ' +
    'C 360 2160, 800 2320, 740 2680 ' +
    'C 690 2990, 320 3120, 400 3480 ' +
    'C 450 3720, 500 3860, 520 3980';

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
        {/* prowadnica — ledwo widoczny pełny ślad, żeby trasa nigdy nie znikała */}
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--vermilion)"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.1}
          vectorEffect="non-scaling-stroke"
        />
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
          strokeWidth={6.5}
          strokeLinecap="round"
          opacity={0.7}
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
