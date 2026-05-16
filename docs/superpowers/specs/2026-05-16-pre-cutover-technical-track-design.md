# Design: pre-cutover technical track

**Date:** 2026-05-16
**Status:** Approved (юзер подтвердил все 8 секций брейншторма)
**Scope:** «Технический трек» из HANDOFF.md (2026-05-16) — закрыть defects, обнаруженные cutover pre-check'ом и **не** связанные с контентом. Контентный трек (HomePage placeholders, EN-локализация, `/portfolio/*`+`/showcase/*` legacy URL'ы) и сам cutover stage→prod — отдельные итерации.

## Контекст и мотивация

В сессии 2026-05-16 проведён pre-check готовности stage→prod cutover'а по правилу `[[check-publish-readiness-before-cutover]]`. Pre-check читал HEAD напрямую (stage устарел — релиз `stage-releases/20260515T233747Z` pre-`d4b70b8`). Вывод: cutover **не готов**, скоуп остатка разделён на:

1. Технический трек (этот документ) — мелкие SEO/branding/cleanup defects, артефакт каждого виден глазами или curl'ом, требуемая работа измерима парой коммитов.
2. Контентный трек — большая многосессионная работа (HomePage `[1,2,3].map(...)` полуфабрикат, EN-каталоги почти пусты, судьба legacy URL'ов).
3. Сам cutover после треков 1 и 2.

Цели технического трека:
- Закрыть все технические defects из pre-check'а 2026-05-16 (HANDOFF.md §«Что осталось недоделанным» п.1).
- Каждый коммит — атомарно reverteable.
- После трека: `npm run check` 0/0, `npm run build` ok, и эндпойнты из pre-check'а отдают 200 на stage.

Не-цели:
- Контентные правки (HomePage, EN-локализация, `/portfolio/*`+`/showcase/*`) — это контентный трек.
- Сам cutover stage→prod — отдельная итерация после контентного трека.
- Defense-in-depth (bind SBP-backend'ов на 127.0.0.1) — HANDOFF.md п.4, отдельно.
- Per-page og:images, CI/CD, выпил CF Pages — вне MVP-scope.

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| RSS: реализовать vs убрать ссылки | **Реализовать** `@astrojs/rss` | Текущая разметка уже подразумевает фид; обвязка минимальна; полезно для подписчиков блога |
| og:image strategy | **Один статический дефолт** `public/og.png` 1200×630 | og:title/og:description уже локализованы и несут основной контекст; per-locale/per-page — over-engineering на текущем масштабе |
| favicon + og.png pipeline | **Программная генерация из SVG** | Контроль над брендингом, исходник в репо (`src/assets/branding/*.svg`), результат — статика в `public/` |
| Растеризатор | **`@resvg/resvg-js`** (devDep) | Делает ровно одну нужную операцию (SVG→PNG); меньше footprint и без libvips против `sharp`; canonical foundation для возможной будущей satori-генерации |
| ICO writer | **Inline в скрипте**, без `png-to-ico` | ICO — тривиальный binary container; ~30 строк против внешней зависимости |
| Когда запускать pipeline | **Вручную** (`node src/scripts/build-branding-assets.mjs`), результат коммитится | Branding ассеты меняются раз в год — не тащить resvg в каждый билд |
| robots.txt | **Минимальный** allow-all + Sitemap pointer | Не вводим политику по AI-ботам в скоупе технического трека |
| Twitter Card | **`summary_large_image`** | Без него og:image не используется при шеринге в X — fallback `summary` без картинки |
| RSS discovery | **`<link rel="alternate" type="application/rss+xml">`** в `BaseLayout` per-locale | Стандарт для RSS-ридеров; копеечная стоимость |
| Коммитная стратегия | **4 атомарных коммита** | Каждый — независимо reverteable; HANDOFF говорил «пара», но логические границы дают 4 |

## Архитектура

### Файлы в репо (после трека)

```
package.json                                     # +@astrojs/sitemap, +@astrojs/rss, +@resvg/resvg-js (devDep)
astro.config.mjs                                 # +sitemap integration
public/
├── robots.txt                                   # НОВЫЙ
├── og.png                                       # НОВЫЙ (generated, 1200×630)
├── favicon.svg                                  # НОВЫЙ (generated copy of source)
├── favicon.ico                                  # НОВЫЙ (generated, 32×32)
└── apple-touch-icon.png                         # НОВЫЙ (generated, 180×180)
src/
├── assets/branding/                             # НОВАЯ директория
│   ├── og.svg                                   # НОВЫЙ (source, hand-written)
│   └── favicon.svg                              # НОВЫЙ (source, hand-written)
├── scripts/
│   └── build-branding-assets.mjs                # НОВЫЙ (resvg + inline ICO writer)
├── pages/
│   ├── blog/
│   │   └── rss.xml.ts                           # НОВЫЙ (RU feed)
│   └── en/blog/
│       └── rss.xml.ts                           # НОВЫЙ (EN feed)
├── components/
│   └── SolutionsPage.astro                      # MODIFIED (строка 16: «аналитика» убрана)
├── layouts/
│   └── BaseLayout.astro                         # MODIFIED (+og:image, +favicon, +rss alternate, +twitter:card)
└── i18n/
    └── <dict files>                             # MODIFIED (+rss.title, +rss.description per locale)
```

### Build artifacts (после `npm run build`)

```
dist/
├── sitemap-index.xml                            # /sitemap-index.xml
├── sitemap-0.xml                                # /sitemap-0.xml
├── robots.txt                                   # /robots.txt (copy of public/)
├── blog/rss.xml                                 # /blog/rss.xml (RU feed)
├── en/blog/rss.xml                              # /en/blog/rss.xml (EN feed)
├── og.png                                       # /og.png (copy of public/)
├── favicon.svg                                  # /favicon.svg
├── favicon.ico                                  # /favicon.ico
└── apple-touch-icon.png                         # /apple-touch-icon.png
```

## Секция 1 — Sitemap (`@astrojs/sitemap`)

**Установка:**
- `npm install @astrojs/sitemap` (в `dependencies`, конвенция Astro integration'ов).

**Конфиг — `astro.config.mjs`:**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alexanderlapygin.com',
  trailingSlash: 'never',
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
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
```

**Результат:** на build генерится `dist/sitemap-index.xml` (всегда index, даже при единственном sitemap-N.xml) и `dist/sitemap-0.xml`. Integration сам сканит маршруты — в коде BaseLayout/где-либо ещё ничего трогать не надо.

## Секция 2 — robots.txt

**Создать `public/robots.txt`:**

```
User-agent: *
Allow: /

Sitemap: https://alexanderlapygin.com/sitemap-index.xml
```

Хост в Sitemap-ссылке захардкожен — он же в `astro.config.mjs.site`. `public/` копируется в `dist/` как есть, URL `/robots.txt` начинает отдаваться.

## Секция 3 — RSS (`@astrojs/rss`)

**Установка:**
- `npm install @astrojs/rss` (в `dependencies`).

**Два endpoint'а:**

`src/pages/blog/rss.xml.ts` (RU):

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { t } from '~/i18n';
import { pageSlug } from '~/lib/slug';

export async function GET(context: { site?: URL }) {
  const dict = t('ru');
  const posts = (
    await getCollection('posts', (e) => e.data.lang === 'ru' && !e.data.draft)
  ).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    title: dict.rss.title,
    description: dict.rss.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${pageSlug(post.id)}`,
    })),
  });
}
```

`src/pages/en/blog/rss.xml.ts` (EN): аналогично с `'en'` и `t('en')`, link `/en/blog/${pageSlug(post.id)}`.

**i18n:** в `src/i18n/ru.ts`, `src/i18n/en.ts` и в типе из `src/i18n/types.ts` добавить ключ:

```ts
rss: {
  title: '...',         // RU: «Блог — Александр Лапыгин», EN: «Blog — Alexander Lapygin»
  description: '...',   // RU/EN короткое описание фида
}
```

**BaseLayout.astro** — добавить discovery `<link>` в `<head>`, в блок `<link rel="alternate" hreflang=...>` (логически рядом с другими `alternate`):

```astro
<link
  rel="alternate"
  type="application/rss+xml"
  title={`${dict.rss.title}`}
  href={new URL(localizedPath(locale, '/blog/rss.xml'), Astro.site).toString()}
