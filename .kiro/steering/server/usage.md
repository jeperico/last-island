# Core-API Usage Documentation Context

## Who Consumes This API

1. **Couple Dashboard (Frontend)** — Authenticated SPA consuming `/api/v2/*` endpoints with Supabase JWT.
2. **Wedding Guests (Public)** — Unauthenticated users accessing `/w/{slug}/*` endpoints (RSVP, gifts, messages, checkout).
3. **Admin Panel** — Authenticated admin managing all weddings via `/api/v2/wedding`, `/api/v2/account`.
4. **Asaas (Webhooks)** — Payment/transfer event callbacks to `/webhook/asaas/{token}`.

## Authentication Flow

1. User signs in via Supabase (OAuth, magic link, or email/password) — handled entirely by frontend + Supabase.
2. Frontend receives a JWT from Supabase.
3. Frontend sends `Authorization: Bearer {jwt}` on every API request.
4. Backend validates JWT signature against Supabase JWK Set URI (ES256).
5. Backend looks up user by `auth_user_id` (from JWT `sub` claim) to resolve role and weddingId.
6. Request proceeds with `AuthenticatedUser` principal containing: userId, role, weddingId.

## Guest (Public) Flow

1. Guest receives a link like `https://app.hestia.com/w/alice-bob`.
2. Frontend loads wedding data from slug-based endpoints — no auth needed.
3. Guest can: search invites by name, RSVP, view gifts, pay for gifts (Asaas checkout), send messages.

## Payment Flow (End-to-End)

1. Guest picks gift → `POST /w/{slug}/gift/{giftId}/checkout` → receives `checkout_url`.
2. Guest pays on Asaas hosted page (PIX or credit card).
3. Asaas sends `CHECKOUT_PAID` webhook → Order marked PAID, wallet balance credited.
4. Couple sees balance in dashboard → requests transfer via `POST /transfers`.
5. Backend calls Asaas Transfer API → PIX sent to couple.
6. Asaas sends `TRANSFER_DONE` webhook → Transaction marked COMPLETED, balance deducted.

## API Collections (Ready to Use)

### Bruno (recommended, version-controlled)
Location: `docs/bruno/` — open with Bruno app, environments pre-configured.

### Postman
Location: `docs/postman/` — import collection + environment JSON files.

## Swagger UI
Available at: `{base_url}/swagger-ui.html` (dev: `http://localhost:8081/api/v2/swagger-ui.html`)

## Key Behaviors for Frontend Consumers

- **Pagination**: All list endpoints accept `?page=0&size=10` params. Response wraps content in `PageResponse`.
- **Snake case**: All JSON fields use snake_case.
- **Tenant scoping**: Couple JWT auto-resolves wedding. No need to pass wedding ID.
- **Admin cross-tenant**: Admin must pass `?wedding={uuid}` for creation operations.
- **Slug resolution**: Public endpoints resolve wedding from `{slug}` in URL path.
- **Soft deletes**: Entities have `is_active` field. DELETE sets `is_active=false` (logical delete).
- **Error format**: Consistent `{ "status": int, "error": string, "message": string }`.
- **Gift availability**: `remain` field on gift response shows how many units are still available.
- **Wallet balance**: `available_balance` is the max withdrawal amount (already fee-adjusted).

## Rate Limits & Restrictions
- No rate limiting implemented yet (planned for Step 6/7).
- Webhook token in URL path is the only webhook validation mechanism.
- No CORS configuration documented (likely needs frontend origin whitelist).
