import Lenis from 'lenis';

/**
 * Globalny stan scrolla — mutowalny obiekt czytany co klatkę przez scenę 3D
 * (bez re-renderów Reacta).
 */
export const scrollState = {
  /** 0..1 — postęp całej strony */
  progress: 0,
  /** px/klatkę — do efektów „rozmycia ruchu” tuszu */
  velocity: 0,
};

let lenisSingleton: Lenis | null = null;

export function initSmoothScroll(): Lenis {
  if (lenisSingleton) return lenisSingleton;
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });

  lenis.on('scroll', ({ progress, velocity }: { progress: number; velocity: number }) => {
    scrollState.progress = progress;
    scrollState.velocity = velocity;
  });

  function raf(time: number) {
    lenis.raf(time);
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
