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
