import eslint from "@eslint/js";
import globals from "globals";
import path from "path";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: ["out", "dist"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.js",
            "*.cjs",
            "*.mjs",
            "*.ts",
            "*.cts",
            "*.mts",
          ],
          defaultProject: path.resolve(import.meta.dirname, "./tsconfig.json"),
        },
      },
    },
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "node:assert",
              message: "Use 'node:assert/strict' instead of 'node:assert'",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowTaggedTemplates: true,
        },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: true,
          allowForKnownSafeCalls: [
            {
              from: "package",
              package: "node:test",
              name: "it",
            },
            {
              from: "package",
              package: "node:test",
              name: "describe",
            },
          ],
        },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
