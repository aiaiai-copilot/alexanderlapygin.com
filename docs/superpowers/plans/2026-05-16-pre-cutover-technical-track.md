# Pre-cutover Technical Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть технические defects из cutover pre-check'а 2026-05-16: sitemap, robots.txt, RSS per-locale, og:image, favicon/apple-touch-icon, cleanup строки про «аналитику» в SolutionsPage.

**Architecture:** Add two Astro integrations (`@astrojs/sitemap`, `@astrojs/rss`) с минимальной конфигурацией. Branding assets — статические PNG/ICO, сгенерированные one-shot Node-скриптом из SVG-исходников (растеризация через `@resvg/resvg-js`, ICO-контейнер inline). Всё новое подключается через `BaseLayout.astro` (мета-теги, link'и). После — redeploy stage и smoke.

**Tech Stack:** Astro 6.3.3, TypeScript, `@astrojs/sitemap`, `@astrojs/rss`, `@resvg/resvg-js` (devDep).

**Spec reference:** `docs/superpowers/specs/2026-05-16-pre-cutover-technical-track-design.md` (commit `8a3df13`).

---

## Verification approach

В проекте нет test runner'а (`package.json` имеет только `astro check` и `astro build`). Установка vitest/etc. для этого скоупа — over-engineering: добавляемые артефакты (config, статические файлы, endpoints) проверяются:
- `npm run check` — типы валидны (особенно важно для RSS-endpoints и i18n).
- `npm run build` — успешный билд + физическое наличие генерируемых файлов в `dist/`.
- `grep` в сгенерированном HTML — наличие мета-тегов.
- `curl` против `npm run preview` — endpoints отдают валидный контент.

Этот подход заменяет «failing test → make it pass» паттерн TDD на «build → verify artifact present».

---

## Task 1: Sitemap + robots.txt

**Files:**
- Modify: `package.json` (add `@astrojs/sitemap` to `dependencies`)
- Modify: `astro.config.mjs` (lines 1-13 — full rewrite)
- Create: `public/robots.txt`

- [ ] **Step 1.1: Install `@astrojs/sitemap`**

```bash
npm install @astrojs/sitemap
```

Expected: `package.json` updated, `package-lock.json` updated, integration installed.

- [ ] **Step 1.2: Rewrite `astro.config.mjs`**

Replace the entire file with:

```js
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
```

- [ ] **Step 1.3: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://alexanderlapygin.com/sitemap-index.xml
```

(File ends with single trailing newline after `sitemap-index.xml` line.)

- [ ] **Step 1.4: Run `npm run check`**

```bash
npm run check
```

Expected: `0 errors, 0 warnings`. If new astro:assets-related warnings appear from the sitemap integration, that's a problem — investigate before continuing.

- [ ] **Step 1.5: Run `npm run build`**

```bash
npm run build
```

Expected: build succeeds; in the output you'll see `[sitemap] sitemap-index.xml created` (or similar from integration).

- [ ] **Step 1.6: Verify artifacts in `dist/`**

```bash
ls -la dist/sitemap-index.xml dist/sitemap-0.xml dist/robots.txt
```

Expected: all three files exist. `robots.txt` is byte-identical to `public/robots.txt`. `sitemap-index.xml` references `sitemap-0.xml`.

Also verify content quickly:

```bash
head -c 200 dist/sitemap-index.xml
cat dist/robots.txt
```

Expected: sitemap-index.xml starts with `<?xml version="1.0" encoding="UTF-8"?>` and contains `<sitemap>` entries. robots.txt matches what was written.

- [ ] **Step 1.7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs public/robots.txt
git commit -m "feat(seo): add sitemap integration and robots.txt

- @astrojs/sitemap with per-locale i18n config (ru-RU, en-US)
- public/robots.txt with Sitemap pointer

Closes part of technical-track pre-cutover (HANDOFF 2026-05-16)."
```

---

## Task 2: RSS feeds per locale + discovery link

**Files:**
- Modify: `package.json` (add `@astrojs/rss` to `dependencies`)
- Modify: `src/i18n/types.ts` (add `rss` block to `Dictionary` interface)
- Modify: `src/i18n/ru.ts` (add `rss` object)
- Modify: `src/i18n/en.ts` (add `rss` object)
- Create: `src/pages/blog/rss.xml.ts`
- Create: `src/pages/en/blog/rss.xml.ts`
- Modify: `src/layouts/BaseLayout.astro` (add `<link rel="alternate" type="application/rss+xml">` in `<head>`)

- [ ] **Step 2.1: Install `@astrojs/rss`**

```bash
npm install @astrojs/rss
```

- [ ] **Step 2.2: Add `rss` to `Dictionary` type**

Edit `src/i18n/types.ts`. Find the closing `}` of the `meta` block (line 11) and add new top-level `rss` block. After existing `meta` declaration, insert:

```ts
  rss: {
    title: string;
    description: string;
  };
```

The exact location: between the `meta` block (ending line 11) and the `nav` block (starting line 12). So the file becomes:

```ts
// ...existing meta block...
  rss: {
    title: string;
    description: string;
  };
  nav: {
// ...rest unchanged...
```

- [ ] **Step 2.3: Add `rss` block to `src/i18n/ru.ts`**

Edit `src/i18n/ru.ts`. Insert this block between the `meta` object (ending line 9) and the `nav` object (starting line 10):

```ts
  rss: {
    title: "Блог — Александр Лапыгин",
    description: "Записи о независимой разработке, инфраструктуре и AI-инструментах.",
  },
```

- [ ] **Step 2.4: Add `rss` block to `src/i18n/en.ts`**

Edit `src/i18n/en.ts`. Insert this block between the `meta` object (ending line 9) and the `nav` object:

```ts
  rss: {
    title: "Blog — Alexander Lapygin",
    description: "Notes on independent development, infrastructure, and AI tooling.",
  },
```

- [ ] **Step 2.5: Create RU RSS endpoint**

Create `src/pages/blog/rss.xml.ts`:

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { t } from '~/i18n';
import { pageSlug } from '~/lib/slug';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const dict = t('ru');
  const posts = (
    await getCollection('posts', (entry) => entry.data.lang === 'ru' && !entry.data.draft)
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

- [ ] **Step 2.6: Create EN RSS endpoint**

Create `src/pages/en/blog/rss.xml.ts`:

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { t } from '~/i18n';
import { pageSlug } from '~/lib/slug';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const dict = t('en');
  const posts = (
    await getCollection('posts', (entry) => entry.data.lang === 'en' && !entry.data.draft)
  ).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    title: dict.rss.title,
    description: dict.rss.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/en/blog/${pageSlug(post.id)}`,
    })),
  });
}
```

- [ ] **Step 2.7: Add `<link rel="alternate" type="application/rss+xml">` to BaseLayout**

Edit `src/layouts/BaseLayout.astro`. Find the existing `<link rel="alternate" hreflang="x-default" ...>` line (currently line 51) and add immediately after it:

```astro
    <link
      rel="alternate"
      type="application/rss+xml"
      title={dict.rss.title}
      href={new URL(localizedPath(locale, "/blog/rss.xml"), Astro.site ?? "https://alexanderlapygin.com").toString()}
    />
```

Also: `localizedPath` is already imported at the top (line 5-12 imports block). No new import needed.

- [ ] **Step 2.8: Run `npm run check`**

```bash
npm run check
```

Expected: `0 errors, 0 warnings`. New `rss.xml.ts` files and `dict.rss.*` accesses must type-check.

If you see `Property 'rss' does not exist on type 'Dictionary'` — Step 2.2 (types.ts edit) wasn't done correctly.

- [ ] **Step 2.9: Run `npm run build`**

```bash
npm run build
```

Expected: build succeeds. Output mentions `/blog/rss.xml` and `/en/blog/rss.xml` among generated routes.

- [ ] **Step 2.10: Verify RSS artifacts**

```bash
ls -la dist/blog/rss.xml dist/en/blog/rss.xml
head -c 400 dist/blog/rss.xml
```

Expected: both files exist. RU feed starts with `<?xml version="1.0" encoding="UTF-8"?>` and contains `<channel><title>Блог — Александр Лапыгин</title>`, items (currently 2 RU posts).

- [ ] **Step 2.11: Verify discovery link in HTML**

```bash
grep -o 'rel="alternate" type="application/rss+xml"[^>]*' dist/index.html
grep -o 'rel="alternate" type="application/rss+xml"[^>]*' dist/en/index.html
```

Expected: both produce a match. RU page references `/blog/rss.xml`; EN references `/en/blog/rss.xml`.

- [ ] **Step 2.12: Commit**

```bash
git add package.json package-lock.json src/i18n/types.ts src/i18n/ru.ts src/i18n/en.ts src/pages/blog/rss.xml.ts src/pages/en/blog/rss.xml.ts src/layouts/BaseLayout.astro
git commit -m "feat(blog): generate RSS feeds per locale

- @astrojs/rss + two endpoints (/blog/rss.xml, /en/blog/rss.xml)
- New i18n key rss.{title,description} in ru/en dicts
- <link rel=\"alternate\" type=\"application/rss+xml\"> in BaseLayout
  per-locale (RSS reader discovery)

Existing footer.rss and blog.rssLabel links (Footer:93, BlogCatalog:41)
now work — previously 404. Closes part of technical-track pre-cutover."
```

---

## Task 3: Branding assets (og:image, favicon, apple-touch-icon)

**Files:**
- Modify: `package.json` (add `@resvg/resvg-js` to `devDependencies`)
- Create: `src/assets/branding/og.svg`
- Create: `src/assets/branding/favicon.svg`
- Create: `src/scripts/build-branding-assets.mjs`
- Create: `public/og.png` (generated)
- Create: `public/favicon.svg` (generated copy)
- Create: `public/favicon.ico` (generated)
- Create: `public/apple-touch-icon.png` (generated)
- Modify: `src/layouts/BaseLayout.astro` (add og:image meta block, favicon links, twitter:card)

- [ ] **Step 3.1: Install `@resvg/resvg-js`**

```bash
npm install --save-dev @resvg/resvg-js
```

Expected: package + platform-specific binary (e.g. `@resvg/resvg-js-darwin-arm64`) installed.

- [ ] **Step 3.2: Create `src/assets/branding/` directory and write og.svg**

```bash
mkdir -p src/assets/branding
```

Create `src/assets/branding/og.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0b0e"/>
  <circle cx="600" cy="260" r="120" fill="#131318" stroke="#2a2a32" stroke-width="2"/>
  <text x="600" y="260" text-anchor="middle" dominant-baseline="central"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="72" font-weight="600" fill="#f4f4f5">АЛ</text>
  <text x="600" y="450" text-anchor="middle" dominant-baseline="central"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="56" font-weight="600" fill="#f4f4f5">Александр Лапыгин</text>
  <text x="600" y="520" text-anchor="middle" dominant-baseline="central"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="28" font-weight="400" fill="#a1a1aa">Независимый разработчик</text>
</svg>
```

(Colors мэтчат `[data-theme="dark"]` palette из `src/styles/global.css` — site всё равно открывается в dark в большинстве кейсов, и dark og:image выглядит дороже.)

- [ ] **Step 3.3: Write favicon.svg**

Create `src/assets/branding/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#0f766e"/>
  <text x="32" y="32" text-anchor="middle" dominant-baseline="central"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-size="28" font-weight="700" fill="#ffffff">АЛ</text>
</svg>
```

(Single solid teal — accent color из light theme. Узнаваемо при ресайзе до 16×16 — крупный круг + 2 буквы.)

- [ ] **Step 3.4: Create build script**

Create `src/scripts/build-branding-assets.mjs`:

```js
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src', 'assets', 'branding');
const OUT = join(ROOT, 'public');

function rasterize(svgPath, width) {
  const svg = readFileSync(svgPath, 'utf-8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return resvg.render().asPng();
}

// Build a minimal ICO container holding a single PNG-encoded image.
// ICO format reference: https://en.wikipedia.org/wiki/ICO_(file_format)
function pngToIco(pngBuffer, sizePx) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // Reserved, must be 0
  header.writeUInt16LE(1, 2);          // Type: 1 = .ICO
  header.writeUInt16LE(1, 4);          // Image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(sizePx === 256 ? 0 : sizePx, 0); // Width  (0 = 256)
  entry.writeUInt8(sizePx === 256 ? 0 : sizePx, 1); // Height (0 = 256)
  entry.writeUInt8(0, 2);              // Color palette
  entry.writeUInt8(0, 3);              // Reserved
  entry.writeUInt16LE(1, 4);           // Color planes
  entry.writeUInt16LE(32, 6);          // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);  // Image data size
  entry.writeUInt32LE(22, 12);         // Offset to image data (6+16=22)

  return Buffer.concat([header, entry, pngBuffer]);
}

// 1. og.png — 1200×630
console.log('Generating og.png (1200×630)...');
const ogPng = rasterize(join(SRC, 'og.svg'), 1200);
writeFileSync(join(OUT, 'og.png'), ogPng);

// 2. favicon.svg — copy source as-is
console.log('Copying favicon.svg...');
copyFileSync(join(SRC, 'favicon.svg'), join(OUT, 'favicon.svg'));

// 3. favicon.ico — 32×32 PNG-encoded ICO
console.log('Generating favicon.ico (32×32)...');
const faviconPng = rasterize(join(SRC, 'favicon.svg'), 32);
const ico = pngToIco(faviconPng, 32);
writeFileSync(join(OUT, 'favicon.ico'), ico);

// 4. apple-touch-icon.png — 180×180
console.log('Generating apple-touch-icon.png (180×180)...');
const appleTouch = rasterize(join(SRC, 'favicon.svg'), 180);
writeFileSync(join(OUT, 'apple-touch-icon.png'), appleTouch);

console.log('Done. 4 assets written to public/.');
```

- [ ] **Step 3.5: Run the script**

```bash
node src/scripts/build-branding-assets.mjs
```

Expected:
```
Generating og.png (1200×630)...
Copying favicon.svg...
Generating favicon.ico (32×32)...
Generating apple-touch-icon.png (180×180)...
Done. 4 assets written to public/.
```

- [ ] **Step 3.6: Verify generated assets**

```bash
ls -la public/og.png public/favicon.svg public/favicon.ico public/apple-touch-icon.png
file public/og.png public/favicon.ico public/apple-touch-icon.png
```

Expected: 4 files exist. `file` output:
- `public/og.png: PNG image data, 1200 x 630, 8-bit/color RGBA, non-interlaced`
- `public/favicon.ico: MS Windows icon resource - 1 icon, 32x32`
- `public/apple-touch-icon.png: PNG image data, 180 x 180, 8-bit/color RGBA, non-interlaced`

If `favicon.ico` reports anything other than `1 icon, 32x32` — the `pngToIco` writer in Step 3.4 is wrong; re-check Steps 3.4 byte layout.

- [ ] **Step 3.7: Add favicon links + og:image meta + twitter:card to BaseLayout**

Edit `src/layouts/BaseLayout.astro`.

**Insertion 1** — favicon links. Add immediately after `<link rel="canonical" href={canonical} />` (currently line 48) and BEFORE the `<link rel="alternate" hreflang=...>` block:

```astro
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

**Insertion 2** — og:image + twitter:card. Find the existing `<meta property="og:locale:alternate" ... />` line (currently line 58) and add immediately after it:

```astro
    <meta property="og:image" content={new URL("/og.png", Astro.site ?? "https://alexanderlapygin.com").toString()} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={dict.meta.siteAuthor} />
    <meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 3.8: Run `npm run check`**

```bash
npm run check
```

Expected: `0 errors, 0 warnings`.

- [ ] **Step 3.9: Run `npm run build`**

```bash
npm run build
```

Expected: build succeeds. `dist/og.png`, `dist/favicon.svg`, `dist/favicon.ico`, `dist/apple-touch-icon.png` should be copies of `public/*` (Astro copies `public/` verbatim).

- [ ] **Step 3.10: Verify build output**

```bash
ls -la dist/og.png dist/favicon.svg dist/favicon.ico dist/apple-touch-icon.png
grep -o 'property="og:image" content="[^"]*"' dist/index.html | head -1
grep -o 'rel="icon" type="image/svg+xml" href="[^"]*"' dist/index.html | head -1
grep -o 'name="twitter:card"[^>]*' dist/index.html | head -1
```

Expected:
- All 4 files exist in `dist/`.
- `property="og:image" content="https://alexanderlapygin.com/og.png"`
- `rel="icon" type="image/svg+xml" href="/favicon.svg"`
- `name="twitter:card" content="summary_large_image"`

- [ ] **Step 3.11: Visual sanity check (manual, optional)**

If a browser is handy, open the generated files locally:

```bash
open public/og.png
open public/favicon.svg
```

Expected: og.png renders as dark card with «АЛ» in a circle + «Александр Лапыгин» text. favicon.svg renders as teal circle with white «АЛ». If text overflows or layout is broken — adjust SVGs in Steps 3.2-3.3 and re-run Step 3.5.

- [ ] **Step 3.12: Commit**

```bash
git add package.json package-lock.json src/assets/branding/og.svg src/assets/branding/favicon.svg src/scripts/build-branding-assets.mjs public/og.png public/favicon.svg public/favicon.ico public/apple-touch-icon.png src/layouts/BaseLayout.astro
git commit -m "feat(branding): add og:image, favicon, apple-touch-icon

- src/assets/branding/{og,favicon}.svg — SVG sources
- src/scripts/build-branding-assets.mjs — resvg + inline ICO writer
- Generated public/{og.png,favicon.{svg,ico},apple-touch-icon.png}
- BaseLayout: + favicon links, + og:image meta block, + twitter:card

Script runs manually (not in build pipeline) — branding ассеты меняются редко.
Closes part of technical-track pre-cutover."
```

---

## Task 4: Remove «аналитика» from SolutionsPage

**Files:**
- Modify: `src/components/SolutionsPage.astro` (line 16)

- [ ] **Step 4.1: Edit SolutionsPage.astro**

In `src/components/SolutionsPage.astro` line 16, replace:

```
"Astro + статика + одна SSR-точка для формы обращения. CSP, аналитика, темы, локализация.",
```

with:

```
"Astro + статика + одна SSR-точка для формы обращения. CSP, темы, локализация.",
```

- [ ] **Step 4.2: Verify no other occurrences**

```bash
grep -rn "аналитика\|analytics" src/
```

Expected: zero matches in `src/` (модуль аналитики был удалён в `d4b70b8`). Если что-то найдено — это либо в коммите выше пропустили, либо в EN-карточках — рассмотреть отдельно.

- [ ] **Step 4.3: Run `npm run check`**

```bash
npm run check
```

Expected: `0 errors, 0 warnings`.

- [ ] **Step 4.4: Run `npm run build`**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4.5: Verify generated HTML**

```bash
grep -c "аналитика" dist/solutions/index.html
```

Expected: `0`.

- [ ] **Step 4.6: Commit**

```bash
git add src/components/SolutionsPage.astro
git commit -m "fix(solutions): remove \"аналитика\" from RU minimal-backend card

Соответствует решению об отказе от аналитики (d4b70b8, decisions §5.4).
Закрывает последний defect технического трека pre-cutover."
```

---

## Task 5: Redeploy stage + smoke

**Files:** (no code changes — operational only)

Pre-req: Tasks 1-4 commits all landed on `main`, working tree clean, `npm run build` succeeds locally.

- [ ] **Step 5.1: Find current stage deploy mechanism**

```bash
ls deploy/
grep -rn "stage-releases" deploy/ docs/
```

Look for a script or runbook step that walks through stage deploy. If found — follow it. If not — fall back on manual rsync per the design from `docs/superpowers/specs/2026-05-16-stage-subdomain-design.md`.

- [ ] **Step 5.2: Build production artifact locally**

```bash
npm run build
```

Expected: clean build, `dist/` populated.

- [ ] **Step 5.3: Create new stage release on VPS**

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
echo "Release: $TS"
ssh root@84.54.29.190 "mkdir -p /var/www/alexanderlapygin.com/stage-releases/$TS"
rsync -avz --delete dist/ root@84.54.29.190:/var/www/alexanderlapygin.com/stage-releases/$TS/
```

Expected: rsync completes, all files transferred. Note: confirm `$TS` matches between commands by setting it once locally and echoing.

- [ ] **Step 5.4: Atomic switch stage-html symlink**

```bash
ssh root@84.54.29.190 "ln -sfn /var/www/alexanderlapygin.com/stage-releases/$TS /var/www/alexanderlapygin.com/stage-html"
ssh root@84.54.29.190 "readlink /var/www/alexanderlapygin.com/stage-html"
```

Expected: `readlink` returns the new path with `$TS`.

- [ ] **Step 5.5: Smoke endpoints — status codes**

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
  printf "%-65s  " "$url"
  curl -sSI "$url" | head -1
done
```

Expected: every line ends with `HTTP/2 200`. If any 404 or 5xx — investigate before continuing. Likely culprits: build didn't include the file (re-check Tasks 1-3 steps), or rsync `--delete` removed something needed.

- [ ] **Step 5.6: Smoke HTML — meta tags present**

```bash
curl -sS https://stage.alexanderlapygin.com/ | grep -oE '(rel="icon"[^>]*|property="og:image"[^>]*|name="twitter:card"[^>]*|rel="alternate" type="application/rss\+xml"[^>]*)' | sort -u
```

Expected: at least 4 distinct lines covering favicon, og:image, twitter:card, RSS alternate.

- [ ] **Step 5.7: Smoke HTML — «аналитика» removed**

```bash
curl -sS https://stage.alexanderlapygin.com/solutions | grep -c "аналитика"
```

Expected: `0`.

- [ ] **Step 5.8: Smoke RSS — valid XML and items**

```bash
curl -sS https://stage.alexanderlapygin.com/blog/rss.xml | head -c 500
curl -sS https://stage.alexanderlapygin.com/blog/rss.xml | grep -c '<item>'
curl -sS https://stage.alexanderlapygin.com/en/blog/rss.xml | grep -c '<item>'
```

Expected: RU has 2 `<item>` entries (existing RU posts), EN has 1.

- [ ] **Step 5.9: Update HANDOFF.md**

(One-shot at end of session per memory `feedback-handoff-commit-once-per-session`.)

Mark technical track as complete in `HANDOFF.md`. Move item #1 from «Что осталось недоделанным» to «Что сделано в сессии». Update branch state line. Commit as `docs(handoff): pre-cutover technical track complete`.

---

## Rollback notes

Each task is one commit, sequential. To rollback a single task:

```bash
git revert <commit-sha>
```

For Task 5 (stage deploy) rollback — switch symlink back to previous release:

```bash
ssh root@84.54.29.190 "ls -t /var/www/alexanderlapygin.com/stage-releases/ | head -5"
ssh root@84.54.29.190 "ln -sfn /var/www/alexanderlapygin.com/stage-releases/<previous-TS> /var/www/alexanderlapygin.com/stage-html"
```

No nginx reload needed for stage rollback (symlink swap is atomic and `try_files` re-resolves).
