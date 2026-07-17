# Code Style Conventions

## General Rules

- **Arrow functions only** — never use `function` keyword declarations. Use `const` + arrow.
- **Exports at the end of file** — never inline `export` on declarations. Group all exports at the bottom:
- **TODO markers** — when something is missing or pending in a specific place, leave a `// TODO: description` comment inline.
  ```ts
  const Page = () => { ... };
  export default Page;
  ```
  ```ts
  const helper = () => { ... };
  const utils = () => { ... };
  export { helper, utils };
  ```
- **No default exports for non-page files** — use named exports for components, hooks, utils. Pages/layouts use `export default`.

## TypeScript

- Use `interface` over `type` for object shapes
- Component props always use a `Props` interface with `React.FC<>`:
  ```ts
  interface CardProps {
    title: string;
    children: React.ReactNode;
  }

  const Card: React.FC<CardProps> = ({ title, children }) => { ... };
  export { Card };
  ```
- Prefer explicit return types on exported functions
- Use `@/*` path alias for imports (maps to `src/*`)

## Prettier Config

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## ESLint

- `eslint-plugin-simple-import-sort` — auto-sorts imports/exports
- `typescript-eslint` — TS-aware rules
- `eslint-plugin-react` — React best practices (version auto-detected)
- Lint command: `prettier . --write && eslint --fix src`

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `LoginForm` |
| Hooks | camelCase with `use` prefix | `useLogin` |
| Utils/helpers | camelCase | `formatCurrency` |
| Interfaces | PascalCase | `WeddingProps` |
| Files (components) | kebab-case | `login-form.tsx` |
| Files (hooks) | kebab-case | `use-login.ts` |
| Files (utils) | kebab-case | `format-currency.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
