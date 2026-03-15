import { fileURLToPath } from 'url';
import path from 'path';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
	{ languageOptions: { parserOptions: { tsconfigRootDir: __dirname } } },
	eslint.configs.recommended,
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
);
