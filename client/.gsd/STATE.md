# State

## Position
Plan written — "Add Zod + react-hook-form validation to all forms & fix Refresh failed leak". Awaiting implementer.

## Decisions
- 2026-07-01: React 19 + Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- 2026-07-01: Deploy target = Vercel
- 2026-07-01: Monorepo structure — git root at ~/work/last-island, client lives at client/
- 2026-07-01: Design system — zero new dependencies, pure Tailwind CSS 4 custom components, 9 UI primitives in src/components/ui/
- 2026-07-01: Dark-only theme — deep ocean navy palette, gold primary, no light mode
- 2026-07-01: One Piece personality in waiting screens, game-over panel, copy

## Blockers
(none)

## Last verification
PASS at 2026-07-02T10:18-03:00 — tsc --noEmit exit 0, npm run build compiled (Next.js 16.2.9 Turbopack), npm run lint 0 errors (4 pre-existing warnings), all 3 schemas export correctly, all 3 forms use useForm+zodResolver, auth-context hydration fix verified
