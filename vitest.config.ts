import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		resolve: {
			alias: {
				$lib: path.resolve('./src/lib'),
			},
		},
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}'],
			exclude: ['src/**/*.svelte.test.{js,ts}', 'node_modules/**'],
			environment: 'node',
		},
	})
);
