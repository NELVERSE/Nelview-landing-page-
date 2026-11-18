// @ts-nocheck
// Where the site sends people and form data.
export var PORTAL_BASE = "https://app.nelview.com"; // change to your portal domain

export var APP = {
  signin: "signin",
  start: "waitlist",
  inst: PORTAL_BASE + "/institution/onboarding",
  expert: "apply",
  expertPortal: PORTAL_BASE + "/expert",
  instPortal: PORTAL_BASE + "/institution",
};
window.NV_APP = APP;

export var NV_EP =
  "https://script.google.com/macros/s/AKfycbyhkInKg7BWv6gckVt6lAJSW2_RvRkkouS_tDN9ZnFP7cJ3to7fR-JWU3L9ljfU-We-hQ/exec";
