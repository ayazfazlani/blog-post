/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/generated/**",
      "*.config.{js,ts,mjs}",
    ],
  },
];

export default eslintConfig;
