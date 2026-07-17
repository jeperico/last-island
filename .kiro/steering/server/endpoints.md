# Core-API Endpoints Context

## Base URL

- Dev: `http://localhost:8081/api/v2`
- Context path: `/api/v2` (configured in `application-prod.properties`)

## Authenticated Endpoints (JWT Required)

### RSVP
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/rsvp/invite` | COUPLE, ADMIN | List invites (paginated) |
| GET | `/rsvp/invite/{id}` | COUPLE, ADMIN | Get invite |
| POST | `/rsvp/invite` | COUPLE, ADMIN | Create invite |
| PUT | `/rsvp/invite/{id}` | COUPLE, ADMIN | Update invite |
| DELETE | `/rsvp/invite/{id}` | COUPLE, ADMIN | Delete invite |
| GET | `/rsvp/guest` | COUPLE, ADMIN | List guests (paginated) |
| GET | `/rsvp/guest/{id}` | COUPLE, ADMIN | Get guest |
| POST | `/rsvp/guest` | COUPLE, ADMIN | Create guest |
| PUT | `/rsvp/guest/{id}` | COUPLE, ADMIN | Update guest |
| DELETE | `/rsvp/guest/{id}` | COUPLE, ADMIN | Delete guest |

### Gift Registry
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/gift` | COUPLE, ADMIN | List gifts (paginated) |
| GET | `/gift/{id}` | COUPLE, ADMIN | Get gift |
| POST | `/gift` | COUPLE, ADMIN | Create gift |
| PUT | `/gift/{id}` | COUPLE, ADMIN | Update gift |
| DELETE | `/gift/{id}` | COUPLE, ADMIN | Delete gift |

### Messages
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/message` | COUPLE, ADMIN | List messages (paginated) |
| GET | `/message/{id}` | COUPLE, ADMIN | Get message |
| DELETE | `/message/{id}` | COUPLE, ADMIN | Delete message |

### Wallet
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/wallet` | COUPLE, ADMIN | List wallets |
| GET | `/wallet/{id}` | COUPLE, ADMIN | Get wallet (shows availableBalance) |
| POST | `/wallet` | COUPLE, ADMIN | Create wallet |
| PATCH | `/wallet/{id}` | COUPLE, ADMIN | Update wallet (PIX key) |

### Transfers
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/transfers` | COUPLE | Request PIX withdrawal |

### Orders
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/order` | COUPLE, ADMIN | List orders (paginated) |
| GET | `/order/{id}` | COUPLE, ADMIN | Get order details |

### Admin-Only
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/wedding` | ADMIN | List weddings |
| POST | `/wedding` | ADMIN | Create wedding |
| DELETE | `/wedding/{id}` | ADMIN | Delete wedding |
| GET | `/account` | ADMIN | List accounts |
| POST | `/account` | ADMIN | Create account |
| DELETE | `/account/{id}` | ADMIN | Delete account |

## Public Endpoints (No Auth)

### Guest-Facing (slug-based)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/w/{slug}/gift` | List available gifts |
| POST | `/w/{slug}/gift/{giftId}/checkout` | Start payment (returns checkout_url) |
| GET | `/w/{slug}/rsvp/invite` | Search invites by name |
| POST | `/w/{slug}/rsvp/guest` | RSVP a guest |
| PUT | `/w/{slug}/rsvp/guest/{id}` | Update guest RSVP status |
| POST | `/w/{slug}/message` | Send a message |

### Webhook
| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/asaas/{webhookToken}` | Asaas payment/transfer events |

### Infrastructure
| Path | Description |
|------|-------------|
| `/swagger-ui/**` | Swagger UI |
| `/v3/api-docs/**` | OpenAPI spec |

## Conventions
- All list endpoints return `PageResponse<T>` with pagination metadata.
- Admin endpoints that create tenant-scoped resources require `?wedding={uuid}` query param.
- Couple endpoints auto-resolve `weddingId` from JWT.
- Snake_case JSON (`spring.jackson.property-naming-strategy=SNAKE_CASE`).
- Error responses use `ErrorResponse` with `status`, `error`, `message` fields.
