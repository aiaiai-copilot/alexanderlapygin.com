export type Locale = "ru" | "en";

export const LOCALES: readonly Locale[] = ["ru", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ru";

export interface Dictionary {
  meta: {
    siteName: string;
    siteDescription: string;
    siteAuthor: string;
  };
  rss: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    about: string;
    projects: string;
    solutions: string;
    blog: string;
    contact: string;
    faq: string;
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
    rss: string;
    copyright: (year: number) => string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    sdd: {
      title: string;
      description: string;
    };
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
    subtitle: string;
    expertiseTitle: string;
    expertiseSubtitle: string;
    expertise: { group: string; items: string[] }[];
    timelineTitle: string;
    timeline: {
      period: string;
      role: string;
      company?: string;
      summary?: string;
      achievements: string[];
    }[];
    educationTitle: string;
    education: { period?: string; line: string }[];
    cta: string;
  };
  projects: {
    title: string;
    clientHeading: string;
    personalHeading: string;
    saasHeading: string;
    comingSoon: string;
    open: string;
    featuresHeading: string;
    codeLink: string;
    demoLink: string;
    siteLink: string;
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
    responseHint: string;
    primaryCta: string;
    emailAriaLabel: string;
    githubAriaLabel: string;
  };
  cta: {
    contact: string;
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
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
