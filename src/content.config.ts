import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const aiGovernance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ai-governance' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    answerFirst: z.string(),
    datePublished: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    leadMagnet: z.string().optional(),
    definitions: z
      .array(z.object({ term: z.string(), definition: z.string() }))
      .default([]),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    citations: z
      .array(
        z.object({
          claim: z.string(),
          source: z.string(),
          url: z.string().optional(),
          confident: z.boolean().default(false),
        })
      )
      .default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    datePublished: z.coerce.date(),
    author: z.string().default('i-NETT'),
    authorTitle: z.string().optional(),
    source: z.string().optional(),
    draft: z.boolean().default(false),
    answerFirst: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { 'ai-governance': aiGovernance, blog };
