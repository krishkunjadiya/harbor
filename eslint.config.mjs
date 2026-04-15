import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'python_worker/.venv/**', 'reactive_resume/src/routeTree.gen.ts'],
  },
  ...compat.extends('next'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['reactive_resume/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/no-head-element': 'off',
    },
  },
]

export default config