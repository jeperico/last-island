# Code Style Conventions

## General Rules

- **Named exports** — use `export function` / `export { Foo }`. Default exports only for Next.js pages/layouts (required by framework).
- **Function declarations** preferred for components and hooks. Arrow functions for inline callbacks and small helpers.
- **TODO markers** — when something is pending, leave a `// TODO: description` comment inline.
- **"use client"** directive at the top of files that use React hooks, browser APIs, or event handlers.

## TypeScript

- Use `interface` for component props and object shapes
- Use `type` for unions, aliases, and utility types
- Component props declared as `interface {Name}Props`:
  ```ts
  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
    children: ReactNode;
  }

  export function Button({ variant = "primary", ...props }: ButtonProps) { ... }
  ```
- Use `@/*` path alias for imports (maps to `src/*`)
- `import type { ... }` for type-only imports

## ESLint

- Flat config (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Run: `npm run lint`

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `SurrenderModal` |
| Hooks | camelCase with `use` prefix | `useGameEvents` |
| Utils/helpers | camelCase | `getStoredWallpaper` |
| Interfaces | PascalCase + Props/Response suffix | `GameStateResponse` |
| Types | PascalCase | `WallpaperNumber` |
| Files (components) | kebab-case | `surrender-modal.tsx` |
| Files (hooks) | kebab-case | `use-game-events.ts` |
| Files (utils) | kebab-case | `placement-logic.ts` |
| Constants | UPPER_SNAKE_CASE or camelCase | `STORAGE_KEY`, `DEFAULT_WALLPAPER` |
| API routes | kebab-case | `/api/games`, `/api/auth/register` |

## Styling

- Tailwind CSS 4 utility classes inline
- Custom CSS variables in `globals.css` for theming (colors, borders, surfaces)
- Dark-only theme — no light mode
- Conditional classes via array `.filter(Boolean).join(" ")` pattern
- Variant styles defined as `Record<Variant, string>` maps

## Component Patterns

- Props interface in the same file as the component
- Destructure props in function signature with defaults
- Compose className via array join (no clsx/tailwind-merge dependency):
  ```ts
  className={[
    "base-classes",
    variantClasses[variant],
    fullWidth ? "w-full" : "",
    className,
  ].filter(Boolean).join(" ")}
  ```
- UI primitives in `components/ui/` are generic and reusable
- Domain components in `components/` root are feature-specific
