import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: [vitePreprocess()],

			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// GitHub Pages serves its own 404 page; a generated 404.html replaces it
			// and doubles as the SPA fallback for non-prerendered routes.
			adapter: adapter({
				fallback: '404.html'
			}),

			paths: {
				// Project pages are served from /<repo-name>, so the CI workflow
				// injects BASE_PATH. Local dev and preview run from the root.
				base: process.argv.includes('dev')
					? ''
					: (process.env.BASE_PATH as `/${string}` | undefined)
			}
		})
	]
});
