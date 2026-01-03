#!/usr/bin/env node

/**
 * Script to upload images to Cloudinary
 *
 * Usage:
 *   node scripts/upload-to-cloudinary.js [gallery-slug]
 *
 * If gallery-slug is provided, only uploads images from that gallery.
 * Otherwise, uploads all images from all galleries.
 *
 * Environment variables required (choose one option):
 *
 * Option 1 (recommended):
 *   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *
 * Option 2:
 *   CLOUDINARY_CLOUD_NAME (or PUBLIC_CLOUDINARY_CLOUD_NAME)
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * These can be set in a .env file in the project root.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
	const envContent = fs.readFileSync(envPath, "utf-8");
	const envLines = envContent.split("\n");

	for (const line of envLines) {
		const trimmedLine = line.trim();
		// Skip comments and empty lines
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		// Parse KEY=VALUE format
		const match = trimmedLine.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			let value = match[2].trim();

			// Remove quotes if present
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}

			// Only set if not already in process.env
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	}
}

// Configure Cloudinary
// According to Cloudinary docs: https://cloudinary.com/documentation/node_quickstart
// Parse CLOUDINARY_URL or use individual env vars

let cloudName;
let apiKey;
let apiSecret;

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
	// Parse CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
	const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
	if (match) {
		apiKey = match[1];
		apiSecret = match[2];
		cloudName = match[3];
		console.log("✓ Parsed CLOUDINARY_URL");
	} else {
		console.error("❌ Error: Invalid CLOUDINARY_URL format!");
		console.error(
			"Expected format: cloudinary://api_key:api_secret@cloud_name",
		);
		console.error(`Got: ${cloudinaryUrl.substring(0, 20)}...`);
		process.exit(1);
	}
} else {
	// Fall back to individual environment variables
	cloudName =
		process.env.CLOUDINARY_CLOUD_NAME ||
		process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
	apiKey = process.env.CLOUDINARY_API_KEY;
	apiSecret = process.env.CLOUDINARY_API_SECRET;
}

// Validate credentials
if (!cloudName || !apiKey || !apiSecret) {
	console.error("❌ Error: Cloudinary credentials not found!");
	console.error("\nPlease set one of the following:");
	console.error("\nOption 1: Use CLOUDINARY_URL (recommended):");
	console.error("  CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name");
	console.error("\nOption 2: Use individual environment variables:");
	console.error("  - CLOUDINARY_CLOUD_NAME (or PUBLIC_CLOUDINARY_CLOUD_NAME)");
	console.error("  - CLOUDINARY_API_KEY");
	console.error("  - CLOUDINARY_API_SECRET");
	console.error(
		"\nYou can create a .env file in the project root with these values.",
	);
	console.error("\nDebug info:");
	console.error(`  - .env file exists: ${fs.existsSync(envPath)}`);
	console.error(`  - .env file path: ${envPath}`);
	console.error(
		`  - CLOUDINARY_URL: ${cloudinaryUrl ? "✓ found" : "✗ missing"}`,
	);
	if (cloudinaryUrl) {
		console.error(
			`  - CLOUDINARY_URL value: ${cloudinaryUrl.substring(0, 30)}...`,
		);
	}
	console.error(
		`  - CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? "✓ found" : "✗ missing"}`,
	);
	console.error(
		`  - PUBLIC_CLOUDINARY_CLOUD_NAME: ${process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ? "✓ found" : "✗ missing"}`,
	);
	console.error(`  - CLOUDINARY_API_KEY: ${apiKey ? "✓ found" : "✗ missing"}`);
	console.error(
		`  - CLOUDINARY_API_SECRET: ${apiSecret ? "✓ found" : "✗ missing"}`,
	);
	console.error(`  - Parsed cloud_name: ${cloudName || "✗ missing"}`);
	console.error(`  - Parsed api_key: ${apiKey ? "✓ found" : "✗ missing"}`);
	console.error(
		`  - Parsed api_secret: ${apiSecret ? "✓ found" : "✗ missing"}`,
	);
	process.exit(1);
}

// Configure Cloudinary with explicit parameters
cloudinary.config({
	cloud_name: cloudName,
	api_key: apiKey,
	api_secret: apiSecret,
});

// Verify configuration
if (!cloudinary.config().cloud_name) {
	console.error("❌ Error: Cloudinary configuration failed!");
	console.error("Please check your credentials.");
	process.exit(1);
}

console.log(`✓ Cloudinary configured (cloud: ${cloudName})`);

// Supported image extensions
const IMAGE_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".webp",
	".heic",
	".JPG",
	".JPEG",
	".PNG",
	".WEBP",
	".HEIC",
];

function isImageFile(filename) {
	const ext = path.extname(filename);
	return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Convert local file path to Cloudinary public ID (without folder)
 * Returns just the image name without extension
 */
