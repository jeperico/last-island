# Core-API Domain Context

## What is Last Island

Last Island is a **multiplayer naval battle game** (Battleship) themed around One Piece. Two players place fleets on a 10×10 sea chart and take turns firing cannonballs until one fleet is sunk. The game uses real-time Server-Sent Events for turn notifications and features a dark nautical UI with One Piece theming.

## Domain Model

### User
The player entity. Contains credentials, stats, and progression.
- Fields: name (unique), email (unique), passwordHash, avatar, bounty, rank, wins, losses, totalShots, totalHits
- Derived: winRate, accuracy

### Game
A match between two players. Identified by a unique 6-character `token`.
- Contains two Boards (blueBoard, redBoard), tracks currentTurn, phase, timing, and bountyDelta.
- Phases: `WAITING_OPPONENT` → `PLACING_SHIPS` → `IN_PROGRESS` → `FINISHED` | `CANCELLED`

### GameResult
Records the outcome of a finished game: winner, loser, turns played.

### Board
A player's 10×10 sea chart within a game. Owned by a User.
- Contains a list of Ships and a list of Shots received.

### Ship
A vessel placed on a board.
- Has type (determines size), orientation (HORIZONTAL/VERTICAL), position (row, col), and hit count.
- A ship is sunk when `hits >= type.size`.

### Shot
A cannonball fired at a board by an attacker.
- Has position (row, col) and result (MISS, HIT, SUNK).

### Haki Profile
Skill tree progression system per user. Earned by winning battles and reaching bounty milestones.
- Tracks hakiPoints, hakiPointsAvailable, and levels for each Haki type (observation, armament, conquerors).
- `bountyMilestonesReached` prevents duplicate milestone awards.

### Haki Battle State
Per-board state tracking Haki ability usage within a single game.
- Tracks remaining uses and whether haki was already used this turn.

## Enums

| Enum | Values |
|------|--------|
| GamePhase | WAITING_OPPONENT, PLACING_SHIPS, IN_PROGRESS, FINISHED, CANCELLED |
| ShipType | THOUSAND_SUNNY (5), MOBY_DICK (4), RED_FORCE (3), POLAR_TANG (3), STRIKER (2) |
| ShotResult | MISS, HIT, SUNK |
| Orientation | HORIZONTAL, VERTICAL |
| PirateRank | ROOKIE, SUPER_ROOKIE, SUPERNOVA, SHICHIBUKAI, YONKO, PIRATE_KING |
| Avatar | LUFFY, ZORO, ROBIN, CHOPPER, ACE, DOFLAMINGO |
| HakiType | OBSERVATION, ARMAMENT, CONQUERORS |
| CellRevealStatus | HAS_SHIP, EMPTY |

## Progression System (Bounty & Rank)

- Players start at 100M bounty (SUPER_ROOKIE rank).
- Wins award bounty (flat 50M base × 3 multiplier, adjusted by underdog ratio).
- Losses deduct bounty (floor at 0).
- Rank is derived from bounty thresholds:
  - 0–99M: ROOKIE
  - 100M–199M: SUPER_ROOKIE
  - 200M–399M: SUPERNOVA
  - 400M–799M: SHICHIBUKAI
  - 800M–1499M: YONKO
  - 1500M+: PIRATE_KING
- Each win awards 1 Haki point. Bounty milestones (every 500M) grant bonus points.

## Business Rules

- A fleet consists of 5 ships: sizes 5, 4, 3, 3, 2 (One Piece–named).
- Ships cannot overlap or extend outside the 10×10 grid.
- Players must place all ships before the battle can begin.
- Turns alternate; a player can fire one shot per turn (unless Haki modifies this).
- Game ends when all 5 ships of one player are sunk.
- Turn timer exists — expired turns trigger game expiration logic.
- Surrendering records a defeat and awards the opponent a win.
- Cancelling only allowed during WAITING_OPPONENT phase.
