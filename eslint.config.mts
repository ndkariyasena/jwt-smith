import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import css from '@eslint/css';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		languageOptions: { globals: globals.browser },
	},
	{
		files: ['**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: __dirname,
			},
		},
	},
	[...tseslint.configs.recommended],
	{
		files: ['**/*.jsonc'],
		language: 'json/jsonc',
	},
	json.configs.recommended,
	{
		files: ['**/*.md'],
		language: 'markdown/gfm',
	},
	[...markdown.configs.recommended],
	{
		files: ['**/*.css'],
		language: 'css/css',
	},
	css.configs.recommended,
]);
