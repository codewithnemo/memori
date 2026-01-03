/* This is a script to create a new gallery folder */

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`Error: No gallery name provided
Usage: pnpm new-gallery <gallery-name>`);
	process.exit(1);
}

const galleryName = args[0];

const targetDir = "./src/content/galleries/";
const galleryPath = path.join(targetDir, galleryName);

if (fs.existsSync(galleryPath)) {
	console.error(`Error: Gallery folder ${galleryPath} already exists`);
	process.exit(1);
}

// Create the gallery folder
fs.mkdirSync(galleryPath, { recursive: true });

// Get current date in YYYY-MM-DD format
function getDate() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// Create markdown file with frontmatter
const markdownContent = `---
title: ${galleryName}
published: ${getDate()}
description: ''
image: ''
location: ''
camera: ''
---

`;

const markdownPath = path.join(galleryPath, "index.md");
fs.writeFileSync(markdownPath, markdownContent, "utf-8");

console.log(`Gallery folder created: ${galleryPath}`);
console.log(`Gallery metadata file created: ${markdownPath}`);
console.log(
	`You can now add images to this folder. The gallery will be available at /galleries/${galleryName}/`,
);
