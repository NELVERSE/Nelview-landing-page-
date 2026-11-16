// @ts-nocheck
// Page script for waitlist.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var P =
    "M18.38,11.47c-.73.73-1.18,1.75-1.16,2.86.03,2.18,1.89,3.9,4.08,3.9h5.19s.02,0,.02.02v3.98c0,2.36-1.91,4.27-4.27,4.27h-5s-.02,0-.02-.02v-1.520c0-1.09,0-2.77-.27-3.75-.59-2.16-2.72-2.68-3.83-2.67-2.18.03-4.44,1.75-3.820,6.53v1.41s0,.02-.02.02h-5c-2.36,0-4.27-1.91-4.27-4.27v-3.98s0-.02.02-.02h5.53c1.09,0,2.08-.45,2.8-1.16.73-.73,1.18-1.75,1.16-2.86-.03-2.18-1.89-3.9-4.07-3.9H.02s-.02,0-.02-.02v-6.02C0,1.91,1.91,0,4.27,0h5s.02,0,.02.02v3.88c0,1.09.45,2.08,1.16,2.8.73.73,1.75,1.18,2.86,1.16,2.18-.03,3.9-1.89,3.9-4.08V.02s0-.02.02-.02h5c2.36,0,4.27,1.91,4.27,4.27v6.020s0,.02-.02.02h-5.31c-1.09,0-2.08.45-2.8,1.16Z";
  var D = [
    [13.25, 3.3],
    [13.25, 22.83],
    [22.43, 14.09],
    [4.22, 14.09],
  ];
  document.getElementById("wlLogo").innerHTML =
    "<svg viewBox='0 0 26.5 26.51'><path fill='#14231B' d='" +
    P +
    "'/>" +
    D.map(function (d) {
      return (
        "<circle fill='#14231B' cx='" +
        d[0] +
        "' cy='" +
        d[1] +
        "' r='1.44'/>"
      );
    }).join("") +
    "</svg>";
  function $(i) {
    return document.getElementById(i);
  }
  function v(i) {
    var e = $(i);
    return e ? (e.value || "").trim() : "";
  }
  function err(i, on) {
    $(i).classList.toggle("show", on);
  }
  try {
    var qe = sessionStorage.getItem("nelview_prefill_email") || "";
    if (qe) {
      sessionStorage.removeItem("nelview_prefill_email");
    }
    if (!qe) qe = new URLSearchParams(location.search).get("email") || "";
    if (/^\S+@\S+$/.test(qe)) $("f_email").value = qe;
    if (/[?&]email=/i.test(location.search)) {
      var u = new URL(location.href);
      u.searchParams.delete("email");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
  } catch (e) {}
  // localStorage throws when storage is blocked (private mode, strict settings).
  function stored(k) {
    try {
      return localStorage.getItem(k) || "";
    } catch (e) {
      return "";
    }
  }
  var refBy = "";
  try {
    var rp = new URLSearchParams(location.search).get("ref");
    if (rp) {
      refBy = rp;
      localStorage.setItem("nelview_ref", rp);
    } else refBy = localStorage.getItem("nelview_ref") || "";
  } catch (e) {}
  ["fields", "needs"].forEach(function (g) {
    $(g).addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (c) {
        c.classList.toggle("on");
        err("e2", false);
      }
    });
  });
  var st = [].slice.call(document.querySelectorAll("#wsteps>div"));
  function go(n) {
    for (var i = 1; i <= 3; i++) {
      $("fp" + i).classList.toggle("on", i === n);
      st[i - 1].classList.toggle("on", i === n);
      st[i - 1].classList.toggle("dn", i < n);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("n1").onclick = function () {
    var ok =
      v("f_name") &&
      /^\S+@\S+\.\S+$/.test(v("f_email")) &&
      v("f_country") &&
      v("f_role");
    err("e1", !ok);
    if (ok) go(2);
  };
  $("b1").onclick = function () {
    go(1);
  };
  $("n2").onclick = function () {
    var ok =
      v("f_inst") &&
      document.querySelectorAll("#fields .chip.on").length > 0;
    err("e2", !ok);
    if (ok) go(3);
  };
  $("b2").onclick = function () {
    go(2);
  };
  try {
    var q = new URLSearchParams(location.search).get("ref");
    if (q) localStorage.setItem("nelview_ref_by", q);
  } catch (e) {}
  var EP =
    "https://script.google.com/macros/s/AKfycbyhkInKg7BWv6gckVt6lAJSW2_RvRkkouS_tDN9ZnFP7cJ3to7fR-JWU3L9ljfU-We-hQ/exec";
  function chips(g) {
    return [].map
      .call(
        document.querySelectorAll("#" + g + " .chip.on"),
        function (c) {
          return c.textContent.replace(/\s+/g, " ").trim();
        },
      )
      .join("; ");
  }
  $("go").onclick = function () {
    var ok = $("f_agree").checked;
    err("e3", !ok);
    if (!ok) return;
    var rec = {
      submitted_at: new Date().toISOString(),
      stage: "Full application",
      name: v("f_name"),
      email: v("f_email"),
      country: v("f_country"),
      role: v("f_role"),
      institution: v("f_inst"),
      fields: chips("fields"),
      reviews: chips("needs"),
      supervises: v("f_supervise"),
      working_on: v("f_about"),
      heard: v("f_ref"),
      referred_by: refBy,
      hp: v("f_company_website"),
    };
    var inRef = (
      new URLSearchParams(location.search).get("ref") ||
      stored("nelview_ref_by") ||
      ""
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (inRef && !rec.referred_by) rec.referred_by = inRef;
    [$("wlNum"), $("refno")].forEach(function (e) {
      e.textContent = "";
      e.classList.add("wl-load");
    });
    $("refLink").value = "Generating your link…";
    function paint(d) {
      [$("wlNum"), $("refno")].forEach(function (e) {
        e.classList.remove("wl-load");
      });
      if (d && d.ok && d.position) {
        $("wlNum").textContent =
          "#" + Number(d.position).toLocaleString();
        $("refno").textContent = d.reference || "—";
        $("refLink").value = "nelview.com/beta?ref=" + (d.ref_code || "");
        try {
          localStorage.setItem(
            "nelview_beta",
            JSON.stringify({
              ref_code: d.ref_code,
              reference: d.reference,
            }),
          );
        } catch (e) {}
        $("wlMeta").textContent = d.returning
          ? "You already applied, so here\u2019s your current spot."
          : d.referrals
            ? d.referrals +
              " referral" +
              (d.referrals > 1 ? "s" : "") +
              " so far"
            : "";
        poll(d.ref_code);
      } else {
        var K = "nelview_beta_ref",
          r =
            stored(K) ||
            "NV-BETA-" + Math.floor(100000 + Math.random() * 900000);
        try {
          localStorage.setItem(K, r);
        } catch (e) {}
        $("refno").textContent = r;
        var fn =
          (v("f_name").split(" ")[0] || "you")
            .toLowerCase()
            .replace(/[^a-z]/g, "") || "you";
        $("refLink").value = "nelview.com/beta?ref=" + fn;
        $("wlNum").textContent = "#…";
        $("wlMeta").textContent =
          "Updating live once your spot is confirmed.";
        fetch(EP)
          .then(function (x) {
            return x.json();
          })
          .then(function (c) {
            $("wlNum").textContent =
              "#" + Math.max(1, c.count || 0).toLocaleString();
          })
          .catch(function () {
            $("wlNum").textContent = "#1";
          });
      }
    }
    function poll(code) {
      if (!code) return;
      clearInterval(window.__wlP);
      window.__wlP = setInterval(function () {
        if (document.hidden) return;
        fetch(EP + "?ref=" + encodeURIComponent(code))
          .then(function (x) {
            return x.json();
          })
          .then(function (d) {
            if (d && d.ok && d.position) {
              $("wlNum").textContent =
                "#" + Number(d.position).toLocaleString();
              $("wlMeta").textContent = d.referrals
                ? d.referrals +
                  " referral" +
                  (d.referrals > 1 ? "s" : "") +
                  " so far \u00b7 updated live"
                : "Updated live";
            }
          })
          .catch(function () {});
      }, 20000);
    }
    // Show the confirmation only once the application is really stored.
    function welcome() {
      $("fp3").classList.remove("on");
      st.forEach(function (s) {
        s.classList.remove("on");
        s.classList.add("dn");
      });
      $("ok").classList.add("on");
      $("nospam").style.display = "none";
      $("wlTitle").textContent = "Welcome aboard.";
      $("wlLead").textContent = "Here\u2019s what happens next.";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (rec.hp) {
      // Honeypot filled: a bot. Look successful, send nothing.
      paint(null);
      welcome();
      return;
    }
    var btn = this;
    function failed() {
      btn.disabled = false;
      err("e4", true);
    }
    btn.disabled = true;
    err("e4", false);
    fetch(EP, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(rec),
    })
      .then(function (x) {
        return x.json();
      })
      .then(function (d) {
        if (!d || !d.ok || !d.position) return failed();
        btn.disabled = false;
        paint(d);
        welcome();
      })
      .catch(failed);
  };
  $("copy").onclick = function () {
    var i = $("refLink");
    i.select();
    try {
      navigator.clipboard.writeText(i.value);
    } catch (e) {}
    var b = this;
    b.textContent = "Copied";
    setTimeout(function () {
      b.textContent = "Copy link";
    }, 1800);
  };
})();
