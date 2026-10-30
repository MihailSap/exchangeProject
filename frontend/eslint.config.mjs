import tseslint from "typescript-eslint";

const eslintConfig = [
  ...tseslint.configs.recommended,
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
];

export default eslintConfig;
