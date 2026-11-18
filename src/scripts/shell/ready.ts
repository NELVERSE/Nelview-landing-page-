// @ts-nocheck
// Marks the page ready (ends the loading skeleton) and shimmers images that are still loading.
/* skeleton + image shimmer */
(function () {
  var done = false;
  function ready() {
    if (done) return;
    done = true;
    document.documentElement.classList.add("nv-ready");
  }
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      setTimeout(ready, 50);
    });
  setTimeout(ready, 400);
  window.addEventListener("load", ready);
  document
    .querySelectorAll(".photo img,.ph img,.av img,.av-x img,.cover img")
    .forEach(function (im) {
      if (im.complete && im.naturalWidth) return;
      var p = im.parentNode;
      p.classList.add("nv-ld");
      var off = function () {
        p.classList.remove("nv-ld");
      };
      im.addEventListener("load", off);
      im.addEventListener("error", off);
    });
})();
