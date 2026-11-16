// @ts-nocheck
// Page script for article.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var P = NV_POSTS,
    A = NV_AUTH,
    C = NV_CATS;
  var s = new URLSearchParams(location.search).get("p");
  var p =
    P.filter(function (x) {
      return x.s === s;
    })[0] || P[0];
  var a = A[p.a];
  function av(k, c) {
    var o = A[k];
    return o.img
      ? "<span class='av-x " +
          (c || "") +
          "'><img src='" +
          o.img +
          "' alt='' loading='lazy' decoding='async'></span>"
      : "<span class='av-x " +
          (c || "") +
          "' style='background:" +
          o.c +
          "'>" +
          o.i +
          "</span>";
  }
  document.title = p.h + " · Nelview";
  // Every article is served by this one file, so describe the one on show
  // to search engines and link previews.
  (function () {
    function set(sel, val) {
      var e = document.querySelector(sel);
      if (e) e.setAttribute("content", val);
    }
    set('meta[name="description"]', p.x);
    set('meta[property="og:title"]', document.title);
    set('meta[property="og:description"]', p.x);
    var c = document.createElement("link");
    c.rel = "canonical";
    c.href =
      location.origin +
      location.pathname.replace(/\.html$/, "") +
      "?p=" +
      encodeURIComponent(p.s);
    document.head.appendChild(c);
  })();
  document.getElementById("a-h").textContent = p.h;
  document.getElementById("a-x").textContent = p.x;
  document.getElementById("a-who").innerHTML =
    av(p.a) +
    "<div><b>" +
    a.n +
    "</b>" +
    p.d +
    " · " +
    p.m +
    " min read</div>";
  document.getElementById("a-cv").innerHTML =
    "<div class='cover art-cv " +
    p.cv +
    "'><span class='k'>" +
    p.k +
    " · " +
    p.m +
    " MIN READ</span><span class='t'>" +
    p.t +
    "</span></div>";
  var b = document.getElementById("a-b");
  b.innerHTML = p.b;
  var hs = b.querySelectorAll("h2");
  document.getElementById("toc").innerHTML = hs.length
    ? "<h6>ON THIS PAGE</h6>" +
      Array.prototype.map
        .call(hs, function (h) {
          return "<a href='#" + h.id + "'>" + h.textContent + "</a>";
        })
        .join("")
    : "";
  document.getElementById("a-card").innerHTML =
    av(p.a) +
    "<div><span>Written by</span><b>" +
    a.n +
    "</b><span>" +
    a.r +
    "</span></div>";
  var rel = P.filter(function (x) {
    return x !== p && x.c === p.c;
  })
    .concat(
      P.filter(function (x) {
        return x !== p && x.c !== p.c;
      }),
    )
    .slice(0, 3);
  document.getElementById("rel").innerHTML = rel
    .map(function (r) {
      return (
        "<a class='post' href='article.html?p=" +
        r.s +
        "'><div class='cover " +
        r.cv +
        "'><span class='k'>" +
        r.k +
        "</span><span class='t'>" +
        r.t +
        "</span></div><div class='meta'><span>" +
        C[r.c] +
        "</span><span>·</span><span>" +
        r.m +
        " min</span></div><h3>" +
        r.h +
        "</h3><p>" +
        r.x +
        "</p></a>"
      );
    })
    .join("");
  var u = encodeURIComponent(location.href);
  document.getElementById("sh-li").href =
    "https://www.linkedin.com/sharing/share-offsite/?url=" + u;
  document.getElementById("sh-mail").href =
    "mailto:?subject=" + encodeURIComponent(p.h) + "&body=" + u;
  document.getElementById("copy").onclick = function () {
    var t = document.getElementById("toast");
    (navigator.clipboard
      ? navigator.clipboard.writeText(location.href)
      : Promise.resolve()
    )
      .catch(function () {})
      .then(function () {
        t.classList.add("show");
        setTimeout(function () {
          t.classList.remove("show");
        }, 1600);
      });
  };
  var links = document.querySelectorAll("#toc a");
  if (links.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting)
            links.forEach(function (l) {
              l.classList.toggle(
                "on",
                l.getAttribute("href") === "#" + e.target.id,
              );
            });
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    hs.forEach(function (h) {
      io.observe(h);
    });
  }
})();
