import Lenis from 'lenis';

/**
 * Globalny stan scrolla — mutowalny obiekt czytany co klatkę przez scenę 3D
 * (bez re-renderów Reacta).
 */
export const scrollState = {
  /** 0..1 — postęp całej strony (surowy, nadąża 1:1 za scrollem) */
  progress: 0,
  /**
   * 0..1 — postęp WYGŁADZONY (tłumienie wykładnicze). Scena 3D czyta ten,
   * żeby przy szybkim scrollu kamera i animacje doganiały płynnie zamiast
   * teleportować się przez kilka sekcji naraz.
   */
  smooth: 0,
  /** px/klatkę — do efektów „rozmycia ruchu” tuszu */
  velocity: 0,
};

/** szybkość doganiania (1/s) — mniejsza = spokojniejsza scena */
const SMOOTH_RATE = 3.2;

// podgląd w konsoli tylko w dev (weryfikacja wygładzania)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__scrollState = scrollState;
}

let lenisSingleton: Lenis | null = null;

export function initSmoothScroll(): Lenis {
  if (lenisSingleton) return lenisSingleton;
  const lenis = new Lenis({
    duration: 1.35,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });

  lenis.on('scroll', ({ progress, velocity }: { progress: number; velocity: number }) => {
    scrollState.progress = progress;
    scrollState.velocity = velocity;
  });

  let lastTime = 0;
  function raf(time: number) {
    lenis.raf(time);
    // wygładzanie niezależne od FPS: smooth dogania progress w ~0.3-1s
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0.016;
    lastTime = time;
    const k = 1 - Math.exp(-SMOOTH_RATE * dt);
    scrollState.smooth += (scrollState.progress - scrollState.smooth) * k;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  lenisSingleton = lenis;
  return lenis;
}

/** Odsłanianie elementów DOM przy wejściu w viewport. */
export function initReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18 },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}
