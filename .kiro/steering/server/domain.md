# Core-API Domain Context

## What is Hestia

Hestia is a **wedding/event management platform**. The core-api is its backend, serving both a couple dashboard (authenticated) and public guest-facing pages.

## Domain Model

### Wedding
The top-level entity. All data is scoped to a wedding. Each wedding has a unique `slug` used for public URLs.

### Users & Roles
- **COUPLE**: Owns one wedding. Can manage their own wedding's resources (invites, guests, gifts, messages, wallet, orders).
- **ADMIN**: Platform operator. Can access any wedding, manage accounts and weddings. Must pass `?wedding={uuid}` for creation operations.

### RSVP (Invites & Guests)
- An **Invite** represents a household/group invitation (has name, phone).
- A **Guest** belongs to an Invite. Has name, age_group (BABY/CHILD/ADULT), status (PENDING/CONFIRMED/DECLINED).
- Deleting a confirmed guest or an invite with confirmed guests is blocked.

### Gift Registry
- A **Gift** has description, picture, price (cents), stock.
- Stock availability is calculated via a DB view: `remain = gift.stock - COUNT(orders WHERE status='PAID')`.

### Messages
- Guest-submitted messages with sender name, text, is_favorite, is_new flags.

### Payment Domain
- **Wallet**: One per wedding. Stores PIX key, balance (cents), fee (basis points, default 500 = 5%).
- **Order**: Created when a guest pays for a gift. Status: PENDING → PAID/EXPIRED/FAILED.
- **Transaction**: A withdrawal from wallet to couple's PIX. Status: PENDING → COMPLETED/FAILED.

### Multi-Tenant Isolation
- All tenant-scoped tables have `wedding_id` FK.
- Couple queries are always scoped to their own `wedding_id` (resolved from JWT → DB user).
- Admin must explicitly pass `wedding_id`.
- Public guest endpoints resolve wedding from URL slug via `SlugResolver` interceptor.

## Business Rules
- Amounts are always in **cents** (integer).
- Fees are in **basis points** (500 = 5%).
- Available balance formula: `(wallet.balance - SUM(pending txns)) * 10000 / (10000 + fee)`.
- Fee is invisible to the couple — they only see `availableBalance`.
- Webhook processing is idempotent (status transitions happen exactly once).
- Over-withdrawal is prevented by accounting for pending transactions.
