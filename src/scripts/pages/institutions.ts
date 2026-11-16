// @ts-nocheck
// Page script for institutions.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var D = {
    bsc: {
      t: "BSc final project",
      seats: "1,240 seats",
      pm: 55,
      c: [
        ["Structure & writing", 30],
        ["Literature review", 25],
        ["Methodology", 25],
        ["Ethics", 20],
      ],
      b: [
        ["0–39", "Fail", "r"],
        ["40–54", "Revise", "y"],
        ["55–69", "Pass", "g"],
        ["70+", "First class", "b"],
      ],
      r: "Below 55 returns to the student with AI feedback. Supervisors see it at 55+.",
    },
    msc: {
      t: "MSc thesis",
      seats: "412 seats",
      pm: 65,
      c: [
        ["Methodology", 30],
        ["Literature & theory", 25],
        ["Ethics (local IRB)", 25],
        ["Writing & structure", 20],
      ],
      b: [
        ["0–49", "Fail", "r"],
        ["50–64", "Revise", "y"],
        ["65–79", "Pass", "g"],
        ["80+", "Distinction", "b"],
      ],
      r: "Below 65 routes to the supervisor automatically with flagged sections.",
    },
    phd: {
      t: "PhD chapter",
      seats: "186 seats",
      pm: 75,
      c: [
        ["Novelty & contribution", 30],
        ["Methodology", 30],
        ["Statistics", 20],
        ["Ethics & integrity", 20],
      ],
      b: [
        ["0–59", "Major revision", "r"],
        ["60–74", "Minor revision", "y"],
        ["75–89", "Ready for committee", "g"],
        ["90+", "Publication-ready", "b"],
      ],
      r: "75+ unlocks committee review. 85+ suggests an external expert.",
    },
  };
  function ren(k) {
    var d = D[k];
    document.getElementById("cfgTitle").textContent = d.t;
    document.getElementById("cfgSeats").textContent = d.seats;
    document.getElementById("cfgPm").textContent = d.pm;
    document.getElementById("cfgCrit").innerHTML = d.c
      .map(function (c) {
        return (
          "<div class='c'>" +
          c[0].replace("&", "&amp;") +
          "<div class='bar'><span style='width:" +
          c[1] * 2.5 +
          "%'></span></div><b>" +
          c[1] +
          "%</b></div>"
        );
      })
      .join("");
    document.getElementById("cfgFill").style.width = d.pm + "%";
    document.getElementById("cfgMark").style.left = d.pm + "%";
    document.getElementById("cfgRoute").textContent = d.r;
    document.getElementById("cfgBands").innerHTML = d.b
      .map(function (b) {
        return (
          "<div><span class='tag " +
          b[2] +
          "'>" +
          b[0] +
          "</span><b>" +
          b[1] +
          "</b></div>"
        );
      })
      .join("");
  }
  document.querySelectorAll("#progTabs button").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#progTabs button").forEach(function (x) {
        x.classList.toggle("on", x === b);
      });
      ren(b.getAttribute("data-k"));
    };
  });
  ren("bsc");
})();