function localPathToPublicId(filePath, galleriesDir) {
	// Get relative path from galleries directory
	const relativePath = path.relative(galleriesDir, filePath);
	// Remove file extension and normalize path separators
	const publicId = relativePath.replace(/\\/g, "/").replace(/\.[^/.]+$/, "");
	return publicId;
}

/**
 * Extract gallery folder path from file path
 * Returns folder path like "galleries/gallery1"
 */
function getGalleryFolderPath(filePath, galleriesDir) {
	// Get relative path from galleries directory
	const relativePath = path.relative(galleriesDir, filePath);
	// Get the gallery name (first part of the path)
	const pathParts = relativePath.split(path.sep);
	const galleryName = pathParts[0];

	// Return folder path
	return `galleries/${galleryName}`;
}

/**
 * Upload a single image to Cloudinary
 * Based on: https://cloudinary.com/documentation/node_quickstart
 * and: https://stackoverflow.com/questions/45771817/specifying-folder-option-does-not-upload-image-to-folder-in-cloudinary
 *
 * Uses the `folder` option to upload to a specific folder on Cloudinary
 */
async function uploadImage(filePath, publicId, folder, options = {}) {
	try {
		// Extract just the filename for public_id (without folder path)
		const filename = path.basename(publicId);

		// Use upload() method with file path and folder option
		// Cloudinary will automatically detect the file type
		// Using v2 API: upload(file, options, callback)
		const result = await cloudinary.uploader.upload(filePath, {
			folder: folder, // Use folder option to specify the folder
			public_id: filename, // Just the filename, folder is handled by folder option
			resource_type: "image",
			overwrite: options.overwrite || false,
			invalidate: true, // Invalidate CDN cache
			...options,
		});
		return result;
	} catch (error) {
		// Enhanced error handling
		const errorMessage =
			error?.message || error?.error?.message || String(error);
		const httpCode = error?.http_code || error?.error?.http_code;
		const errorName = error?.name || error?.error?.name;

		console.error(`❌ Failed to upload ${filePath}:`);
		console.error(`   Error: ${errorMessage}`);
		if (errorName) {
			console.error(`   Type: ${errorName}`);
		}
		if (httpCode) {
			console.error(`   HTTP Code: ${httpCode}`);
		}
		if (error?.response) {
			console.error(`   Response: ${JSON.stringify(error.response)}`);
		}

		throw error;
	}
}

/**
 * Check if image already exists in Cloudinary
 * Based on: https://cloudinary.com/documentation/node_quickstart
 *
 * @param publicId - The public_id of the image (with folder path)
 */
async function imageExists(publicId) {
	try {
		await cloudinary.api.resource(publicId, {
			resource_type: "image",
		});
		return true;
	} catch (error) {
		// 404 means resource doesn't exist
		if (error?.http_code === 404 || error?.error?.http_code === 404) {
			return false;
		}
		// Other errors should be thrown
		throw error;
	}
}

/**
 * Check if a folder exists in Cloudinary
 */
async function folderExists(folderPath) {
	try {
		// List resources in the folder
		await cloudinary.api.resources({
			type: "upload",
			prefix: folderPath,
			max_results: 1,
		});
		// If we get a result (even empty), folder exists or can be created
		return true;
	} catch {
		// If error, folder might not exist yet
		return false;
	}
}

/**
 * Create gallery folder structure on Cloudinary
 * In Cloudinary, folders are created automatically when you upload with a path
 * But we can verify/create by uploading a small placeholder or checking structure
 */
async function ensureGalleryFolder(gallerySlug) {
	const folderPath = `galleries/${gallerySlug}`;

	try {
		// Check if folder already has content (folder exists)
		const exists = await folderExists(folderPath);

		if (!exists) {
			console.log(`📁 Creating folder: ${folderPath}`);
			// Folder will be created automatically on first upload
			// We just log it here for clarity
		} else {
			console.log(`✓ Folder exists: ${folderPath}`);
		}

		return true;
	} catch (error) {
		console.warn(`⚠️  Could not verify folder ${folderPath}: ${error.message}`);
		// Continue anyway, folder will be created on first upload
		return true;
	}
}

/**
 * Get all image files from a directory
 */
function getImageFiles(dirPath) {
	const files = [];

	if (!fs.existsSync(dirPath)) {
		return files;
	}

	const entries = fs.readdirSync(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			// Recursively get images from subdirectories
			files.push(...getImageFiles(fullPath));
		} else if (entry.isFile() && isImageFile(entry.name)) {
			// Skip index.md and other non-image files
			if (entry.name !== "index.md") {
				files.push(fullPath);
			}
		}
	}

	return files;
}

/**
 * Main upload function
 */
