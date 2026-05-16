export type Locale = "ru" | "en";

export const LOCALES: readonly Locale[] = ["ru", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ru";

export interface Dictionary {
  meta: {
    siteName: string;
    siteDescription: string;
    siteAuthor: string;
  };
  nav: {
    home: string;
    about: string;
    projects: string;
    solutions: string;
    blog: string;
    contact: string;
    openMenu: string;
    closeMenu: string;
  };
  toggles: {
    themeToToDark: string;
    themeToToLight: string;
    langSwitchTo: string;
    langSwitchLabel: string;
  };
  footer: {
    tagline: string;
    servicesHeading: string;
    services: string[];
    contactsHeading: string;
    emailAriaLabel: string;
    telegramAriaLabel: string;
    githubAriaLabel: string;
    privacy: string;
    rss: string;
    copyright: (year: number) => string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    philosophyTitle: string;
    philosophyBody: string;
    advantagesTitle: string;
    advantages: { title: string; body: string }[];
    featuredProjectsTitle: string;
    featuredProjectsLink: string;
    latestPostsTitle: string;
    latestPostsLink: string;
    cta: string;
  };
  about: {
    title: string;
    approachTitle: string;
    approachBody: string[];
    expertiseTitle: string;
    expertise: { group: string; items: string[] }[];
    timelineTitle: string;
    timeline: {
      period: string;
      role: string;
      summary: string;
      achievements: string[];
    }[];
    educationTitle: string;
    education: { period: string; line: string }[];
    cta: string;
  };
  projects: {
    title: string;
    subtitle: string;
    clientHeading: string;
    personalHeading: string;
    saasHeading: string;
    comingSoon: string;
    repoLink: string;
    backLink: string;
    open: string;
    code: string;
  };
  solutions: {
    title: string;
    subtitle: string;
    ctaHeading: string;
    cta: string;
  };
  blog: {
    title: string;
    rssLabel: string;
    featuredHeading: string;
    allHeading: string;
    readMore: string;
    minutesShort: string;
    backLink: string;
    relatedHeading: string;
    aboutAuthorHeading: string;
    tocTitle: string;
    empty: string;
  };
  contact: {
    title: string;
    subtitle: string;
    fields: {
      name: string;
      email: string;
      company: string;
      projectType: string;
      budget: string;
      details: string;
      submit: string;
      submitOpened: string;
    };
    placeholders: {
      name: string;
      email: string;
      company: string;
      details: string;
      pickOne: string;
    };
    projectTypes: string[];
    budgets: string[];
    asideEmailHeading: string;
    asideTelegramHeading: string;
    asideStepsHeading: string;
    asideSteps: string[];
    asideFaqHeading: string;
    asideFaq: { q: string; a: string }[];
    charCounter: (used: number, max: number) => string;
    charCounterWithMin: (used: number, max: number, min: number) => string;
    submitDisabledHint: string;
    truncatedWarning: string;
    infoNoticeTelegram: string;
    afterClick: {
      heading: string;
      hint: string;
      emailLabel: string;
      telegramLabel: string;
    };
    noJs: {
      heading: string;
      body: string;
      telegramButton: string;
      mailtoButton: string;
    };
    prefill: {
      name: string;
      email: string;
      company: string;
      projectType: string;
      budget: string;
      detailsHeading: string;
      truncatedMarker: string;
    };
    errors: {
      requiredName: string;
      invalidEmail: string;
      requiredDetails: string;
      detailsTooShort: string;
    };
  };
  privacy: {
    title: string;
    paragraphs: string[];
  };
  notFound: {
    title: string;
    body: string;
    home: string;
    projects: string;
    blog: string;
  };
  empty: {
    blog: string;
    projects: string;
    solutions: string;
  };
}
