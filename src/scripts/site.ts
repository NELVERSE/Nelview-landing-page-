// @ts-nocheck
// site.ts: the entry loaded by every page in src/pages. It runs the shared page
// shell, in this order (the order matters: the header and footer are drawn
// before anything looks for the icons, FAQ toggles and forms inside them).
// Shared globals are declared in src/types/globals.d.ts.
import "./shell/config";
import "./shell/icons";
import "./shell/menu";
import "./shell/header";
import "./shell/footer";
import "./shell/widgets";
import "./shell/forms";
import "./shell/ready";
import "./shell/consent";
