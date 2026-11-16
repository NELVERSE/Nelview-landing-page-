// motion.ts: restrained scroll reveals. Loaded last on every page.
//
// Elements fade up once as they scroll into view; bars fill and figures count
// up. Nothing is ever left hidden: pending reveals are flushed after a
// timeout, before printing, and when the tab goes to the background. Visitors
// who ask for reduced motion get none of this.
import { animate, stagger } from "motion";

(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const EASE = [0.22, 1, 0.36, 1] as const;
  // 2D on purpose: a 3D transform gives every waiting element its own graphics
  // layer, which is enough to exhaust memory on a phone.
  const RISE = "translateY(18px)";
  const REST = "translateY(0px)";

  /** Reveals waiting for their trigger element to scroll into view. */
  const pending = new Map<Element, () => void>();
  /** Elements that already belong to a reveal, so nothing animates twice. */
  const claimed = new WeakSet<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) play(entry.target);
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  function play(trigger: Element) {
    const start = pending.get(trigger);
    if (!start) return;
    pending.delete(trigger);
    observer.unobserve(trigger);
    start();
  }

  function flush() {
    for (const trigger of [...pending.keys()]) play(trigger);
  }

  function inView(el: Element) {
    const box = el.getBoundingClientRect();
    return box.top < innerHeight * 0.95 && box.bottom > 0;
  }

  function fadeUp(els: HTMLElement[], gap: number, delay = 0) {
    animate(
      els,
      { opacity: [0, 1], transform: [RISE, REST] },
      { duration: 0.55, delay: stagger(gap, { startDelay: delay }), ease: EASE },
    ).then(() => {
      for (const el of els) {
        el.style.opacity = "";
        el.style.transform = "";
      }
    });
  }

  /** Hides `els` now and fades them up, staggered, when `trigger` is reached. */
  function reveal(trigger: Element, els: HTMLElement[], gap = 0.07) {
    const fresh = els.filter((el) => !claimed.has(el));
    if (!fresh.length) return;
    for (const el of fresh) {
      claimed.add(el);
      el.style.opacity = "0";
      el.style.transform = RISE;
    }
    pending.set(trigger, () => fadeUp(fresh, gap));
    observer.observe(trigger);
  }

  const all = <T extends HTMLElement = HTMLElement>(selector: string) =>
    [...document.querySelectorAll<T>(selector)];

  // Hero: already on screen, so it plays straight away.
  const hero = document.querySelector<HTMLElement>(
    ".hero2 .wrap, .st-hero .wrap, .ab-hero .wrap, .pr-hero .wrap, .phd .wrap, .page-hero .wrap, .pl-hero .wrap, .wl",
  );
  if (hero) {
    const parts = [
      ...hero.querySelectorAll<HTMLElement>(":scope > *, :scope > div > *"),
    ]
      .filter((el) => el.offsetParent !== null && !el.querySelector(":scope > *.h2"))
      .slice(0, 8);
    for (const el of parts) claimed.add(el);
    if (parts.length) {
      for (const el of parts) {
        el.style.opacity = "0";
        el.style.transform = RISE;
      }
      fadeUp(parts, 0.07, 0.05);
    }
  }
  const outsideHero = (el: Element) => !hero || !hero.contains(el);

  // Groups: the children arrive one after another.
  const GROUPS =
    ".bento, .grid2, .grid3, .grid4, .feats, .steps, .flow, .nums, .stats, .board, .st-team, .st-chap, .vs, .vs-rows, .ex-tiers, .pp, .p4, .fund, .funds2, .cta2, .pgrid, .ttl, .vrows, .wall, .xrows, .integ-g, .roles, .perks, .hs-track, .bc, .recs";
  for (const group of all(GROUPS)) {
    if (!outsideHero(group) || inView(group)) continue;
    if (group.parentElement?.closest(GROUPS)) continue;
    const children = [...group.children] as HTMLElement[];
    reveal(group, children, group.matches(".integ-g") ? 0.03 : 0.07);
  }

  // Single blocks: headings, intro copy, photos, panels.
  for (const el of all(
    "main .h2, main .statement, main .lead, main .photo, main .faq details, main .tabs, main .vs-ex, main .ex-card, main .demo-vid, main .integ, main .cta",
  )) {
    if (!outsideHero(el) || inView(el) || el.closest(".tour")) continue;
    reveal(el, [el]);
  }

  // Score bars fill to their value.
  for (const bar of all("main .bar > span")) {
    const width = bar.style.width;
    if (!width || inView(bar) || bar.closest(".tour")) continue;
    bar.style.width = "0%";
    pending.set(bar, () => {
      animate(bar, { width: ["0%", width] }, { duration: 0.8, ease: EASE });
    });
    observer.observe(bar);
  }

  // Figures count up to their value.
  for (const figure of all(".stats b, .st-stat b")) {
    if (figure.children.length || inView(figure)) continue;
    const text = figure.textContent || "";
    const match = text.match(/^([^0-9]*)([\d,]+)(.*)$/);
    if (!match) continue;
    const end = Number(match[2].replace(/,/g, ""));
    if (!end || end > 100000) continue;
    pending.set(figure, () => {
      animate(0, end, {
        duration: 0.9,
        ease: EASE,
        onUpdate: (value) => {
          figure.textContent = match[1] + Math.round(value).toLocaleString() + match[3];
        },
      }).then(() => {
        figure.textContent = text;
      });
    });
    observer.observe(figure);
  }

  // The product preview straightens as it rises into view.
  setTimeout(flush, 12000);
  addEventListener("beforeprint", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
  });
  window.nvRevealAll = flush;
})();
