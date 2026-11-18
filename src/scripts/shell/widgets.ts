// @ts-nocheck
// Small behaviours shared by pages: inline icons, FAQ toggles, score rings, tabs.
import { ic } from "./icons";

document.querySelectorAll("[data-ic]").forEach(function (e) {
  var s = +e.getAttribute("data-s") || 18;
  e.insertAdjacentHTML("afterbegin", ic(e.getAttribute("data-ic"), s));
});
document.querySelectorAll(".faq summary").forEach(function (s) {
  if (!s.querySelector(".pl"))
    s.insertAdjacentHTML(
      "beforeend",
      "<span class='pl'>" + ic("plus", 15) + "</span>",
    );
});
document.querySelectorAll("[data-ring]").forEach(function (e) {
  var v = +e.getAttribute("data-ring"),
    sz = +e.getAttribute("data-size") || 120,
    sw = sz / 12,
    r = (sz - sw) / 2,
    c = 2 * Math.PI * r,
    col = e.getAttribute("data-color") || "var(--blue)";
  e.style.width = e.style.height = sz + "px";
  e.insertAdjacentHTML(
    "afterbegin",
    "<svg width='" +
      sz +
      "' height='" +
      sz +
      "'><circle cx='" +
      sz / 2 +
      "' cy='" +
      sz / 2 +
      "' r='" +
      r +
      "' fill='none' stroke='var(--bg-3)' stroke-width='" +
      sw +
      "'/><circle cx='" +
      sz / 2 +
      "' cy='" +
      sz / 2 +
      "' r='" +
      r +
      "' fill='none' stroke='" +
      col +
      "' stroke-width='" +
      sw +
      "' stroke-linecap='round' stroke-dasharray='" +
      c +
      "' stroke-dashoffset='" +
      (c - (c * v) / 100) +
      "'/></svg>",
  );
});
document.querySelectorAll("[data-tabs]").forEach(function (t) {
  var g = t.getAttribute("data-tabs");
  t.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      t.querySelectorAll("button").forEach(function (x) {
        x.classList.toggle("on", x === b);
      });
      document
        .querySelectorAll('[data-pane="' + g + '"]')
        .forEach(function (p) {
          p.classList.toggle(
            "on",
            p.getAttribute("data-id") === b.getAttribute("data-id"),
          );
        });
    };
  });
});
