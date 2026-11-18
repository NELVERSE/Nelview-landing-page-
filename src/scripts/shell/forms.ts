// @ts-nocheck
// Forms: sending to the Apps Script backend, honest success/failure, the page forms.
import { APP, NV_EP } from "./config";
import { ic } from "./icons";

document.querySelectorAll("form[data-lead]").forEach(function (fm) {
  fm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = (fm.querySelector("input[type=email]") || {}).value || "";
    try {
      sessionStorage.setItem("nelview_prefill_email", v.trim());
    } catch (x) {}
    location.href = fm.getAttribute("data-lead") || APP.start;
  });
});
window.nvSend = function (rec) {
  rec.submitted_at = rec.submitted_at || new Date().toISOString();
  rec.page = location.pathname.split("/").pop() || "index.html";
  try {
    rec.lang = document.documentElement.lang || "en";
  } catch (e) {}
  var ctl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () {
    if (ctl) ctl.abort();
  }, 60000);
  return fetch(NV_EP, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(rec),
    signal: ctl ? ctl.signal : undefined,
  })
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return { ok: false };
    })
    .then(function (d) {
      clearTimeout(timer);
      return d || { ok: false };
    });
};
/* Send a form and only call done() once the backend has confirmed it.
   On failure the form stays as it was, with an error, so the visitor can retry. */
var SEND_ERR =
  "We couldn't send that. Check your connection and try again, or email team@nelview.com.";
window.nvSubmit = function (fm, rec, done) {
  if (fm.__sending) return;
  fm.__sending = true;
  var btn = fm.querySelector("button[type=submit]");
  var er = fm.__err;
  if (er) er.classList.remove("show");
  if (btn) btn.disabled = true;
  fm.setAttribute("aria-busy", "true");
  nvSend(rec).then(function (d) {
    fm.__sending = false;
    if (btn) btn.disabled = false;
    fm.removeAttribute("aria-busy");
    if (d && d.ok) {
      done(d);
      return;
    }
    if (!er) {
      er = fm.__err = document.createElement("div");
      er.className = "ferr nv-send-err";
      er.setAttribute("role", "alert");
      fm.insertAdjacentElement("afterend", er);
    }
    er.textContent = SEND_ERR;
    er.classList.add("show");
  });
};
function fdata(fm) {
  var o = {};
  [].forEach.call(fm.elements, function (el) {
    if (
      !el.name ||
      el.type === "file" ||
      ((el.type === "radio" || el.type === "checkbox") && !el.checked)
    )
      return;
    o[el.name] = el.value.trim();
  });
  return o;
}
window.nvFdata = fdata;
document.querySelectorAll("form[data-sub]").forEach(function (fm) {
  fm.addEventListener("submit", function (e) {
    e.preventDefault();
    var m =
      fm.getAttribute("data-sub") ||
      "You're subscribed. Check your inbox to confirm.";
    var em = (fm.querySelector("input[type=email]") || {}).value || "";
    var hp = fm.querySelector("[name=hp]");
    nvSubmit(
      fm,
      {
        stage: fm.getAttribute("data-list") || "Newsletter",
        email: em.trim(),
        hp: hp ? hp.value : "",
      },
      function () {
        if (fm.__err) fm.__err.remove();
        fm.outerHTML = "<p class='subok'>" + ic("check", 16) + m + "</p>";
      },
    );
  });
});
document.querySelectorAll("form[data-done]").forEach(function (fm) {
  fm.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = fdata(fm);
    var stg = fm.getAttribute("data-stage") || "Demo request";
    nvSubmit(
      fm,
      stg === "Contact message"
        ? {
            stage: "Contact message",
            topic: fd.topic,
            name: fd.name,
            email: fd.email,
            institution: fd.institution,
            message: fd.message,
            hp: fd.hp || "",
          }
        : {
            stage: stg,
            name: fd.name,
            email: fd.email,
            institution: fd.institution,
            role: fd.role,
            team_size: fd.size,
            message: fd.message,
            hp: fd.hp || "",
          },
      function () {
        var d = document.getElementById(fm.getAttribute("data-done"));
        var n = fm.querySelector("[name=name]");
        var em = fm.querySelector("[name=email]");
        if (d) {
          var a = d.querySelector("[data-fill=name]");
          if (a && n) a.textContent = n.value.trim().split(" ")[0] || "there";
          var b = d.querySelector("[data-fill=email]");
          if (b && em) b.textContent = em.value.trim();
          fm.style.display = "none";
          d.classList.add("show");
        }
        fm.dispatchEvent(new CustomEvent("nv:sent"));
      },
    );
  });
});
