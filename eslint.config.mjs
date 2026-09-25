import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // React Hooks 7 enables these migration rules by default. Keep them
      // visible while the existing audio/game state machine is refactored.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // CommonJS build scripts and the music source manifests they load.
    files: ["scripts/**/*.{js,cjs}", "music-sources/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "tmp/**",
    "next-env.d.ts",
    "public/songs/**",
  ]),
]);
