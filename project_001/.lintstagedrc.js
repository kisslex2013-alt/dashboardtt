export default {
  // JavaScript/JSX файлы
  '*.{js,jsx}': ['eslint --fix', 'prettier --write'],

  // TypeScript файлы (если будут добавлены)
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JSON, Markdown, CSS файлы
  '*.{json,md,css}': ['prettier --write'],
}
