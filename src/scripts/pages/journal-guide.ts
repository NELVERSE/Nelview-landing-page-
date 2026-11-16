// @ts-nocheck
// Page script for journal-guide.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var qs = [].slice.call(document.querySelectorAll("#jgList .jg-q")),
    N = document.getElementById("jgN"),
    V = document.getElementById("jgV"),
    T = document.getElementById("jgT"),
    Ms = [].slice.call(document.querySelectorAll("#jgM i"));
  var S = {
    en: [
      [
        "No flags yet",
        "Tick anything that applies. Then run the five-minute check below to confirm.",
      ],
      [
        "Low risk",
        "One flag on its own can be innocent. Still run the five-minute check before submitting.",
      ],
      [
        "Caution",
        "Two or more flags. Verify the journal in DOAJ and the ISSN Portal before you send anything.",
      ],
      [
        "High risk",
        "This looks like a predatory journal. Don't submit or pay. Look for a legitimate alternative.",
      ],
    ],
    fr: [
      [
        "Aucun signal",
        "Cochez ce qui s'applique, puis faites la vérification en cinq minutes ci-dessous.",
      ],
      [
        "Risque faible",
        "Un seul signal peut être anodin. Faites tout de même la vérification en cinq minutes.",
      ],
      [
        "Prudence",
        "Deux signaux ou plus. Vérifiez la revue dans DOAJ et le portail ISSN avant tout envoi.",
      ],
      [
        "Risque élevé",
        "Cette revue semble prédatrice. Ne soumettez rien et ne payez rien. Cherchez une alternative légitime.",
      ],
    ],
  };
  function upd() {
    var n = qs.filter(function (q) {
        return q.getAttribute("aria-pressed") === "true";
      }).length,
      l = document.documentElement.lang === "fr" ? "fr" : "en",
      lv = n === 0 ? 0 : n === 1 ? 1 : n < 4 ? 2 : 3,
      col = ["", "#F2A516", "#F2A516", "#E0484F"][lv];
    N.textContent = n;
    Ms.forEach(function (m, i) {
      m.style.background = i < n ? col : "";
    });
    V.textContent = S[l][lv][0];
    T.textContent = S[l][lv][1];
    V.style.color = lv === 3 ? "#FF9A9E" : lv ? "#F5C25A" : "";
  }
  qs.forEach(function (q) {
    q.addEventListener("click", function () {
      q.setAttribute(
        "aria-pressed",
        q.getAttribute("aria-pressed") === "true" ? "false" : "true",
      );
      upd();
    });
  });
  document.getElementById("jgR").addEventListener("click", function () {
    qs.forEach(function (q) {
      q.setAttribute("aria-pressed", "false");
    });
    upd();
  });
  new MutationObserver(upd).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
})();
