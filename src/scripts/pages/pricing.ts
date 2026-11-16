// @ts-nocheck
// Page script for pricing.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var t = document.getElementById("billing");
  if (!t) return;
  t.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      t.querySelectorAll("button").forEach(function (x) {
        x.classList.toggle("on", x === b);
      });
      var i = b.getAttribute("data-b") === "y" ? 0 : 1;
      document.querySelectorAll("[data-price]").forEach(function (p) {
        p.textContent = p.getAttribute("data-price").split("|")[i];
      });
      document.querySelectorAll("[data-bill]").forEach(function (p) {
        p.textContent = p.getAttribute("data-bill").split("|")[i];
      });
    };
  });
})();
