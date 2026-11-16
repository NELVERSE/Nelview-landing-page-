// Page script for index.html. Loaded after site.ts and i18n.ts, before motion.ts.
(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Product tour: tabs that advance on their own while the tour is on screen.
  const tour = document.getElementById("tour");
  if (tour) {
    const ORDER = ["review", "edit", "journal", "cite", "format"];
    const INTERVAL = 7000;
    let current = 0;
    let timer: number | undefined;
    let picked = false;

    const show = (name: string) => {
      current = Math.max(0, ORDER.indexOf(name));
      tour.setAttribute("data-t", name);
      for (const tab of document.querySelectorAll<HTMLElement>("#tourTabs button")) {
        const on = tab.dataset.t === name;
        tab.classList.remove("on");
        if (on) {
          void tab.offsetWidth; // restart the progress bar animation
          tab.classList.add("on");
        }
      }
      for (const item of document.querySelectorAll<HTMLElement>("#tourSide .it[data-t]"))
        item.classList.toggle("on", item.dataset.t === name);
      for (const pane of tour.querySelectorAll<HTMLElement>(".tpane"))
        pane.classList.toggle("on", pane.dataset.t === name);
    };

    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (picked || reducedMotion) return;
      show(ORDER[current]);
      timer = window.setInterval(
        () => show(ORDER[(current + 1) % ORDER.length]),
        INTERVAL,
      );
    };

    for (const control of document.querySelectorAll<HTMLElement>(
      "#tourTabs button, #tourSide .it[data-t]",
    ))
      control.addEventListener("click", () => {
        picked = true;
        stop();
        tour.classList.add("paused");
        show(control.dataset.t || ORDER[0]);
      });

    if (reducedMotion) tour.classList.add("paused");

    // Only tick while visible: no timers or animations for a tour nobody can see.
    new IntersectionObserver(([entry]) => {
      tour.classList.toggle("offscreen", !entry.isIntersecting);
      if (entry.isIntersecting && !document.hidden) start();
      else stop();
    }).observe(tour);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!tour.classList.contains("offscreen")) start();
    });
  }
})();
