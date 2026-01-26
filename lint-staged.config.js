module.exports = {
  // Run ESLint on all JavaScript and TypeScript files
  '**/*.{js,jsx,ts,tsx}': ['next lint'],

  // You can add more rules for other file types if needed
  // For example, to format JSON files with Prettier:
  // '**/*.json': ['prettier --write'],
};
