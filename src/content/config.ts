import { defineCollection, z } from "astro:content";

const specCollection = defineCollection({
	schema: z.object({}),
});
const galleriesCollection = defineCollection({
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
export const collections: Record<
	string,
	ReturnType<typeof defineCollection>
> = {
	spec: specCollection,
	galleries: galleriesCollection,
};
