// @ts-nocheck
// Page script for contact.html. Loaded after site.ts and i18n.ts, before motion.ts.
(function () {
  var f = document.getElementById("ctForm");
  if (!f) return;
  var tabs = document.querySelectorAll("[data-ct]"),
    demo = f.querySelectorAll("select[name=role],select[name=size]"),
    msg = f.querySelectorAll(".ct-msg");
  function set(k) {
    tabs.forEach(function (t) {
      t.classList.toggle("on", t.getAttribute("data-ct") === k);
    });
    var d = k === "demo";
    f.setAttribute("data-stage", d ? "Demo request" : "Contact message");
    demo.forEach(function (s) {
      var w = s.closest(".fld");
      if (w) w.style.display = d ? "" : "none";
    });
    msg.forEach(function (m) {
      m.style.display = d ? "none" : "";
    });
    document.getElementById("ctMsgL").textContent = d
      ? "What would you like to see?"
      : "Your message";
    var b = document.getElementById("ctBtn");
    b.firstChild.nodeValue = d ? "Request a demo" : "Send message";
    var inst = f.querySelector("[name=institution]");
    if (inst) inst.required = d;
    var dn = document.getElementById("demoDone");
    if (dn) {
      var p = dn.querySelector("p");
      var h = dn.querySelector("h3");
      if (h) h.textContent = d ? "Request received." : "Message sent.";
      if (p) {
        if (!p.__o) p.__o = p.innerHTML;
        p.innerHTML = d
          ? p.__o
          : 'Thanks, <b data-fill="name" style="color:var(--ink)">there</b>. We\u2019ll reply to <b data-fill="email" style="color:var(--ink)"></b> within 1\u20132 working days.';
      }
    }
  }
  tabs.forEach(function (t) {
    t.onclick = function () {
      set(t.getAttribute("data-ct"));
    };
  });
  var q = new URLSearchParams(location.search).get("topic");
  if (q === "contact" || q === "general") set("msg");
  // Links from the Institutions page can name who is asking.
  var who = new URLSearchParams(location.search).get("role");
  var roles = {
    mentor: "Research consultant / mentor",
    "research-body": "Research body / funder",
  };
  var pick = document.querySelector("select[name=role]");
  if (pick && roles[who]) pick.value = roles[who];
  f.addEventListener("nv:sent", function () {
    var t = document.querySelector(".ct-tabs");
    if (t) t.style.display = "none";
  });
})();
