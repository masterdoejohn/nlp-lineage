// Paper summaries: data/summaries/<milestone id>.md (format in docs/DATA.md, checked by check_data.py).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const summaries = defineCollection({
  loader: glob({ pattern: '*.md', base: './data/summaries' }),
  schema: z.object({
    milestone: z.string(),
    source: z.string().url(),
    source_note: z.string().optional(),
    version: z.string(),
    read: z.coerce.date(),  // YAML reads 2026-10-15 as a date
    reviewed_by: z.string(),
  }),
});

export const collections = { summaries };
