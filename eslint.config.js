import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report', '.npm-cache', '.playwright-browsers', '.scratch', 'vendor', 'video', 'demo-video'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{js,ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['**/*.{ts,tsx}'], plugins: { 'react-hooks': reactHooks }, rules: reactHooks.configs.recommended.rules },
)
