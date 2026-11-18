// @ts-nocheck
// The header: full-width bar, mega-menus, phone menu, colour-hero behaviour.
import { APP } from "./config";
import { ic, mark } from "./icons";
import { MENU, ACT } from "./menu";

/* ---- Header: a full-width bar, mega-menus, and a full-screen menu on phones ---- */
function esc(t) {
  return String(t).replace(/&/g, "&amp;");
}
function chev() {
  return "<svg class='chev' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6 9l6 6 6-6'/></svg>";
}
function shItem(it) {
  return (
    "<a class='sh-item' href='" +
    it[3] +
    "'><span class='sh-ic'>" +
    ic(it[0], 18) +
    "</span><span><b>" +
    esc(it[1]) +
    "</b><small>" +
    it[2] +
    "</small></span></a>"
  );
}
function mi(it) {
  return (
    "<a class='mi' href='" +
    it[3] +
    "'><span class='ico'>" +
    ic(it[0], 17) +
    "</span><span><b>" +
    it[1].replace("&", "&amp;") +
    "</b><small>" +
    it[2] +
    "</small></span></a>"
  );
}
function panel(k) {
  var m = MENU[k];
  var h =
    "<div class='dd-p dd-" +
    k +
    "'><div class='dd-grid' style='grid-template-columns:repeat(" +
    m.cols +
    ",minmax(0,1fr))'>" +
    m.items.map(mi).join("") +
    "</div>";
  if (m.feat)
    h +=
      "<a class='dd-feat' href='" +
      m.feat[3] +
      "'>" +
      (m.feat[4]
        ? "<span class='dd-img'><img src='" +
          m.feat[4] +
          "' alt='' loading='lazy' decoding='async'></span>"
        : "") +
      "<span class='tag b'>" +
      m.feat[0] +
      "</span><b>" +
      m.feat[1] +
      "</b><small>" +
      m.feat[2] +
      "</small><span class='go'>Learn more " +
      ic("arrow", 14) +
      "</span></a>";
  if (m.post)
    h +=
      "<a class='dd-feat dd-post' href='" +
      m.post[2] +
      "'>" +
      (m.post[3]
        ? "<span class='dd-img'><img src='" +
          m.post[3] +
          "' alt='' loading='lazy' decoding='async'></span>"
        : "") +
      "<span class='k'>" +
      m.post[0] +
      "</span><b>" +
      m.post[1] +
      "</b><span class='go'>Read " +
      ic("arrow", 14) +
      "</span></a>";
  if (m.foot)
    h +=
      "<div class='dd-foot'>" +
      (m.foot[3]
        ? "<span class='dd-th'><img src='" +
          m.foot[3] +
          "' alt='' loading='lazy' decoding='async'></span>"
        : "") +
      "<span style='flex:1'>" +
      m.foot[0] +
      "</span><a href='" +
      m.foot[2] +
      "'>" +
      m.foot[1] +
      " " +
      ic("arrow", 14) +
      "</a></div>";
  return h + "</div>";
}
function shMenu(k) {
  var m = MENU[k],
    id = "dd-" + k;
  return (
    "<div class='sh-dd dd" +
    (ACT === k ? " on" : "") +
    "'><button class='sh-t' type='button' aria-expanded='false' aria-controls='" +
    id +
    "'>" +
    m.l +
    chev() +
    "</button>" +
    panel(k).replace("<div class='dd-p ", "<div id='" + id + "' class='dd-p ") +
    "</div>"
  );
}
function shLang() {
  return "<div class='lsw' role='group' aria-label='Language'><button type='button' data-lang='en'>EN</button><button type='button' data-lang='fr'>FR</button></div>";
}
var h = document.querySelector("[data-site-header]");
if (h) {
  var brand = function (cls) {
    return (
      "<a class='" +
      cls +
      "' href='./' aria-label='Nelview home'><span class='mk'>" +
      mark("#0A0D14") +
      "</span>Nelview</a>"
    );
  };
  h.outerHTML =
    "<a class='skip' href='#main'>Skip to content</a>" +
    "<header class='sh' id='hdr'><div class='wrap sh-in'>" +
    brand("sh-brand") +
    "<nav class='sh-nav' aria-label='Main'>" +
    shMenu("product") +
    shMenu("solutions") +
    "<a class='sh-link" +
    (ACT === "pricing" ? " on" : "") +
    "' href='pricing'>Pricing</a>" +
    shMenu("resources") +
    "</nav><div class='sh-end'>" +
    shLang() +
    "<a class='sh-signin' href='" +
    APP.start +
    "'>Join our waitlist</a><a class='btn btn-p btn-sm sh-cta' href='contact'>Book a demo</a><button class='sh-burger' id='burger' type='button' aria-label='Open menu' aria-expanded='false' aria-controls='mnav'>" +
    ic("menu", 20) +
    "</button></div></div></header>" +
    "<div class='sh-sheet' id='mnav' role='dialog' aria-modal='true' aria-label='Menu'><div class='sh-sheet-top'>" +
    brand("sh-brand") +
    "<button class='sh-burger' id='mclose' type='button' aria-label='Close menu'>" +
    ic("x", 20) +
    "</button></div><div class='sh-sheet-body'>" +
    ["product", "solutions", "resources"]
      .map(function (k) {
        return (
          "<details class='sh-acc'><summary>" +
          MENU[k].l +
          chev() +
          "</summary><div class='sh-acc-b'>" +
          MENU[k].items.map(shItem).join("") +
          "</div></details>"
        );
      })
      .join("") +
    "<a class='sh-sheet-link' href='pricing'>Pricing</a></div><div class='sh-sheet-foot'>" +
    shLang() +
    "<a class='btn btn-g btn-lg' href='" +
    APP.start +
    "'>Join our waitlist</a><a class='btn btn-p btn-lg' href='contact'>Book a demo</a></div></div>";
  var main = document.querySelector("main");
  if (main && !main.id) main.id = "main";

  var hdr = document.getElementById("hdr"),
    dds = [].slice.call(hdr.querySelectorAll(".sh-dd"));
  var openDd = function (dd) {
    dds.forEach(function (x) {
      if (x !== dd) setDd(x, false);
    });
    setDd(dd, true);
  };
  var setDd = function (dd, on) {
    dd.classList.toggle("open", on);
    dd.querySelector(".sh-t").setAttribute("aria-expanded", on ? "true" : "false");
  };
  var closeMenus = function () {
    // A pending hover-open must not reopen a menu that was just closed.
    clearTimeout(timer);
    dds.forEach(function (x) {
      setDd(x, false);
    });
  };
  var timer;
  dds.forEach(function (dd) {
    var t = dd.querySelector(".sh-t");
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      // With a mouse the menu has usually opened on hover already, so a
      // click keeps it open; on a touch screen a tap toggles it.
      if (dd.classList.contains("open") && !matchMedia("(hover: hover)").matches)
        setDd(dd, false);
      else openDd(dd);
    });
    // Pointer users: open on hover, with a short delay so crossing the bar
    // does not flash menus.
    dd.addEventListener("mouseenter", function () {
      if (!matchMedia("(hover: hover)").matches) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        openDd(dd);
      }, 90);
    });
    dd.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        setDd(dd, false);
      }, 160);
    });
    // Keyboard: arrows move between entries, Escape closes and returns.
    dd.addEventListener("keydown", function (e) {
      var items = [].slice.call(dd.querySelectorAll(".mi, .dd-feat, .dd-foot a"));
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!dd.classList.contains("open")) openDd(dd);
        (items[i + 1] || items[0]).focus();
      } else if (e.key === "ArrowUp" && i >= 0) {
        e.preventDefault();
        (items[i - 1] || t).focus();
      } else if (e.key === "Escape") {
        setDd(dd, false);
        t.focus();
      }
    });
    dd.addEventListener("focusout", function (e) {
      if (!dd.contains(e.relatedTarget)) setDd(dd, false);
    });
  });
  // A link to a place on the current page does not reload it, so the menu
  // closes itself; so does a click anywhere outside the menu.
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".sh-dd") || e.target.closest(".dd-p a"))
      closeMenus();
  });

  // Phone menu: a full-screen sheet with the focus kept inside it.
  var mn = document.getElementById("mnav"),
    bg = document.getElementById("burger"),
    back = document.getElementById("mclose");
  var shut = function () {
    if (!mn.classList.contains("open")) return;
    mn.classList.remove("open");
    document.body.style.overflow = "";
    bg.setAttribute("aria-expanded", "false");
    bg.focus();
  };
  bg.addEventListener("click", function () {
    mn.classList.add("open");
    document.body.style.overflow = "hidden";
    bg.setAttribute("aria-expanded", "true");
    back.focus();
  });
  back.addEventListener("click", shut);
  mn.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      mn.classList.remove("open");
      document.body.style.overflow = "";
      bg.setAttribute("aria-expanded", "false");
    }
  });
  mn.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = [].slice
      .call(mn.querySelectorAll("a[href], button, summary"))
      .filter(function (x) {
        return x.offsetParent !== null;
      });
    if (!f.length) return;
    var first = f[0],
      last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenus();
      shut();
    }
  });
  window.addEventListener("resize", function () {
    if (innerWidth > 1120 && mn.classList.contains("open")) shut();
  });

  // Bar state: a hairline shadow once the page has moved, light text over a
  // full-width colour hero (data-bleed on <body>) until it has scrolled away.
  var bleed = document.body.hasAttribute("data-bleed")
    ? document.querySelector("main > section")
    : null;
  var onS = function () {
    var y = window.scrollY,
      on = hdr.classList.contains("sc");
    // The shadow switches on and off with a gap between the two points, so
    // the bounce at the very top of a phone page cannot make it flicker.
    if (y > 24 && !on) hdr.classList.add("sc");
    else if (y < 4 && on) hdr.classList.remove("sc");
  };
  // Light text while the colour hero is behind the bar. An observer, not a
  // scroll handler: nothing is measured on every frame.
  if (bleed) {
    if ("IntersectionObserver" in window)
      new IntersectionObserver(
        function (entries) {
          hdr.classList.toggle("on-dark", entries[entries.length - 1].isIntersecting);
        },
        { rootMargin: "-56px 0px 0px 0px" },
      ).observe(bleed);
    else hdr.classList.add("on-dark");
  }
  window.addEventListener("scroll", onS, { passive: true });
  onS();

  // Menu and footer links always land at the top of the page they name. On
  // another page that is where it opens; on the current page nothing would
  // happen, so scroll to the top instead.
  var tidy = function (path) {
    return path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  };
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("#hdr a, #mnav a, .ftr a");
    if (!a || a.target === "_blank" || a.origin !== location.origin) return;
    if (tidy(a.pathname) !== tidy(location.pathname) || a.search !== location.search || a.hash) return;
    e.preventDefault();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  });
}
