import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alexanderlapygin.com',
  trailingSlash: 'never',
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'ru',
        locales: { ru: 'ru-RU', en: 'en-US' },
      },
    }),
  ],
});
