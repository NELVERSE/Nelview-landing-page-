// @ts-nocheck
// The footer, and the social links shown in it.
import { ic, mark } from "./icons";

/* socials: add a URL to show that network in the footer */
var SOCIAL = {
  linkedin: "https://www.linkedin.com/showcase/nelview/",
  x: "",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
};
var SOCI = {
  linkedin: [
    "LinkedIn",
    "<path d='M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z'/>",
  ],
  x: [
    "X",
    "<path d='M17.75 3h3.07l-6.72 7.68L22 21h-6.19l-4.85-6.34L5.4 21H2.33l7.19-8.21L2 3h6.34l4.38 5.8L17.75 3zm-1.08 16.2h1.7L7.4 4.72H5.58L16.67 19.2z'/>",
  ],
  instagram: [
    "Instagram",
    "<path d='M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2.5c-2.6 0-2.9 0-3.9.06-3.5.16-5.4 2.1-5.54 5.54C2.5 9.1 2.5 9.4 2.5 12s0 2.9.06 3.9c.16 3.44 2.07 5.38 5.54 5.54 1 .05 1.3.06 3.9.06s2.9 0 3.9-.06c3.44-.16 5.39-2.08 5.54-5.54.05-1 .06-1.3.06-3.9s0-2.9-.06-3.9c-.15-3.43-2.07-5.38-5.54-5.54C14.9 2.5 14.6 2.5 12 2.5z'/>",
  ],
  facebook: [
    "Facebook",
    "<path d='M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z'/>",
  ],
  youtube: [
    "YouTube",
    "<path d='M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z'/>",
  ],
  tiktok: [
    "TikTok",
    "<path d='M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.7V9.5a6.3 6.3 0 1 0 5.4 6.2V8.8a8.2 8.2 0 0 0 3.8 1.2V6.7z'/>",
  ],
};
function soc() {
  var o = "";
  for (var k in SOCIAL) {
    if (SOCIAL[k])
      o +=
        "<a class='soc' href='" +
        SOCIAL[k] +
        "' target='_blank' rel='noopener' aria-label='Nelview on " +
        SOCI[k][0] +
        "' title='" +
        SOCI[k][0] +
        "'><svg width='17' height='17' viewBox='0 0 24 24' fill='currentColor'>" +
        SOCI[k][1] +
        "</svg></a>";
  }
  return o ? "<div class='socs'>" + o + "</div>" : "";
}
var f = document.querySelector("[data-site-footer]");
if (f) {
  f.outerHTML =
    "<footer class='ftr'><div class='wrap'><div class='ftr-top'><div><a class='brand' href='./'><span class='mk'>" +
    mark("#FFFFFF") +
    "</span>Nelview</a><p>The pre-submission audit for research. An AI peer-review platform by <b style='color:#fff;font-weight:560'>Nelverse</b>, built in Africa for researchers everywhere.</p><div class='ct'><a href='mailto:team@nelview.com'>" +
    ic("mail", 15) +
    "team@nelview.com</a><a href='mailto:nelviewai@gmail.com'>" +
    ic("mail", 15) +
    "nelviewai@gmail.com</a><a href='tel:+233256809108'>" +
    ic("phone", 15) +
    "+233 25 680 9108</a><span style='display:inline-flex;gap:8px;align-items:center'>" +
    ic("pin", 15) +
    "Accra, Ghana</span></div></div>" +
    "<div class='col'><h5>Product</h5><a href='./'>AI Review Engine</a><a href='./'>Document Editor</a><a href='journal-guide'>Journal Check</a><a href='./'>Citation Manager</a><a href='./'>Journal Formatter</a></div>" +
    "<div class='col'><h5>Solutions</h5><a href='./'>Researchers &amp; authors</a><a href='institutions'>Institutions</a><a href='institutions'>Supervisors &amp; lecturers</a><a href='experts'>Expert reviewers</a><a href='pricing'>Pricing</a></div>" +
    "<div class='col'><h5>Resources</h5><a href='resources'>Blog &amp; guides</a><a href='journal-guide'>Predatory journal guide</a><a href='faq'>FAQ</a><a href='contact'>Help &amp; support</a></div>" +
    "<div class='col'><h5>Company</h5><a href='about'>About &amp; mission</a><a href='pledge'>Research Pledge</a><a href='experts'>Join the reviewer network</a><a href='contact'>Contact</a></div></div>" +
    "<div class='ftr-bot'><div class='ftr-soc'><span>© 2026 Nelverse · Nelview</span>" +
    soc() +
    "</div><div class='row'><a href='privacy'>Privacy</a><a href='terms'>Terms</a><a href='security'>Security</a><a href='cookies'>Cookies</a><span class='lang'><b>English</b><span title='French version coming soon'>Français · soon</span></span></div></div></div></footer>";
}
