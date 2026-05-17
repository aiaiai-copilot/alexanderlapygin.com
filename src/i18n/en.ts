import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    siteName: "Alexander Lapygin",
    siteDescription:
      "Independent web developer and technical writer. Partner-style engagement, transparency, full project ownership for the client.",
    siteAuthor: "Alexander Lapygin",
  },
  rss: {
    title: "Blog — Alexander Lapygin",
    description: "Notes on independent development, infrastructure, and AI tooling.",
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
    heroTitle: "Alexander Lapygin",
    heroSubtitle: "Web Application Development",
    heroTagline:
      "Sustainable code. Clear architecture.\nDocumentation that works — for people and tools",
    sdd: {
      title: "AI- and Spec-Driven Development",
      description:
        "At the core of every development stage lies a detailed specification — a source for AI and a guide for humans. This guarantees implementation accuracy, relevance, and completeness of documentation at all stages of the product lifecycle.",
    },
    advantagesTitle: "What you get",
    advantages: [
      {
        title: "Technical Partnership",
        body: "Full development cycle support: from requirements analysis and architecture design to writing code and server configuration.",
      },
      {
        title: "Transparency",
        body: "Real-time progress: regular demos, clear reports, no 'black boxes'.",
      },
      {
        title: "No Vendor Lock-in",
        body: "No dependency on a single developer. You receive fully transferable code and infrastructure that you own 100%.",
      },
      {
        title: "AI-ready Architecture",
        body: "Documentation, architecture, and prompts are optimized for easy onboarding of new team members and rapid project development with AI tools.",
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
      "Full-stack developer, expert in spec-driven and AI-driven development. Build software products from scratch. Consult on AI- and Spec-Driven Development.",
      "Modern AI tools let me speed up without losing quality. Any team or AI assistant can continue development from any point.",
      "If a problem isn't mine — I'll say so and recommend the right people.",
    ],
    expertiseTitle: "Technical expertise",
    expertise: [
      {
        group: "Frontend",
        items: ["TypeScript", "JavaScript", "React", "etc"],
      },
      {
        group: "Backend",
        items: ["Node.js", "TypeScript", "Java", "PostgreSQL", "Supabase", "Redis", "etc"],
      },
      {
        group: "Architecture",
        items: ["Clean architecture", "Feature-Sliced Design", "Serverless", "etc"],
      },
      {
        group: "Development",
        items: [
          "AI-Driven Development",
          "Spec-Driven Development",
          "Contract-First Approach",
          "Test-Driven Development",
          "Git",
          "Docker",
          "CI/CD",
          "Documentation",
          "Integration with the LLM API",
          "AI Tools:",
          "  • Claude Code",
          "  • Antigravity",
          "  • Lovable",
          "  • etc",
        ],
      },
    ],
    timelineTitle: "Professional Experience",
    timeline: [
      {
        period: "2025 — Present",
        role: "Full-stack Developer, AI- & Spec-Driven Development Expert",
        company: "Self Employed",
        achievements: [
          "Designing and implementing web applications using AI- & Spec-Driven Development",
          "Integrating AI tools into the development workflow to enhance speed and quality",
          "Continuous research into emerging AI tools and AI-assisted development methodologies",
        ],
      },
      {
        period: "2000 — 2025",
        role: "Full-stack Developer / Team Lead",
        company: "Vested Development Inc.(VDI) / Rosbank / T-Bank",
        achievements: [
          "Architected and implemented a corporate Fullstack framework adopted across the IT department",
          "End-to-end development of the client-side for a mission-critical banking application",
          "Led development teams and mentored junior engineers",
        ],
      },
    ],
    educationTitle: "Education",
    education: [
      { line: "MEPhI — Applied Mathematics" },
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
    asideGithubHeading: "GitHub",
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
