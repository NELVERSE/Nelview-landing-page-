// @ts-nocheck
// The header menus: what is in them, and which one the current page belongs to.
export var page = document.body.getAttribute("data-page") || "";
export var MENU = {
  product: {
    l: "Product",
    items: [
      [
        "cpu",
        "AI Review Engine",
        "A 0–100 readiness score across methods, novelty, stats and ethics",
        "./",
      ],
      [
        "edit",
        "Document Editor",
        "Fix issues section by section, in context",
        "./",
      ],
      [
        "shield",
        "Journal Check",
        "DOAJ and COPE legitimacy, predatory red flags",
        "journal-guide",
      ],
      [
        "book",
        "Citation Manager",
        "Sync Zotero and Mendeley, catch missing refs",
        "./",
      ],
      [
        "layers",
        "Journal Formatter",
        "Match any journal's guidelines in seconds",
        "./",
      ],
      [
        "users",
        "Expert Review",
        "Named human reviewers, double-blind",
        "experts",
      ],
    ],
    cols: 2,
    feat: [
      "New",
      "Pass marks per programme",
      "Institutions can now set their own criteria, bands and pass marks.",
      "institutions",
      "assets/photos/classroom.webp",
    ],
  },
  solutions: {
    l: "Solutions",
    items: [
      [
        "file",
        "Researchers & authors",
        "Submit with confidence, not hope",
        "./",
      ],
      [
        "building",
        "Institutions",
        "Universities, mentors and research bodies",
        "institutions",
      ],
      [
        "grad",
        "Supervisors & lecturers",
        "Spend time on the thinking, not the typos",
        "institutions",
      ],
      [
        "award",
        "Expert reviewers",
        "Earn by reviewing work in your field",
        "experts",
      ],
    ],
    cols: 2,
    foot: [
      "Planning a rollout?",
      "Book a demo",
      "contact",
      "assets/photos/library.png",
    ],
  },
  resources: {
    l: "Resources",
    items: [
      [
        "book",
        "Blog & guides",
        "Writing on review, journals and grants",
        "resources",
      ],
      [
        "flag",
        "Predatory journal guide",
        "Seven red flags and how to check",
        "journal-guide",
      ],
      ["search", "FAQ", "Answers to common questions", "faq"],
      [
        "heart",
        "About & mission",
        "Our mission and the people behind it",
        "about",
      ],
      [
        "award",
        "Research Pledge",
        "How every subscription funds research",
        "pledge",
      ],
      ["mail", "Contact & support", "Talk to our team", "contact"],
    ],
    cols: 1,
    post: [
      "GUIDE",
      "Spotting a predatory journal in 5 minutes",
      "journal-guide",
      "assets/photos/factcheck.png",
    ],
  },
};
export var ACT =
  {
    home: "product",
    inst: "solutions",
    exp: "solutions",
    price: "pricing",
    res: "resources",
    about: "resources",
    faq: "resources",
    contact: "resources",
  }[page] || "";