/>
```

**Footer.astro:93 и BlogCatalog.astro:41 — без изменений.** Ссылки уже идут через `localizedPath(locale, '/blog/rss.xml')` и заработают сами.

## Секция 4 — og:image (default static)

**Источник:** `src/assets/branding/og.svg` — нарисовать руками. Композиция:
- Фон: solid background в брендовой палитре сайта (значения из `src/styles/global.css` — `--color-bg-elev` либо `--color-bg`).
- Центральный элемент: круг с инициалами «АЛ» (как в `BlogCatalog.astro:30-34`).
- Текст: «Александр Лапыгин» под кругом, мелкий subtitle (тэг — например, «решения и публикации»).
- Размеры canvas: 1200×630 viewBox.

**BaseLayout.astro** — добавить в `<head>` в блок `<meta property="og:*">` (после `og:locale:alternate`):

```astro
<meta property="og:image" content={new URL("/og.png", Astro.site).toString()} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={dict.meta.siteAuthor} />
<meta name="twitter:card" content="summary_large_image" />
```

## Секция 5 — favicon

**Источник:** `src/assets/branding/favicon.svg` — нарисовать руками. Минимализм:
- Тот же круг + «АЛ», но без длинного текста.
- Должен оставаться узнаваемым при ресайзе до 16×16.
- viewBox 32×32 или 64×64.

**`src/scripts/build-branding-assets.mjs`** — единый Node-скрипт:

```
1. Прочитать src/assets/branding/og.svg → resvg → public/og.png (1200×630).
2. Прочитать src/assets/branding/favicon.svg →
   a. Скопировать в public/favicon.svg (для совр. браузеров).
   b. resvg → 32×32 PNG → inline ICO writer → public/favicon.ico.
   c. resvg → 180×180 PNG → public/apple-touch-icon.png.
