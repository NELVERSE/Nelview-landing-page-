// @ts-nocheck
// Page script for experts.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var rv = document.getElementById("rv"),
    rt = document.getElementById("rt");
  function f(n) {
    return "$" + n.toLocaleString("en-US");
  }
  function up() {
    var n = +rv.value,
      r = +rt.value;
    document.getElementById("rvV").textContent = n;
    document.getElementById("rtV").textContent = f(r);
    document.getElementById("mo").textContent = f(n * r);
    document.getElementById("yr").textContent = f(n * r * 12);
    document.getElementById("hr").textContent = n * 6;
    [rv, rt].forEach(function (i) {
      i.style.setProperty(
        "--p",
        ((i.value - i.min) / (i.max - i.min)) * 100 + "%",
      );
    });
  }
  rv.oninput = rt.oninput = up;
  up();
})();