async function uploadImages(gallerySlug = null) {
	const galleriesDir = path.join(__dirname, "../src/content/galleries");

	if (!fs.existsSync(galleriesDir)) {
		console.error(`❌ Galleries directory not found: ${galleriesDir}`);
		process.exit(1);
	}

	let imageFiles = [];

	if (gallerySlug) {
		// Upload images from specific gallery
		const galleryPath = path.join(galleriesDir, gallerySlug);
		if (!fs.existsSync(galleryPath)) {
			console.error(`❌ Gallery not found: ${gallerySlug}`);
			process.exit(1);
		}
		imageFiles = getImageFiles(galleryPath);
		console.log(
			`📁 Found ${imageFiles.length} images in gallery: ${gallerySlug}`,
		);
	} else {
		// Upload images from all galleries
		const galleries = fs
			.readdirSync(galleriesDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);

		for (const gallery of galleries) {
			const galleryPath = path.join(galleriesDir, gallery);
			const files = getImageFiles(galleryPath);
			imageFiles.push(...files);
		}
		console.log(`📁 Found ${imageFiles.length} images across all galleries`);
	}

	if (imageFiles.length === 0) {
		console.log("ℹ️  No images found to upload.");
		return;
	}

	// Determine which galleries we're uploading
	const galleriesToUpload = new Set();
	if (gallerySlug) {
		galleriesToUpload.add(gallerySlug);
	} else {
		// Extract gallery names from file paths
		imageFiles.forEach((filePath) => {
			const relativePath = path.relative(galleriesDir, filePath);
			const galleryName = relativePath.split(path.sep)[0];
			if (galleryName) {
				galleriesToUpload.add(galleryName);
			}
		});
	}

	// Create gallery folders on Cloudinary
	console.log("\n📁 Ensuring gallery folders exist on Cloudinary...");
	for (const gallery of galleriesToUpload) {
		await ensureGalleryFolder(gallery);
	}

	console.log("\n🚀 Starting upload to Cloudinary...\n");

	let uploaded = 0;
	let skipped = 0;
	let failed = 0;

	// Process images in batches to avoid rate limiting
	const batchSize = 5;
	for (let i = 0; i < imageFiles.length; i += batchSize) {
		const batch = imageFiles.slice(i, i + batchSize);

		await Promise.all(
			batch.map(async (filePath) => {
				const publicId = localPathToPublicId(filePath, galleriesDir);
				const folder = getGalleryFolderPath(filePath, galleriesDir);
				const relativePath = path.relative(galleriesDir, filePath);

				// Full public_id with folder for checking existence
				// When using folder option, public_id in response will be folder/filename
				const fullPublicId = `${folder}/${path.basename(publicId)}`;

				try {
					// Verify file exists before attempting upload
					if (!fs.existsSync(filePath)) {
						console.error(`❌ File not found: ${relativePath}`);
						failed++;
						return;
					}

					// Check if image already exists (using full path with folder)
					const exists = await imageExists(fullPublicId);

					if (exists) {
						console.log(`⏭️  Skipped (already exists): ${relativePath}`);
						skipped++;
						return;
					}

					// Upload image with folder option
					// Based on: https://stackoverflow.com/questions/45771817/specifying-folder-option-does-not-upload-image-to-folder-in-cloudinary
					const result = await uploadImage(filePath, publicId, folder, {
						overwrite: false,
					});

					// Verify upload was successful
					if (result?.public_id) {
						// Result will contain the full path with folder
						console.log(`✅ Uploaded: ${relativePath} -> ${result.public_id}`);
						uploaded++;
					} else {
						console.error(`❌ Upload incomplete: ${relativePath}`);
						failed++;
					}
				} catch (error) {
					// Enhanced error reporting
					const errorMessage =
						error?.message ||
						error?.error?.message ||
						String(error) ||
						"Unknown error";
					const httpCode = error?.http_code || error?.error?.http_code;

					console.error(`❌ Failed: ${relativePath}`);
					console.error(`   Error: ${errorMessage}`);
					if (httpCode) {
						console.error(`   HTTP Code: ${httpCode}`);
					}
					failed++;
				}
			}),
		);

		// Small delay between batches to avoid rate limiting
		if (i + batchSize < imageFiles.length) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	console.log("\n📊 Upload Summary:");
	console.log(`   ✅ Uploaded: ${uploaded}`);
	console.log(`   ⏭️  Skipped: ${skipped}`);
	console.log(`   ❌ Failed: ${failed}`);
	console.log(`   📦 Total: ${imageFiles.length}`);
}

// Get gallery slug from command line arguments
const gallerySlug = process.argv[2] || null;

if (gallerySlug) {
	console.log(`🎯 Uploading images from gallery: ${gallerySlug}\n`);
} else {
	console.log("🌐 Uploading all images from all galleries\n");
}

uploadImages(gallerySlug).catch((error) => {
	console.error("\n❌ Fatal error:", error);
	process.exit(1);
});
