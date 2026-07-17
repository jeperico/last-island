# Core-API Contracts Context

## Request/Response Conventions

- All JSON uses **snake_case** (configured globally via Jackson).
- Monetary amounts are **integers in cents** (e.g., `5000` = R$50.00).
- Fees are in **basis points** (e.g., `500` = 5%).
- UUIDs for all entity IDs.
- Timestamps as ISO-8601 strings.

## Common Response Wrappers

### PageResponse
```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "total_elements": 42,
  "total_pages": 5
}
```

### ErrorResponse
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Resource not found with id: <uuid>"
}
```

## Domain DTOs

### Wedding
```json
{
  "id": "uuid",
  "couple_name": "Alice & Bob",
  "date": "2025-12-20T00:00:00Z",
  "picture": "url",
  "invite_message": "...",
  "gift_message": "...",
  "slug": "alice-bob",
  "created_at": "...",
  "updated_at": "..."
}
```

### Invite
```json
{
  "id": "uuid",
  "name": "Family Smith",
  "phone": "+5511999999999",
  "created_at": "...",
  "updated_at": "..."
}
```

### Guest
```json
{
  "id": "uuid",
  "name": "John Smith",
  "age_group": "ADULT",
  "status": "CONFIRMED",
  "invite_id": "uuid",
  "created_at": "...",
  "updated_at": "..."
}
```
Enums: `age_group` = BABY | CHILD | ADULT. `status` = PENDING | CONFIRMED | DECLINED.

### Gift
```json
{
  "id": "uuid",
  "description": "Blender",
  "picture": "url",
  "price": 15000,
  "stock": 3,
  "remain": 2,
  "created_at": "...",
  "updated_at": "..."
}
```
`remain` is computed (stock - paid orders).

### Message
```json
{
  "id": "uuid",
  "sender": "Guest Name",
  "message": "Congratulations!",
  "is_favorite": false,
  "is_new": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### Wallet
```json
{
  "id": "uuid",
  "pix_key": "couple@email.com",
  "available_balance": 9523,
  "created_at": "...",
  "updated_at": "..."
}
```
`available_balance` = max withdrawal amount (fee-adjusted, pending-txn-adjusted).

### Order
```json
{
  "id": "uuid",
  "guest_name": "João",
  "guest_email": "joao@email.com",
  "amount": 15000,
  "status": "PAID",
  "gift_id": "uuid",
  "created_at": "...",
  "updated_at": "..."
}
```
Statuses: PENDING | PAID | EXPIRED | FAILED.

### Transaction (Transfer)
```json
{
  "id": "uuid",
  "amount": 5000,
  "status": "PENDING",
  "created_at": "..."
}
```
Statuses: PENDING | COMPLETED | FAILED.

### Checkout Request (Guest)
```json
{
  "guest_name": "João Silva",
  "guest_email": "joao@email.com"
}
```

### Checkout Response
```json
{
  "checkout_url": "https://sandbox.asaas.com/checkoutSession/show/abc-123"
}
```

## Validation Rules
- Required fields validated with Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@Email`).
- Invalid requests return `400` with `ErrorResponse`.
- Business rule violations return `409` or `422`.
- Not found returns `404`.
- Unauthorized returns `401`.
- Forbidden (wrong role) returns `403`.

## Webhook Payloads (Inbound from Asaas)

### Checkout Events
```json
{
  "id": "evt_id",
  "event": "CHECKOUT_PAID",
  "checkout": { "id": "payment_id", "status": "PAID" }
}
```
Events: `CHECKOUT_PAID`, `CHECKOUT_EXPIRED`, `CHECKOUT_CANCELED`.

### Transfer Events
```json
{
  "id": "evt_id",
  "event": "TRANSFER_DONE",
  "transfer": { "id": "asaas_transfer_id" }
}
```
Events: `TRANSFER_DONE`, `TRANSFER_FAILED`.
