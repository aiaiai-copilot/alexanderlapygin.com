import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const localeField = z.enum(["ru", "en"]);

const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    lang: localeField,
  }),
});

const projectClient = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects-client" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    stack: z.array(z.string()).default([]),
    liveUrl: z.string().url(),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    repoUrl: z.string().url().optional(),
    phase: z.string().optional(),
    type: z.string().optional(),
    access: z.string().optional(),
    status: z.string().optional(),
    features: z.array(z.string()).default([]),
    lang: localeField,
  }),
});

const projectPersonal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects-personal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    stack: z.array(z.string()).default([]),
    liveUrl: z.string().url().optional(),
    image: z.string().optional(),
    repoUrl: z.string().url().optional(),
    comingSoon: z.boolean().default(false),
    features: z.array(z.string()).default([]),
    lang: localeField,
  }),
});

const solution = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/solutions" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number().default(100),
    features: z.array(z.string()).default([]),
    image: z.string().optional(),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    lang: localeField,
  }),
});

export const collections = {
  posts: post,
  "projects-client": projectClient,
  "projects-personal": projectPersonal,
  solutions: solution,
};
