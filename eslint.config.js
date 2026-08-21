import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "frontend/public/mockServiceWorker.js",
      "e2e/cypress/screenshots/**",
      "e2e/cypress/videos/**",
    ],
  },
  ...tseslint.configs.recommended,
);
