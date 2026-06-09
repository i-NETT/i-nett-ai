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

export const collections = { 'ai-governance': aiGovernance };
