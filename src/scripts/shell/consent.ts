// @ts-nocheck
// The privacy and cookie consent banner.
/* privacy consent */
(function () {
  var K = "nv_consent";
  try {
    if (localStorage.getItem(K)) return;
  } catch (e) {}
  var d = document.createElement("div");
  d.className = "cns";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-live", "polite");
  d.setAttribute("aria-label", "Privacy consent");
  d.innerHTML =
    "<div class='cns-in'><span class='ico'>" +
    ic("shield", 18) +
    "</span><div class='cns-tx'><b>We respect your privacy</b><p>We use essential cookies to run Nelview and, with your consent, analytics to improve it. We never sell your data. Read our <a href='privacy'>Privacy policy</a> and <a href='cookies'>Cookie policy</a>.</p></div><div class='cns-b'><button type='button' class='btn btn-g btn-sm' data-c='essential'>Essential only</button><button type='button' class='btn btn-p btn-sm' data-c='all'>Accept</button></div></div>";
  document.body.appendChild(d);
  requestAnimationFrame(function () {
    setTimeout(function () {
      d.classList.add("show");
    }, 400);
  });
  d.addEventListener("click", function (e) {
    var b = e.target.closest("[data-c]");
    if (!b) return;
    try {
      localStorage.setItem(
        K,
        JSON.stringify({
          choice: b.getAttribute("data-c"),
          at: new Date().toISOString(),
        }),
      );
    } catch (x) {}
    d.classList.remove("show");
    setTimeout(function () {
      d.remove();
    }, 300);
  });
})();
