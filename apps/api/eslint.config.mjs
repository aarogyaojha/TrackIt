import baseConfig from "@trackit/config/eslint";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...baseConfig,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
);

