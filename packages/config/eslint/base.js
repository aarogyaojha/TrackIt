/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
