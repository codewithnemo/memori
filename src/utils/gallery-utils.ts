import { getCollection } from "astro:content";
import {
	buildCloudinaryThumbnailUrl,
	listCloudinaryImages,
	localPathToCloudinaryPublicId,
} from "./cloudinary-utils";

export type GalleryInfo = {
	slug: string;
	name: string;
	title: string;
	imageCount: number;
	published: Date;
	description: string;
	image: string;
	tags: string[];
	location: string;
};

export async function getGalleries(): Promise<GalleryInfo[]> {
	// Get gallery entries from content collections
	const galleryEntries = await getCollection("galleries");

	// Process galleries in parallel for better performance
	const galleryPromises = galleryEntries.map(async (entry) => {
		// Extract slug from id: "gallery1/index" -> "gallery1"
		const slug = entry.id.replace(/\/index$/, "");
		// Get images from Cloudinary API
		const folderPath = `galleries/${slug}`;
		let cloudinaryImages: Array<{
			public_id: string;
			width: number;
			height: number;
			format: string;
			url: string;
			secure_url: string;
		}> = [];
		let imageCount = 0;
		let firstImageUrl = "";

		cloudinaryImages = await listCloudinaryImages(folderPath);
		imageCount = cloudinaryImages.length;

		// Sort images by public_id to get first image consistently
		if (cloudinaryImages.length > 0) {
			cloudinaryImages.sort((a, b) => a.public_id.localeCompare(b.public_id));
			firstImageUrl = buildCloudinaryThumbnailUrl(
				cloudinaryImages[0].public_id,
				600,
				400,
			);
		}

		// Use cover image from metadata if available, otherwise use first image from Cloudinary
		let finalImagePath = entry.data.image || "";

		// Convert local image path to Cloudinary URL if needed
		if (finalImagePath && !finalImagePath.startsWith("http")) {
			const publicId = localPathToCloudinaryPublicId(
				`galleries/${slug}/${finalImagePath}`,
			);
			finalImagePath = buildCloudinaryThumbnailUrl(publicId, 600, 400);
		} else if (!finalImagePath) {
			finalImagePath = firstImageUrl;
		}

		return {
			slug,
			name: slug,
			title: entry.data.title,
			imageCount,
			published: entry.data.published,
			description: entry.data.description || "",
			image: finalImagePath,
			tags: entry.data.tags || [],
			location: entry.data.location || "",
		};
	});

	// Wait for all galleries to be processed in parallel
	const results = await Promise.all(galleryPromises);

	// Sort by published date (newest first)
	results.sort((a, b) => b.published.getTime() - a.published.getTime());

	return results;
}

export type GalleryForList = {
	slug: string;
	data: {
		title: string;
		tags: string[];
		published: Date;
		location?: string;
	};
};

export async function getSortedGalleriesList(): Promise<GalleryForList[]> {
	const galleries = await getGalleries();

	return galleries.map((gallery) => ({
		slug: gallery.slug,
		data: {
			title: gallery.title,
			tags: gallery.tags,
			published: gallery.published,
			location: gallery.location || undefined,
		},
	}));
}
