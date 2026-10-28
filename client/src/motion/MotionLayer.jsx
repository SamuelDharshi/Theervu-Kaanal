import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/*
 * App-wide motion that needs no per-page code:
 *  - every route change scrolls to the top and replays the page entrance (.tk-page);
 *  - any element marked [data-reveal] rises in once as it enters the viewport;
 *  - on app screens (dashboards, forms) the cards, table rows and form groups that
 *    already exist get a short staggered entrance, so existing screens move too.
 * Content is never hidden without script: [data-reveal] is only styled hidden once
 * this layer has attached (html.tk-motion).
 */

const AUTO_TARGETS = [
  '.tk-page .container > .row > [class*="col"]',
  '.tk-page .container-fluid > .row > [class*="col"]',
  '.tk-page .card',
  '.tk-page .grievance-card',
  '.tk-page .stat-item',
  '.tk-page table tbody tr',
].join(',');

export default function MotionLayer() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('tk-motion');
  }, []);

  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const scan = () => {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (reduced) el.classList.add('is-in');
        else io.observe(el);
      });

      if (reduced) return;
      let i = 0;
      document.querySelectorAll(AUTO_TARGETS).forEach((el) => {
        if (seen.has(el) || el.closest('[data-reveal]') || el.closest('.modal')) return;
        seen.add(el);
        el.animate(
          [
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 650, delay: Math.min(i, 12) * 55, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' },
        );
        i += 1;
      });
    };

    scan();
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
