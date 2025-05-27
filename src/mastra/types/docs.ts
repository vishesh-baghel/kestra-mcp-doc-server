import { z } from 'zod';

export const DocQuerySchema = z.object({
  query: z.string().describe('The search query or document path to find in the Kestra docs'),
  filter: z.object({
    category: z.string().optional().describe('Optional category to filter docs by'),
    version: z.string().optional().describe('Optional version to filter docs by')
  }).optional().describe('Optional filters to narrow down search results')
});

export type DocQuery = z.infer<typeof DocQuerySchema>;

export const DocResultSchema = z.object({
  content: z.string().describe('The content of the documentation'),
  path: z.string().describe('The path to the documentation file'),
  metadata: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().optional()
  }).describe('Metadata about the documentation')
});

export type DocResult = z.infer<typeof DocResultSchema>;
