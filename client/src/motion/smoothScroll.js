import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Lenis drives the scroll position; GSAP's ticker drives Lenis, and every Lenis
 * scroll updates ScrollTrigger, so scrubbed timelines and the 3D camera stay in
 * lock-step with the smoothed position. Returns a cleanup function.
 */
export function startSmoothScroll() {
  if (prefersReducedMotion()) return () => {};

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    if (window.__lenis === lenis) delete window.__lenis;
  };
}

export function scrollToTarget(target, offset = -24) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
}

export { gsap, ScrollTrigger };
