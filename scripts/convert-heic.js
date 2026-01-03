import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import heicConvert from "heic-convert";

const convert = heicConvert.default || heicConvert;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleriesDir = path.join(__dirname, "../src/content/galleries");

async function convertHeicToJpeg(inputPath, outputPath) {
	try {
		const inputBuffer = await fs.promises.readFile(inputPath);
		const outputBuffer = await convert({
			buffer: inputBuffer,
			format: "JPEG",
			quality: 1.0, // 100% quality for maximum image quality
		});

		await fs.promises.writeFile(outputPath, Buffer.from(outputBuffer));
		return true;
	} catch (error) {
		console.error(`✗ Failed to convert ${inputPath}:`, error.message);
		return false;
	}
}

async function deleteHeicFiles(galleryPath) {
	const files = await fs.promises.readdir(galleryPath);
	const heicFiles = files.filter(
		(file) =>
			file.toLowerCase().endsWith(".heic") &&
			fs.statSync(path.join(galleryPath, file)).isFile(),
	);

	if (heicFiles.length === 0) {
		return 0;
	}

	let deleted = 0;
	for (const heicFile of heicFiles) {
		const heicPath = path.join(galleryPath, heicFile);
		const jpegPath = path.join(
			galleryPath,
			heicFile.replace(/\.heic$/i, ".jpg"),
		);

		// Only delete HEIC if corresponding JPEG exists
		if (fs.existsSync(jpegPath)) {
			try {
				await fs.promises.unlink(heicPath);
				deleted++;
			} catch (error) {
				console.error(`✗ Failed to delete ${heicFile}:`, error.message);
			}
		}
	}

	return deleted;
}

async function processGallery(galleryPath) {
	const files = await fs.promises.readdir(galleryPath);
	const heicFiles = files.filter(
		(file) =>
			file.toLowerCase().endsWith(".heic") &&
			fs.statSync(path.join(galleryPath, file)).isFile(),
	);

	if (heicFiles.length === 0) {
		return 0;
	}

	console.log(`\nProcessing gallery: ${path.basename(galleryPath)}`);
	console.log(`Found ${heicFiles.length} HEIC file(s)`);

	let converted = 0;
	let skipped = 0;

	for (let i = 0; i < heicFiles.length; i++) {
		const heicFile = heicFiles[i];
		const heicPath = path.join(galleryPath, heicFile);
		const jpegPath = path.join(
			galleryPath,
			heicFile.replace(/\.heic$/i, ".jpg"),
		);

		// Skip if JPEG already exists
		if (fs.existsSync(jpegPath)) {
			skipped++;
			if ((i + 1) % 10 === 0 || i === heicFiles.length - 1) {
				process.stdout.write(
					`\rProgress: ${i + 1}/${heicFiles.length} (${skipped} skipped, ${converted} converted)`,
				);
			}
			continue;
		}

		const success = await convertHeicToJpeg(heicPath, jpegPath);
		if (success) {
			converted++;
		}

		if ((i + 1) % 10 === 0 || i === heicFiles.length - 1) {
			process.stdout.write(
				`\rProgress: ${i + 1}/${heicFiles.length} (${skipped} skipped, ${converted} converted)`,
			);
		}
	}

	console.log(
		`\n✓ Gallery complete: ${converted} converted, ${skipped} skipped`,
	);
	return converted;
}

async function main() {
	const args = process.argv.slice(2);
	const shouldDelete = args.includes("--delete") || args.includes("-d");
	const deleteOnly = args.includes("--delete-only");

	if (deleteOnly) {
		console.log("Deleting HEIC files...\n");

		if (!fs.existsSync(galleriesDir)) {
			console.error(`Error: Galleries directory not found: ${galleriesDir}`);
			process.exit(1);
		}

		const galleries = await fs.promises.readdir(galleriesDir);
		const galleryDirs = galleries.filter((item) => {
			const itemPath = path.join(galleriesDir, item);
			return fs.statSync(itemPath).isDirectory();
		});

		if (galleryDirs.length === 0) {
			console.log("No galleries found.");
			return;
		}

		let totalDeleted = 0;
		for (const galleryDir of galleryDirs) {
			const galleryPath = path.join(galleriesDir, galleryDir);
			const deleted = await deleteHeicFiles(galleryPath);
			if (deleted > 0) {
				console.log(`✓ Deleted ${deleted} HEIC file(s) from ${galleryDir}`);
			}
			totalDeleted += deleted;
		}

		console.log(
			`\n✓ Deletion complete! Total: ${totalDeleted} HEIC file(s) deleted.`,
		);
		return;
	}

	console.log("Starting HEIC to JPEG conversion...\n");

	if (!fs.existsSync(galleriesDir)) {
		console.error(`Error: Galleries directory not found: ${galleriesDir}`);
		process.exit(1);
	}

	const galleries = await fs.promises.readdir(galleriesDir);
	const galleryDirs = galleries.filter((item) => {
		const itemPath = path.join(galleriesDir, item);
		return fs.statSync(itemPath).isDirectory();
	});

	if (galleryDirs.length === 0) {
		console.log("No galleries found.");
		return;
	}

	let totalConverted = 0;
	for (const galleryDir of galleryDirs) {
		const galleryPath = path.join(galleriesDir, galleryDir);
		const converted = await processGallery(galleryPath);
		totalConverted += converted;
	}

	console.log(
		`\n\n✓ Conversion complete! Total: ${totalConverted} file(s) converted.`,
	);

	if (shouldDelete) {
		console.log("\nDeleting HEIC files...\n");
		let totalDeleted = 0;
		for (const galleryDir of galleryDirs) {
			const galleryPath = path.join(galleriesDir, galleryDir);
			const deleted = await deleteHeicFiles(galleryPath);
			if (deleted > 0) {
				console.log(`✓ Deleted ${deleted} HEIC file(s) from ${galleryDir}`);
			}
			totalDeleted += deleted;
		}
		console.log(
			`\n✓ Deletion complete! Total: ${totalDeleted} HEIC file(s) deleted.`,
		);
	} else {
		console.log(
			"\nTip: Use --delete or -d flag to automatically delete HEIC files after conversion.",
		);
	}
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
