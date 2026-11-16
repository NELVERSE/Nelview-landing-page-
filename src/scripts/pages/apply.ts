// @ts-nocheck
// Page script for apply.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var f = document.getElementById("apf"),
    P = f.querySelectorAll(".fpanel"),
    S = document.querySelectorAll("#stepper .s"),
    cur = 0,
    err = document.getElementById("ferr");
  document.querySelectorAll("[data-chips] .chip").forEach(function (c) {
    c.onclick = function () {
      c.classList.toggle("on");
    };
  });
  var cv = document.getElementById("cv");
  var CV_MAX = 10 * 1024 * 1024,
    cvl = document.getElementById("cvl");
  cv.onchange = function () {
    var fl = cv.files[0];
    if (fl && fl.size > CV_MAX) {
      cv.value = "";
      cvl.textContent =
        "That file is over 10 MB. Please upload a smaller PDF or DOCX.";
      return;
    }
    if (fl) cvl.textContent = fl.name;
  };
  // Read the chosen CV as base64 so it can travel in the JSON submission.
  function readCv(done) {
    var fl = cv.files[0];
    if (!fl) return done("");
    var r = new FileReader();
    r.onload = function () {
      done(String(r.result).split(",")[1] || null);
    };
    r.onerror = function () {
      done(null);
    };
    r.readAsDataURL(fl);
  }
  var reading = false;
  function go(n) {
    cur = n;
    P.forEach(function (p, i) {
      p.classList.toggle("on", i === n);
    });
    S.forEach(function (s, i) {
      s.classList.toggle("on", i === n);
      s.classList.toggle("dn", i < n);
      s.querySelector("i").innerHTML = i < n ? nvIc("check", 14) : i + 1;
    });
    document.getElementById("back").style.visibility = n
      ? "visible"
      : "hidden";
    document.getElementById("cnt").textContent =
      "Step " + (n + 1) + " of 4";
    document.getElementById("next").innerHTML =
      n === 3 ? "Submit application" : "Continue" + nvIc("arrow", 16);
    err.classList.remove("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function valid() {
    var p = P[cur],
      ok = true;
    p.querySelectorAll("[required]").forEach(function (i) {
      if (!i.value.trim() || !i.checkValidity()) ok = false;
    });
    if (cur === 1 && !p.querySelector("[data-chips=fields] .chip.on"))
      ok = false;
    if (cur === 2 && !cv.files.length) ok = false;
    if (cur === 3 && !document.getElementById("agree").checked)
      ok = false;
    return ok;
  }
  document.getElementById("back").onclick = function () {
    go(cur - 1);
  };
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!valid()) {
      err.classList.add("show");
      return;
    }
    if (cur < 3) {
      go(cur + 1);
      return;
    }
    var fd = nvFdata(f),
      ch = function (g) {
        return [].map
          .call(
            document.querySelectorAll("[data-chips=" + g + "] .chip.on"),
            function (c) {
              return c.textContent.trim();
            },
          )
          .join("; ");
      };
    fd.stage = "Expert application";
    if (fd.inst && !fd.institution) {
      fd.institution = fd.inst;
      delete fd.inst;
    }
    fd.fields = ch("fields");
    [].forEach.call(
      document.querySelectorAll("[data-chips]"),
      function (g) {
        var k = g.getAttribute("data-chips");
        if (k !== "fields") fd[k] = ch(k);
      },
    );
    fd.cv_file = cv.files[0] ? cv.files[0].name : "";
    if (reading) return;
    reading = true;
    readCv(function (data) {
      reading = false;
      if (data === null) {
        cv.value = "";
        cvl.textContent =
          "We couldn't read that file. Please choose it again.";
        go(2);
        return;
      }
      if (data)
        fd.cv = {
          name: cv.files[0].name,
          type: cv.files[0].type,
          data: data,
        };
      nvSubmit(f, fd, function () {
        document.getElementById("dn").textContent =
          f.elements["name"].value
            .trim()
            .split(" ")
            .filter(function (w) {
              return !/^(Dr|Prof)\.?$/.test(w);
            })[0] || "there";
        document.getElementById("de").textContent =
          f.elements["email"].value.trim();
        f.style.display = "none";
        document.getElementById("apdone").classList.add("show");
        S.forEach(function (s) {
          s.classList.remove("on");
          s.classList.add("dn");
          s.querySelector("i").innerHTML = nvIc("check", 14);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  });
})();
