// Page script for index.html. Loaded after site.ts and i18n.ts, before motion.ts.
(() => {
  // The product video shows its poster and a play button until it is started;
  // nothing downloads before that. Once playing it has the browser's controls.
  const media = document.querySelector<HTMLElement>(".hero-media");
  const video = media?.querySelector("video");
  const play = media?.querySelector<HTMLButtonElement>(".hero-play");
  if (!media || !video || !play) return;

  play.addEventListener("click", () => {
    media.classList.add("playing");
    video.controls = true;
    video.play().catch(() => {
      // Playback was refused: the visible controls let the visitor start it.
    });
  });
})();
