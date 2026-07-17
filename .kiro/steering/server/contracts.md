# Core-API Contracts Context

## Request/Response Conventions

- All JSON uses **snake_case** (configured globally via Jackson).
- UUIDs for all entity IDs.
- Bounty values are **longs** (e.g., `100000000` = 100M berries).
- Timestamps as ISO-8601 `LocalDateTime` strings.
- All DTOs are Java records.

## Common Response Wrappers

### PageResponse
```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "total_elements": 42,
  "total_pages": 5,
  "last": false
}
```

### ErrorResponse
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Resource not found with id: <uuid>",
  "timestamp": "2025-07-17T20:30:00"
}
```

## Auth DTOs

### RegisterRequest
```json
{ "name": "Luffy", "email": "luffy@sea.com", "password": "secret123", "avatar": "LUFFY" }
```

### LoginRequest
```json
{ "email": "luffy@sea.com", "password": "secret123" }
```

### AuthResponse
```json
{
  "user": {
    "id": "uuid",
    "name": "Luffy",
    "email": "luffy@sea.com",
    "rank": "SUPER_ROOKIE",
    "bounty": 100000000,
    "wins": 0,
    "losses": 0,
    "avatar": "LUFFY"
  }
}
```
Auth cookies (`access_token`, `refresh_token`) are set via `Set-Cookie` headers.

### UserResponse
```json
{
  "id": "uuid",
  "name": "Luffy",
  "email": "luffy@sea.com",
  "rank": "SUPERNOVA",
  "bounty": 250000000,
  "wins": 3,
  "losses": 1,
  "avatar": "LUFFY"
}
```

### UpdateProfileRequest
```json
{ "avatar": "ZORO" }
```

## Game DTOs

### CreateGameResponse
```json
{ "id": "uuid", "token": "A1B2C3", "phase": "WAITING_OPPONENT", "created_at": "..." }
```

### GameResponse (join)
```json
{
  "id": "uuid",
  "token": "A1B2C3",
  "phase": "PLACING_SHIPS",
  "blue_player_name": "Luffy",
  "red_player_name": "Zoro",
  "current_turn_player_name": null,
  "started_at": null,
  "created_at": "..."
}
```

### GameStateResponse (full state for current player)
```json
{
  "id": "uuid",
  "token": "A1B2C3",
  "phase": "IN_PROGRESS",
  "blue_player_name": "Luffy",
  "blue_player_avatar": "LUFFY",
  "red_player_name": "Zoro",
  "red_player_avatar": "ZORO",
  "blue_player_rank": "SUPERNOVA",
  "red_player_rank": "SUPER_ROOKIE",
  "blue_player_bounty": 250000000,
  "red_player_bounty": 100000000,
  "blue_player_wins": 3,
  "red_player_wins": 1,
  "blue_player_accuracy": 67,
  "red_player_accuracy": 45,
  "bounty_delta": 150000000,
  "current_turn_player_name": "Luffy",
  "winner_name": null,
  "started_at": "...",
  "ended_at": null,
  "turn_started_at": "...",
  "created_at": "...",
  "my_board": { "board_id": "uuid", "owner_name": "Luffy", "ships": [...], "shots_received": [...] },
  "opponent_board": { "board_id": "uuid", "owner_name": "Zoro", "shots_fired": [...] }
}
```

### GameSummaryResponse (list item)
```json
{
  "id": "uuid",
  "token": "A1B2C3",
  "blue_player_name": "Luffy",
  "blue_player_avatar": "LUFFY",
  "blue_player_bounty": 250000000,
  "blue_player_rank": "SUPERNOVA",
  "created_at": "..."
}
```

### BattleLogEntryResponse
```json
{
  "game_id": "uuid",
  "token": "A1B2C3",
  "opponent_name": "Zoro",
  "result": "WIN",
  "date": "2025-07-17",
  "shots_fired": 24,
  "ships_sunk": 5,
  "duration": "12m 30s"
}
```

## Board DTOs

### PlaceShipsRequest
```json
{
  "ships": [
    { "type": "THOUSAND_SUNNY", "orientation": "HORIZONTAL", "row": 0, "col": 0 },
    { "type": "MOBY_DICK", "orientation": "VERTICAL", "row": 2, "col": 5 },
    { "type": "RED_FORCE", "orientation": "HORIZONTAL", "row": 4, "col": 3 },
    { "type": "POLAR_TANG", "orientation": "VERTICAL", "row": 6, "col": 8 },
    { "type": "STRIKER", "orientation": "HORIZONTAL", "row": 8, "col": 1 }
  ]
}
```

### BoardResponse (after placing ships)
```json
{
  "board_id": "uuid",
  "owner_name": "Luffy",
  "ships": [
    { "type": "THOUSAND_SUNNY", "orientation": "HORIZONTAL", "row": 0, "col": 0, "size": 5 }
  ],
  "game_phase": "PLACING_SHIPS"
}
```

### ShotRequest
```json
{ "row": 3, "col": 7 }
```

### ShotResponse
```json
{
  "result": "HIT",
  "sunk_ship_type": null,
  "row": 3,
  "col": 7,
  "game_over": false,
  "winner_name": null
}
```
When a ship is sunk: `result: "SUNK"`, `sunk_ship_type: "RED_FORCE"`.
When last ship sunk: `game_over: true`, `winner_name: "Luffy"`.

### MyBoardResponse
```json
{
  "board_id": "uuid",
  "owner_name": "Luffy",
  "ships": [{ "type": "THOUSAND_SUNNY", "orientation": "HORIZONTAL", "row": 0, "col": 0, "size": 5 }],
  "shots_received": [{ "row": 3, "col": 7, "result": "HIT", "sunk_ship_type": null }]
}
```

### OpponentBoardResponse
```json
{
  "board_id": "uuid",
  "owner_name": "Zoro",
  "shots_fired": [{ "row": 1, "col": 2, "result": "MISS", "sunk_ship_type": null }]
}
```

## Haki DTOs

### HakiProfileResponse
```json
{
  "haki_points": 5,
  "haki_points_available": 2,
  "observation_level": 2,
  "armament_level": 1,
  "conquerors_level": 0,
  "bounty_milestones_reached": 1
}
```

### HakiUpgradeRequest
```json
{ "haki_type": "OBSERVATION", "target_level": 3 }
```

### ObservationRequest
```json
{ "row": 4, "col": 5, "reveal_row_index": null, "reveal_col_index": null }
```

### ObservationResponse
```json
{
  "revealed_cells": [
    { "row": 4, "col": 5, "status": "HAS_SHIP" },
    { "row": 4, "col": 6, "status": "EMPTY" }
  ],
  "effect_level": "2"
}
```

## Leaderboard DTOs

### LeaderboardResponse
```json
{
  "entries": [
    { "position": 1, "name": "Luffy", "wins": 15, "win_rate": 0.75, "rank": "PIRATE_KING", "bounty": 1500000000, "is_current_user": false, "avatar": "LUFFY" }
  ],
  "current_user_entry": { "position": 42, "name": "Me", "wins": 3, "win_rate": 0.6, "rank": "SUPERNOVA", "bounty": 250000000, "is_current_user": true, "avatar": "ZORO" }
}
```

## Validation Rules

- Invalid requests return `400` with ErrorResponse.
- Business rule violations return `409` or `422`.
- Not found returns `404`.
- Unauthorized returns `401`.
- Forbidden returns `403`.