3. console.log готовности.
```

**Inline ICO writer** (схема, ~30 строк):

```
ICONDIR (6 байт): reserved=0, type=1 (icon), count=1
ICONDIRENTRY (16 байт): width=32, height=32, colors=0, reserved=0, planes=1, bpp=32, size=<PNG size>, offset=22
PNG bytes (raw, как отдали resvg)
```

Современные системы (Windows ≥ Vista, все браузеры) поддерживают PNG-encoded ICO. Не нужно конвертировать в BMP/тащить `png-to-ico`.

**Запуск:** вручную, по необходимости (`node src/scripts/build-branding-assets.mjs`). НЕ интегрировано в `npm run build`. Результат коммитится в `public/`.

**BaseLayout.astro** — добавить в `<head>` рядом с `<link rel="canonical">` (до блока `<meta property="og:*">`):

```astro
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

**DevDep:** `npm install --save-dev @resvg/resvg-js`.

## Секция 6 — Cleanup строки про аналитику

**`src/components/SolutionsPage.astro` строка 16:**

Было:
```
"Astro + статика + одна SSR-точка для формы обращения. CSP, аналитика, темы, локализация.",
```

Станет:
```
"Astro + статика + одна SSR-точка для формы обращения. CSP, темы, локализация.",
```

Соответствует `[[d4b70b8]]` / decisions §5.4 (отказ от аналитики — ст. 22 152-ФЗ).

