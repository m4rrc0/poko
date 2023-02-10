// Full Astro Configuration API Documentation:
// https://astro.build/config
import { defineConfig } from 'astro/config';
// import { loadEnv } from "vite";
import 'dotenv/config';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import mdx from '@astrojs/mdx';
// import react from "@astrojs/react";
import preact from '@astrojs/preact';
import image from '@astrojs/image';

import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
// import mdx from "@mdx-js/rollup";
// import { astroImageTools } from "astro-imagetools";
// import mdx from "@astrojs/mdx";
// import image from "@astrojs/image";
// import fetchAhead from "@m4rrc0/astro-fetch-ahead";

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.

const site = process.env.SITE;
// console.log({ site });

// TODO: check this vite defineconfig way of getting env variables
// export default defineConfig(({ command, mode }) => {
// Load env file based on `mode` in the current working directory.
// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
// const env = loadEnv(mode, process.cwd(), '')
// console.log('LOADING ENV.SITE FROM CONFIG: ', env.SITE)

// @ts-check
export default defineConfig({
	...(site ? { site } : {}),
	integrations: [
		...(site ? [sitemap(), robotsTxt()] : []),
		// mdx(),
		preact({ compat: true }),
		// preact(),
		// react(),
		// image(),
		image({
			// logLevel: "debug",
			serviceEntryPoint: '@astrojs/image/sharp', // useful after version 0.8.0 of @astrojs/image
		}),
		// fetchAhead(),
		// astroImageTools,
		// mdx(),
		// image(),
	],
	vite: {
		// assetsInclude: ["**/*.png"],
		// NOTE: necessary for astro-icon apparently (https://github.com/natemoo-re/astro-icon)
		// ssr: {
		//   external: ['svgo'],
		// },
		plugins: [
			viteCommonjs(),
			// mdx(/* jsxImportSource: …, otherOptions… */)
		],
	},
});
