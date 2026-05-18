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
    faq: "FAQ",
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
    rss: "RSS",
    copyright: (year) => `© ${year} Alexander Lapygin`,
  },
  home: {
    heroTitle: "Alexander Lapygin",
    heroSubtitle: "Web Application Development",
    heroTagline:
      "Sustainable code. Clear architecture.\nDocumentation that works — for people and tools",
    sdd: {
      title: "AI- and Spec‑Driven Development",
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
    title: "About Me",
    subtitle:
      "Web applications built to last — with explicit structure, thorough documentation, and code that's good maintainable by developers and AI alike",
    expertiseTitle: "Technical Expertise",
    expertiseSubtitle: "Web Application Development",
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
          "Spec‑Driven Development",
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
    clientHeading: "Client projects",
    personalHeading: "Personal projects",
    comingSoon: "Coming Soon",
    open: "Open",
    featuresHeading: "Key features",
    codeLink: "Code",
    siteLink: "Site",
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
    title: "Contacts",
    responseHint: "I respond within 24 hours. No autoresponders.",
    primaryCta: "Message me on Telegram",
    emailAriaLabel: "Send email",
    githubAriaLabel: "Open GitHub",
  },
  cta: {
    contact: "Get in touch",
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "What is needed to start?",
        a:
          "An idea or a general description of the task is enough. I help with formalizing requirements, drafting technical specifications, and designing the solution.",
      },
      {
        q: "What does the client get?",
        a:
          "A completely self-sufficient project: source code, deployed infrastructure, and comprehensive documentation adapted for LLM (via SDD). An asset that the client owns 100%.",
      },
      {
        q: "Do you work with existing code (improvements, bug fixes)?",
        a:
          "My specialization is building new projects and autonomous microservices from scratch. This guarantees maximum speed and quality. Support for legacy code is usually not considered unless it involves a complete rewrite.",
      },
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
