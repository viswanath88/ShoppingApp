export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: ["<rootDir>/tests/env.ts"],
  testTimeout: 15000,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/prisma.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
