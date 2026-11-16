// @ts-nocheck
// Page script for resources.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var P = NV_POSTS,
    A = NV_AUTH,
    C = NV_CATS,
    cat = "all",
    q = "";
  function av(k, s) {
    var a = A[k];
    return a.img
      ? "<span class='av-x " +
          (s || "") +
          "'><img src='" +
          a.img +
          "' alt='' loading='lazy' decoding='async'></span>"
      : "<span class='av-x " +
          (s || "") +
          "' style='background:" +
          a.c +
          "'>" +
          a.i +
          "</span>";
  }
  function url(p) {
    return "article.html?p=" + p.s;
  }
  function cover(p) {
    return (
      "<div class='cover " +
      p.cv +
      "'><span class='k'>" +
      p.k +
      "</span><span class='t'>" +
      p.t +
      "</span></div>"
    );
  }
  var tabs = [["all", "All", P.length]].concat(
    Object.keys(C).map(function (k) {
      return [
        k,
        C[k],
        P.filter(function (p) {
          return p.c === k;
        }).length,
      ];
    }),
  );
  var ce = document.getElementById("cats");
  ce.innerHTML = tabs
    .map(function (t) {
      return (
        "<button data-c='" +
        t[0] +
        "'" +
        (t[0] === "all" ? " class='on'" : "") +
        ">" +
        t[1] +
        "<span>" +
        t[2] +
        "</span></button>"
      );
    })
    .join("");
  ce.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      cat = b.dataset.c;
      ce.querySelectorAll("button").forEach(function (x) {
        x.classList.toggle("on", x === b);
      });
      draw();
    };
  });
  function draw() {
    var list = P.filter(function (p) {
      return (
        (cat === "all" || p.c === cat) &&
        (!q ||
          (p.h + " " + p.x + " " + A[p.a].n).toLowerCase().indexOf(q) >
            -1)
      );
    });
    var f = list[0],
      rest = list.slice(1);
    document.getElementById("feat").innerHTML = f
      ? "<a class='fp' href='" +
        url(f) +
        "'>" +
        cover(f) +
        "<div><span class='tag b'>" +
        C[f.c] +
        "</span><h2>" +
        f.h +
        "</h2><p>" +
        f.x +
        "</p><div class='byl'>" +
        av(f.a, "s") +
        "<b>" +
        A[f.a].n +
        "</b><span>·</span><span>" +
        f.d +
        "</span><span>·</span><span>" +
        f.m +
        " min read</span></div></div></a>"
      : "";
    document.getElementById("posts").innerHTML = rest
      .map(function (p) {
        return (
          "<a class='post' href='" +
          url(p) +
          "'>" +
          cover(p) +
          "<div class='meta'><span>" +
          C[p.c] +
          "</span><span>·</span><span>" +
          p.m +
          " min</span></div><h3>" +
          p.h +
          "</h3><p>" +
          p.x +
          "</p><div class='byl' style='margin-top:4px'>" +
          av(p.a, "s") +
          "<span>" +
          A[p.a].n +
          "</span></div></a>"
        );
      })
      .join("");
    document
      .getElementById("empty")
      .classList.toggle("show", !list.length);
  }
  var qi = document.getElementById("q");
  qi.oninput = function () {
    q = qi.value.trim().toLowerCase();
    draw();
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== qi) {
      e.preventDefault();
      qi.focus();
    }
  });
  draw();
})();
