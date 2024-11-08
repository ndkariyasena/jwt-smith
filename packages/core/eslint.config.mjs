// @ts-check

import tseslint from 'typescript-eslint';
import rootConfigs from '../../eslint.config.mjs'

export default tseslint.config(
  ...rootConfigs,
);
