# One Piece Naming & Theming Guide

This project (Last Island) is a multiplayer naval battle game themed around One Piece. Use this guide when naming classes, enums, variables, database fields, API responses, error messages, and UI copy.

## Core Concepts Mapping

| Game Concept | One Piece Term | Notes |
|---|---|---|
| Player | Pirate / Marine | Depends on chosen filiation |
| Team / Side | Crew | e.g. "Straw Hat Crew" |
| Board | Sea / Ocean | The 10×10 grid is a sea chart |
| Ship (game piece) | Ship / Vessel | Named after iconic ships |
| Hit | Cannonball / Strike | A successful attack |
| Miss | Splash | Shot lands in water |
| Sunk | Sunk / Sent to Davy Jones | Ship destroyed |
| Game / Match | Battle / Clash | A confrontation between two players |
| Turn | Turn / Move | Keep simple |
| Win | Victory / Conquest | |
| Lose | Defeat | |
| Lobby | Grand Line | The place where battles are found |

## Ship Names by Filiation

### Pirate Ships (fleet)
| Size | Enum Value | Ship Name | Reference |
|------|------------|-----------|-----------|
| 5 | THOUSAND_SUNNY | Thousand Sunny | Straw Hat Pirates' main ship |
| 4 | MOBY_DICK | Moby Dick | Whitebeard Pirates' flagship |
| 3 | RED_FORCE | Red Force | Red-Haired Pirates' ship (Shanks) |
| 3 | POLAR_TANG | Polar Tang | Heart Pirates' submarine (Trafalgar Law) |
| 2 | STRIKER | Striker | Ace's personal boat |

### Marine Ships (fleet)
| Size | Enum Value | Ship Name | Reference |
|------|------------|-----------|-----------|
| 5 | BUSTER_CALL | Buster Call | The ultimate naval assault fleet |
| 4 | WARSHIP | Warship | Standard large marine vessel |
| 3 | BATTLESHIP | Battleship | Medium combat vessel |
| 3 | CRUISER | Cruiser | Fast pursuit vessel |
| 2 | CUTTER | Cutter | Small patrol boat |

## Rank Progression

### Pirate Ranks (by bounty/progression)
1. ROOKIE — Just starting out (East Blue level)
2. SUPER_ROOKIE — Worst Generation level
3. SUPERNOVA — 100M+ bounty, one of the 11
4. SHICHIBUKAI — Warlord of the Sea
5. YONKO — Emperor of the Sea
6. PIRATE_KING — King of the Pirates

### Marine Ranks (by merit/progression)
1. SEAMAN — Seaman recruit
2. CAPTAIN — Marine Captain
3. COMMODORE — Commodore
4. VICE_ADMIRAL — Vice Admiral
5. ADMIRAL — Admiral (Akainu, Aokiji, Kizaru level)
6. FLEET_ADMIRAL — Fleet Admiral (Sengoku, Akainu)

## Naming Conventions for Code

### Enums
- Use SCREAMING_SNAKE_CASE for enum constants
- Prefer One Piece terms when they map naturally: `GamePhase.IN_PROGRESS` is fine (no forced OP reference), but `ShipType.THOUSAND_SUNNY` over `ShipType.SIZE_5_PIRATE`
- Filiation enum: `PIRATE`, `MARINE`

### Error Messages (API responses)
Use thematic language where it doesn't sacrifice clarity:
- "You already have an active battle" (not "active game")
- "Cannot fire on your own crew" (not "cannot attack yourself")
- "This battle is not accepting new pirates" (not "game is full")
- "It's not your turn to fire, wait for your opponent" (not "not your turn")
- "All enemy vessels have been sunk — victory!" (not "you won")

### Endpoint Naming
Keep REST conventions standard — the theming goes into response bodies and error messages, not URL paths:
- `POST /games` — creates a battle (fine, standard REST)
- `POST /games/{token}` — join a battle
- `POST /games/{token}/ships` — place fleet
- `POST /games/{token}/shots` — fire a cannonball

### Database Tables
Use standard naming (plural nouns, snake_case). Theming is in enum values and display names, not table names:
- `games`, `boards`, `ships`, `shots`, `users`, `game_results`

### DTO / Response Fields
Use One Piece flavor in display-facing fields:
- `shipName` (e.g. "Thousand Sunny") — user-facing
- `shipType` (e.g. `THOUSAND_SUNNY`) — enum value
- `filiation` — PIRATE or MARINE
- `rank` — current rank display name

## Key One Piece Terminology Reference

| Term | Meaning | Usage in Project |
|------|---------|------------------|
| Devil Fruit | Supernatural power source | Future power-ups / abilities |
| Haki | Willpower-based combat ability | Could theme special moves |
| Log Pose | Navigation compass | Could theme matchmaking/finding games |
| Jolly Roger | Pirate flag | Player avatar / icon |
| Buster Call | Massive marine attack | Could theme special attacks |
| Davy Back Fight | Pirate vs pirate competition | The battle itself |
| Poneglyph | Ancient stone tablet | Could theme achievements |
| Bounty | Pirate's worth/notoriety | Player score/rating |
| World Government | Marine authority | The system / server |
| Grand Line | Dangerous ocean route | Lobby / matchmaking |
| New World | Second half of Grand Line | Ranked matches / advanced play |
| East Blue | Starting ocean (weakest) | Beginner tier |
| Calm Belt | Windless zone | AFK / idle state |
| Marineford | Marine HQ location | Could theme leaderboards |

## Guidelines

1. **Don't force it** — If an OP reference makes the code less readable, use the standard term. Code clarity > theming.
2. **Enum values are permanent** — Once a `ShipType.THOUSAND_SUNNY` is in a migration, it stays. Choose carefully.
3. **User-facing vs internal** — Theming is strongest in API responses, error messages, and UI. Internal variable names can stay conventional.
4. **Consistency** — If you call it a "battle" in one error message, don't call it a "clash" in another. Pick one term per concept and stick to it.
5. **Respect the source material** — Use actual One Piece names, ranks, and ships. Don't invent fake OP terms.
