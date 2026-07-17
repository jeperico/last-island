# Project Structure

## Source Layout (`src/`)

```
src/
├── app/                    # Next.js App Router (pages, layouts, route groups)
│   ├── (private)/          # Auth-required routes (dashboard, settings, etc.)
│   ├── (public)/           # No-auth routes (login, register)
│   ├── layout.tsx          # Root layout
│   └── not-found.tsx       # 404 page
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui primitives (button, input, card, etc.)
│   ├── forms/              # Form components with hooks + schemas
│   └── layout/             # Layout-specific components (auth-card, etc.)
├── context/                # React context providers
├── interfaces/             # TypeScript interfaces (domain models, API responses)
│   └── base/               # Base/shared interfaces
├── layout/                 # Structural layout pieces (header, footer, sidebar)
│   ├── header/
│   └── footer/
├── lib/                    # Utility functions (cn, formatters)
├── providers/              # API client setup (axios instance, interceptors)
├── services/               # API service functions grouped by domain
│   └── auth/               # Auth services (doLogin, doRegister, etc.)
├── styles/                 # Global CSS (Tailwind base)
└── proxy.ts                # Request interception (auth guard, redirects)
```

## Conventions

- **Route groups** `(private)` / `(public)` — organize by auth requirement
- **Form components** get their own folder: `component.tsx` + `use-{name}.ts` (hook) + `schema.ts` (Zod) + `index.ts` (barrel)
- **Services** are grouped by domain: `services/auth/`, `services/gift/`, `services/message/`, etc.
- **Interfaces** mirror API response shapes; placed in `interfaces/{domain}/`
- **No barrel files** at `src/` root — import directly from the module path
- **Path alias**: `@/components/ui/button` → `src/components/ui/button`

## Adding a New Page

1. Create route file: `src/app/(private)/{name}/page.tsx`
2. If it has forms: create `src/components/forms/{name}/` with hook + schema + component
3. If it needs API calls: create `src/services/{name}/` with service functions
4. If it introduces new types: add to `src/interfaces/{name}/`

## Adding a New Component

1. Place in `src/components/{category}/{name}.tsx`
2. Define `Props` interface in the same file
3. Export at the bottom of the file
