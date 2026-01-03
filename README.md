# 🌸 Memori

![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen) 
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue) 

A static photo gallery website built with [Astro](https://astro.build).

## ✨ Features

- [x] Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- [x] Smooth animations and page transitions
- [x] Light / dark mode
- [x] Customizable theme colors & banner
- [x] Responsive design
- [x] Photo gallery with timeline view
- [x] Image lightbox with [Fancybox](https://fancyapps.com/)
- [x] Automatic image optimization
- [x] Gallery metadata (location, camera, date)

## 🚀 Getting Started

1. Clone this repository:
   ```sh
   git clone https://github.com/codewithnemo/memori.git
   cd memori
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```
   - Install [pnpm](https://pnpm.io) `npm install -g pnpm` if you haven't.

3. Edit the config file `src/config.ts` to customize your gallery website.

4. Run `pnpm new-gallery <gallery-name>` to create a new gallery and add images to `src/content/galleries/<gallery-name>/`.

5. Deploy your gallery to Vercel, Netlify, GitHub Pages, etc. following [the guides](https://docs.astro.build/en/guides/deploy/). You need to edit the site configuration in `astro.config.mjs` before deployment.

## 📝 Frontmatter of Galleries

Create a gallery by adding a folder in `src/content/galleries/` with an `index.md` file:

```yaml
---
title: My Gallery Title
published: 2026-01-01
description: Description of this gallery
image: cover.jpg  # Optional: cover image filename (or leave empty to use first image)
location: "City, Country"  # Optional
camera: "Canon EOS R5"  # Optional
---
```

Then add your images (JPG, PNG, WEBP) to the same folder. The gallery will automatically display all images.

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Installs dependencies                               |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`         |
| `pnpm build`               | Build your production site to `./dist/`             |
| `pnpm preview`             | Preview your build locally, before deploying        |
| `pnpm check`               | Run checks for errors in your code                  |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-gallery <name>`  | Create a new gallery                                |
| `pnpm astro ...`           | Run CLI commands like `astro add`, `astro check`    |
| `pnpm astro --help`        | Get help using the Astro CLI                        |

## 📄 License

This project is licensed under the MIT License.
