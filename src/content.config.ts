import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/spec" }),
	schema: z.object({}),
});

const galleriesCollection = defineCollection({
	loader: glob({ pattern: "**/index.md", base: "./src/content/galleries" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		location: z.string().optional().default(""),
		camera: z.string().optional().default(""),
	}),
});

export const collections = {
	spec: specCollection,
	galleries: galleriesCollection,
};
