import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],

	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in Svelte 6.
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},

	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),

		paths: {
			// Project pages are served from /<repo-name>, so the CI workflow
			// injects BASE_PATH. Local dev and preview run from the root.
			base: process.argv.includes('dev')
				? ''
				: (process.env.BASE_PATH || '')
		}
	}
};

export default config;
