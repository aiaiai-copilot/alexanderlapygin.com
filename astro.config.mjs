import { defineConfig } from 'astro/config';

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
});
