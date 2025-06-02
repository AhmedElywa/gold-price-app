const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/layout.tsx",
    "!src/**/page.tsx",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/app/api/**/*",
  ],
  testMatch: [
    "<rootDir>/test/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  projects: [
    {
      displayName: "client",
      testEnvironment: "jest-environment-jsdom",
      testMatch: ["<rootDir>/test/client/**/*.test.{js,jsx,ts,tsx}"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
      },
    },
    {
      displayName: "server",
      testEnvironment: "jest-environment-node",
      testMatch: ["<rootDir>/test/server/**/*.test.{js,jsx,ts,tsx}"],
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
      },
    },
    {
      displayName: "integration",
      testEnvironment: "jest-environment-node",
      testMatch: ["<rootDir>/test/integration/**/*.test.{js,jsx,ts,tsx}"],
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
      },
    },
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
