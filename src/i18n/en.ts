import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    siteName: "Alexander Lapygin",
    siteDescription:
      "Independent web developer and technical writer. Partner-style engagement, transparency, full project ownership for the client.",
    siteAuthor: "Alexander Lapygin",
  },
  nav: {
    home: "Home",
    about: "About",
    projects: "Projects",
    solutions: "Solutions",
    blog: "Blog",
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  toggles: {
    themeToToDark: "Switch to dark theme",
    themeToToLight: "Switch to light theme",
    langSwitchTo: "RU",
    langSwitchLabel: "Переключить на русский",
  },
  footer: {
    tagline:
      "Independent developer. Web applications, technical writing, consulting.",
    servicesHeading: "Services",
    services: ["Web application development", "Technical writing", "Consulting"],
    contactsHeading: "Contact",
    emailAriaLabel: "Send email",
    telegramAriaLabel: "Message on Telegram",
    githubAriaLabel: "Author's GitHub",
    privacy: "Privacy policy",
    rss: "RSS",
    copyright: (year) => `© ${year} Alexander Lapygin`,
  },
  home: {
    heroTitle: "Independent web application developer",
    heroSubtitle:
      "I help businesses and startups build transparent, controllable products — from the first spec to long-term operation.",
    philosophyTitle: "Approach",
    philosophyBody:
      "Content over decoration, static by default, minimum dependencies. I take on what I can carry from spec to release.",
    advantagesTitle: "What you get",
    advantages: [
      {
        title: "Technical partner, not a contractor",
        body:
          "I help you frame the problem before writing code. I push back when I see weak spots.",
      },
      {
        title: "Transparency",
        body:
          "Spec audit upfront, fixed scope, clear plan. No mid-flight surprises.",
      },
      {
        title: "Project ownership stays with you",
        body:
          "Code, domains, secrets, analytics — all yours. The day I leave, you keep going.",
      },
      {
        title: "AI-ready architecture",
        body:
          "Documentation that humans and LLM assistants both understand. Contracts over magic.",
      },
    ],
    featuredProjectsTitle: "Client projects",
    featuredProjectsLink: "All projects",
    latestPostsTitle: "Latest posts",
    latestPostsLink: "All posts",
    cta: "Discuss a project",
  },
  about: {
    title: "About",
    approachTitle: "Approach",
    approachBody: [
      "I run projects end-to-end — from the first call and spec through to live operation. Short cycles and concrete commitments.",
      "Tech preferences: simple, proven stacks. Astro, TypeScript, Node, PostgreSQL, minimum magic. I don't retrain clients on framework-of-the-month.",
      "If a problem isn't mine — I'll say so and recommend the right people.",
    ],
    expertiseTitle: "Technical expertise",
    expertise: [
      {
        group: "Frontend",
        items: ["Astro", "TypeScript", "React (when justified)", "CSS architecture"],
      },
      {
        group: "Backend",
        items: ["Node.js", "PostgreSQL", "Redis", "REST/GraphQL APIs"],
      },
      {
        group: "Architecture",
        items: [
          "System decomposition",
          "Stack selection per problem",
          "SLOs, reliability, security",
        ],
      },
      {
        group: "AI tooling",
        items: [
          "Embedding LLMs into products",
          "Documentation for assistants",
          "Voice-to-spec pipelines",
        ],
      },
      {
        group: "Documentation",
        items: ["Technical specifications", "Operations runbooks", "Decision journals"],
      },
    ],
    timelineTitle: "Experience",
    timeline: [
      {
        period: "2023 — present",
        role: "Independent developer",
        summary: "Web applications and specifications for clients in Russia and CIS.",
        achievements: [
          "Shipped multiple client and SaaS products from scratch",
          "Repeatedly pulled projects out of stuck states",
          "Long-term operations contracts",
        ],
      },
      {
        period: "2018 — 2023",
        role: "Senior Engineer / Tech Lead",
        summary: "Product teams: web, backend, infrastructure.",
        achievements: [
          "Architected high-load services",
          "Mentored junior engineers",
          "Built engineering culture (tests, reviews, on-call)",
        ],
      },
    ],
    educationTitle: "Education",
    education: [
      { period: "2010 — 2016", line: "MS in Applied Mathematics" },
    ],
    cta: "Discuss a project",
  },
  projects: {
    title: "Projects",
    subtitle:
      "Client work, personal experiments and SaaS products I've worked on.",
    clientHeading: "Client projects",
    personalHeading: "Personal projects",
    saasHeading: "SaaS",
    comingSoon: "Coming Soon",
    repoLink: "Repository",
    backLink: "← All projects",
    open: "Open",
    code: "Code",
  },
  solutions: {
    title: "Solutions",
    subtitle: "Reusable solutions I bring to production-ready faster than the rest.",
    ctaHeading: "Ready to start?",
    cta: "Get in touch",
  },
  blog: {
    title: "Blog",
    rssLabel: "RSS feed",
    featuredHeading: "Featured posts",
    allHeading: "All posts",
    readMore: "Read more",
    minutesShort: "min",
    backLink: "← All posts",
    relatedHeading: "Related",
    aboutAuthorHeading: "About the author",
    tocTitle: "Contents",
    empty: "Posts are coming soon.",
  },
  contact: {
    title: "Discuss a project",
    subtitle:
      "Tell me briefly what you need — I respond within 24 hours. No autoresponders.",
    fields: {
      name: "Name",
      email: "Email (optional)",
      company: "Company (optional)",
      projectType: "Project type",
      budget: "Budget",
      details: "Project details",
      submit: "Open in Telegram",
      submitOpened: "Opened in Telegram",
    },
    placeholders: {
      name: "How should I address you",
      email: "name@company.com",
      company: "e.g. Acme Inc.",
      details:
        "What needs to be done, the timeline, and constraints. Links welcome.",
      pickOne: "Pick one...",
    },
    projectTypes: [
      "New web application",
      "API development",
      "Technical writing",
      "Consulting",
      "Other",
    ],
    budgets: [
      "$1k – $3k",
      "$3k – $10k",
      "$10k – $30k",
      "$30k+",
      "Not sure yet",
    ],
    asideEmailHeading: "Direct email",
    asideTelegramHeading: "Direct Telegram",
    asideStepsHeading: "What happens next",
    asideSteps: [
      "Initial discussion within 24 hours.",
      "Technical specification and a fixed estimate.",
      "Short delivery cycles with transparent status.",
    ],
    asideFaqHeading: "FAQ",
    asideFaq: [
      {
        q: "Do you sign a contract?",
        a:
          "Yes. Standard service agreement or your own template — your call. Monthly closing documents.",
      },
      {
        q: "Solo or with a team?",
        a:
          "Solo by default. For larger projects I assemble a team from trusted collaborators.",
      },
      {
        q: "Do you support running products?",
        a: "Yes. Fixed monthly retainer for support and development after launch.",
      },
      {
        q: "What about NDA?",
        a:
          "Happy to sign. I never publish numbers or product names that fall under NDA.",
      },
    ],
    charCounter: (used, max) => `${used} / ${max}`,
    charCounterWithMin: (used, max, min) => `${used} / ${max} · min ${min}`,
    submitDisabledHint:
      "Fill in “Name” and “Project details” (at least 30 characters).",
    truncatedWarning:
      "Text exceeds Telegram's limit and will be truncated when opening. Shorten it or continue in Telegram.",
    infoNoticeTelegram:
      "Clicking «Open in Telegram» opens your Telegram client with a draft message. The message is sent from your client per Telegram's terms.",
    afterClick: {
      heading: "If Telegram didn't open",
      hint: "Use email or open Telegram directly.",
      emailLabel: "Send email",
      telegramLabel: "Open Telegram",
    },
    noJs: {
      heading: "JavaScript is required for this form",
      body: "Reach out directly — equally fast.",
      telegramButton: "Message on Telegram",
      mailtoButton: "Send email",
    },
    prefill: {
      name: "Name",
      email: "Email",
      company: "Company",
      projectType: "Project type",
      budget: "Budget",
      detailsHeading: "Details",
      truncatedMarker: "… [text truncated, continue in Telegram]",
    },
    errors: {
      requiredName: "Please enter your name",
      invalidEmail: "Looks like the email is malformed",
      requiredDetails: "Please describe the task in a few sentences",
      detailsTooShort: "At least 30 characters — otherwise I can't tell what's needed",
    },
  },
  privacy: {
    title: "Privacy policy",
    paragraphs: [
      "The operator of alexanderlapygin.com is Alexander Lapygin. For inquiries about personal-data processing, use the email shown in the site footer.",
      "The site does not process personal data on its server. The contact form uses a Telegram deeplink: clicking «Open in Telegram» builds a URL in the visitor's browser and opens the visitor's Telegram client with a draft message. Form fields are not sent to the site's server. The visitor sends the message from their Telegram client themselves; its handling is governed by the visitor's agreement with Telegram.",
      "The hosting provider (Beget, Russian Federation) keeps standard HTTP logs: IP address, User-Agent, requested URL. Retention is governed by the provider's policy.",
      "No third-party analytics counters, advertising scripts, or cookie-consent banners are present. The browser's localStorage may store the theme preference (technical functionality, no consent required).",
      "When a visitor reaches out via Telegram or email, the author handles the messages as ordinary business correspondence: stored in Telegram and the author's mailbox per those services' policies; retention — up to 12 months from the inquiry or until the engagement concludes.",
      "Requests to clarify, restrict, delete, or port personal data should be sent to the author's email shown in the footer. Response time — no more than 30 days (152-FZ).",
      "The date of the last policy update matches the date of the last commit to the site's git repository.",
    ],
  },
  notFound: {
    title: "Page not found",
    body:
      "The link may be outdated, or the URL has a typo. Try one of these:",
    home: "Home",
    projects: "All projects",
    blog: "Blog",
  },
  empty: {
    blog: "Posts are coming soon.",
    projects: "Projects are coming soon.",
    solutions: "Solutions are coming soon.",
  },
};
