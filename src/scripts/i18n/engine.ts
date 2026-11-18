// @ts-nocheck
// engine.ts: the EN/FR switch. Dictionaries live in fr.ts and fr-html.ts.
// Shared globals are declared in src/types/globals.d.ts. Remove @ts-nocheck and tighten types incrementally.
/* Nelview EN/FR — auto-detects from saved choice, browser language, then timezone (francophone regions) */
import { FR } from "./fr";
import { FRH } from "./fr-html";
  var FR_TZ =
    /^(Africa\/(Dakar|Abidjan|Douala|Kinshasa|Lubumbashi|Brazzaville|Libreville|Bamako|Ouagadougou|Niamey|Lome|Porto-Novo|Conakry|Ndjamena|Bangui|Malabo|Algiers|Tunis|Casablanca|Nouakchott|Djibouti|Bujumbura|Kigali)|Indian\/(Antananarivo|Comoro|Reunion|Mayotte)|Europe\/(Paris|Brussels|Monaco|Luxembourg)|America\/(Montreal|Toronto_fr|Guadeloupe|Martinique|Cayenne|Port-au-Prince)|Pacific\/(Noumea|Tahiti))$/;
  function detect() {
    try {
      var s = localStorage.getItem("nv_lang");
      if (s === "fr" || s === "en") return s;
    } catch (e) {}
    var ls =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || "en"];
    if (
      String(ls[0] || "")
        .toLowerCase()
        .indexOf("fr") === 0
    )
      return "fr";
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (FR_TZ.test(tz)) return "fr";
    } catch (e) {}
    return "en";
  }
  var orig = new WeakMap(),
    attrO = new WeakMap(),
    LANG = "en",
    titleEn = document.title;
  function norm(s) {
    return s.replace(/\s+/g, " ").trim();
  }
  function doText(n) {
    if (!orig.has(n)) orig.set(n, n.nodeValue);
    var o = orig.get(n),
      k = norm(o);
    if (!k) return;
    if (LANG === "fr" && FR[k]) {
      var lead = o.match(/^\s*/)[0],
        trail = o.match(/\s*$/)[0];
      n.nodeValue = lead + FR[k] + trail;
    } else if (n.nodeValue !== o) n.nodeValue = o;
  }
  function doAttr(el) {
    ["placeholder", "aria-label", "title"].forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var m = attrO.get(el) || {};
      if (!(a in m)) {
        m[a] = el.getAttribute(a);
        attrO.set(el, m);
      }
      var k = norm(m[a]);
      el.setAttribute(a, LANG === "fr" && FR[k] ? FR[k] : m[a]);
    });
  }
  var busy = false;
  function run(root) {
    busy = true;
    (root.querySelectorAll
      ? [].slice.call(root.querySelectorAll("[data-i18n]"))
      : []
    ).forEach(function (el) {
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      var k = el.getAttribute("data-i18n");
      var translated =
        LANG === "fr" && FRH[k] ? FRH[k] : el.getAttribute("data-en");
      if (el.innerHTML !== translated) el.innerHTML = translated;
    });
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        return p &&
          (/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/.test(p.nodeName) ||
            p.closest("[data-i18n]"))
          ? 2
          : 1;
      },
    });
    var n;
    while ((n = w.nextNode())) doText(n);
    if (root.querySelectorAll)
      root
        .querySelectorAll("[placeholder],[aria-label],[title]")
        .forEach(doAttr);
    busy = false;
  }
  var observer = new MutationObserver(function (ms) {
    if (busy || LANG !== "fr") return;
    ms.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType === 3) doText(n);
        else if (n.nodeType === 1) run(n);
      });
    });
  });
  function set(l, save) {
    var changed = l !== LANG;
    LANG = l;
    document.documentElement.lang = l;
    if (save) {
      try {
        localStorage.setItem("nv_lang", l);
      } catch (e) {}
    }
    if (changed) run(document.body);
    // Pictures of the product carry their own text, so each has a French version.
    document.querySelectorAll("img[data-src-fr], img[data-alt-fr]").forEach(function (img) {
      var fr = l === "fr";
      if (!img.hasAttribute("data-alt-en"))
        img.setAttribute("data-alt-en", img.getAttribute("alt") || "");
      img.setAttribute(
        "alt",
        img.getAttribute(fr ? "data-alt-fr" : "data-alt-en") || "",
      );
      if (img.hasAttribute("data-src-fr")) {
        if (!img.hasAttribute("data-src-en"))
          img.setAttribute("data-src-en", img.getAttribute("src"));
        img.setAttribute(
          "src",
          img.getAttribute(fr ? "data-src-fr" : "data-src-en"),
        );
      }
    });
    observer.disconnect();
    if (l === "fr")
      observer.observe(document.body, { childList: true, subtree: true });
    var tk = norm(titleEn.split("·")[0]);
    document.title =
      l === "fr" && FR[tk] ? titleEn.replace(tk, FR[tk]) : titleEn;
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === l);
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l);
    });
  }
  function sw() {
    return "<div class='lsw' role='group' aria-label='Language'><button type='button' data-lang='en'>EN</button><button type='button' data-lang='fr'>FR</button></div>";
  }
  var hr = document.querySelector(".wl-hdr .wrap");
  if (hr && !hr.querySelector(".lsw")) {
    var t = document.createElement("div");
    t.innerHTML = sw();
    var el = t.firstChild;
    var bk = hr.querySelector(".back");
    var g = document.createElement("div");
    g.style.cssText = "display:flex;gap:16px;align-items:center";
    hr.insertBefore(g, bk);
    g.appendChild(el);
    g.appendChild(bk);
  }
  var fl = document.querySelector(".ftr .lang");
  if (fl)
    fl.outerHTML =
      "<span class='lang lang-f'><button type='button' data-lang='en'>English</button><button type='button' data-lang='fr'>Français</button></span>";
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (b) set(b.getAttribute("data-lang"), true);
  });
  window.nvLang = set;
  set(detect(), false);