## Секция 7 — Verification & deploy

После всех правок:

1. **`npm run check`** — 0/0 (новые ts-файлы RSS-endpoints, новые поля в i18n dict).
2. **`npm run build`** — успешный билд; в `dist/` появляются:
   - `sitemap-index.xml`, `sitemap-0.xml`
   - `blog/rss.xml`, `en/blog/rss.xml`
   - `robots.txt` (copy of `public/`)
   - `og.png`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` (copies of `public/`)
3. **Redeploy stage** через тот же механизм, что использовался для текущего релиза `stage-releases/20260515T233747Z` (точный механизм см. в spec `2026-05-16-stage-subdomain-design.md` — путь `/var/www/alexanderlapygin.com/stage-releases/<TS>/` + atomic switch `stage-html` симлинка).
4. **Pre-check эндпойнтов на stage:**

```bash
for url in \
  https://stage.alexanderlapygin.com/sitemap-index.xml \
  https://stage.alexanderlapygin.com/sitemap-0.xml \
  https://stage.alexanderlapygin.com/robots.txt \
  https://stage.alexanderlapygin.com/blog/rss.xml \
  https://stage.alexanderlapygin.com/en/blog/rss.xml \
  https://stage.alexanderlapygin.com/og.png \
  https://stage.alexanderlapygin.com/favicon.svg \
  https://stage.alexanderlapygin.com/favicon.ico \
  https://stage.alexanderlapygin.com/apple-touch-icon.png; do
  echo "=== $url"
  curl -sSI "$url" | head -1
done
```

   Ожидание: все `HTTP/2 200`.

5. **View-source `https://stage.alexanderlapygin.com/`:**
   - `<meta property="og:image">`
   - `<meta name="twitter:card" content="summary_large_image">`
   - `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
   - `<link rel="alternate" type="application/rss+xml" ...>`

6. **Solutions-страница** — нет слова «аналитика».

## Секция 8 — Коммитная стратегия

```
1. feat(seo): add sitemap integration and robots.txt
   - astro.config.mjs: + sitemap integration
   - public/robots.txt: NEW
   - package.json: + @astrojs/sitemap

2. feat(blog): generate RSS feeds per locale
   - src/pages/blog/rss.xml.ts: NEW
   - src/pages/en/blog/rss.xml.ts: NEW
   - src/i18n/<dicts>: + rss.title, + rss.description
   - src/layouts/BaseLayout.astro: + <link rel="alternate" type="application/rss+xml">
   - package.json: + @astrojs/rss

3. feat(branding): add og:image, favicon, apple-touch-icon
   - src/assets/branding/og.svg: NEW (source)
   - src/assets/branding/favicon.svg: NEW (source)
   - src/scripts/build-branding-assets.mjs: NEW (resvg + inline ICO writer)
   - public/og.png: NEW (generated)
   - public/favicon.svg: NEW (generated copy)
   - public/favicon.ico: NEW (generated)
   - public/apple-touch-icon.png: NEW (generated)
   - src/layouts/BaseLayout.astro: + og:image meta, + favicon links, + twitter:card
   - package.json: + @resvg/resvg-js (devDep)

4. fix(solutions): remove "аналитика" from RU minimal-backend card
   - src/components/SolutionsPage.astro:16
```

Каждый коммит независимо reverteable; ни один не ломает `npm run check`/`npm run build` по отдельности.

## Открытые вопросы

Нет. Все архитектурные развилки закрыты в брейншторме.

## Out of scope

- Контентный трек pre-cutover (HomePage `[1,2,3].map(...)`, EN-локализация, `/portfolio/*`+`/showcase/*`).
- Сам cutover stage→prod.
- Defense-in-depth: bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` (HANDOFF.md п.4).
- Per-page og:image автогенерация (satori + resvg).
- CI/CD (push в main → stage deploy).
- Выпил CF Pages-прототипа.
- Cleanup `.wrangler/`.
