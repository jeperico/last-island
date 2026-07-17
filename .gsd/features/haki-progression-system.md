# Feature: Haki Progression System

## Overview

A progression system that layers three Haki abilities on top of the existing battle mechanics. Players earn Haki Points through wins and bounty milestones, then spend them to unlock and upgrade Observation, Armament, and Conqueror's Haki. This is NOT a separate game mode — it enhances every match as players grow in power.

---

## Point Economy

### Earning Haki Points

Players earn **19 total Haki Points** across their career:

| Source | Points | When |
|--------|--------|------|
| 1st lifetime win | 1 | After winning first battle |
| 2nd lifetime win | 1 | After winning second battle |
| 3rd lifetime win | 1 | After winning third battle |
| Bounty road (16 milestones) | 16 | At fixed bounty thresholds |

### Bounty Road Thresholds

Distributed evenly from starting bounty (100M) to 3B (3,000,000,000):

| # | Bounty Threshold | Approx. Rank | Cumulative Points |
|---|-----------------|--------------|-------------------|
| 1 | 281M | SUPERNOVA | 4 (3 wins + 1) |
| 2 | 462M | SHICHIBUKAI | 5 |
| 3 | 644M | SHICHIBUKAI | 6 |
| 4 | 825M | YONKO | 7 |
| 5 | 1,006M | YONKO | 8 |
| 6 | 1,187M | YONKO | 9 |
| 7 | 1,369M | YONKO | 10 |
| 8 | 1,550M | PIRATE_KING | 11 |
| 9 | 1,731M | PIRATE_KING | 12 |
| 10 | 1,912M | PIRATE_KING | 13 |
| 11 | 2,094M | PIRATE_KING | 14 |
| 12 | 2,275M | PIRATE_KING | 15 |
| 13 | 2,456M | PIRATE_KING | 16 |
| 14 | 2,637M | PIRATE_KING | 17 |
| 15 | 2,819M | PIRATE_KING | 18 |
| 16 | 3,000M | PIRATE_KING | 19 |

**Points are permanent.** Losing bounty and dropping below a threshold does NOT remove earned points. The player simply needs to climb back to reach the next milestone.

### Spending Points

| Haki | Lv1 | Lv2 | Lv3 (Awakening) | Total |
|------|-----|-----|------------------|-------|
| Observation | 1 | 1 | 2 | **4** |
| Armament | 1 | 1 | 2 | **4** |
| Conqueror's | 3 | 3 | 5 | **11** |
| **Grand Total** | | | | **19** |

A player who earns all 19 points can max everything. Before that, they must specialize.

---

## Prerequisites

### Conqueror's Haki Unlock Requirement

To purchase Conqueror's Haki Lv1, the player must have:
- Observation Haki Lv1 (minimum)
- Armament Haki Lv1 (minimum)
- At least ONE awakening (either Observation Lv3 or Armament Lv3)

Minimum prior spend: 1 + 1 + 2 + 1 = **5 points** (e.g., Obs Lv1 + Arm Lv1 + Obs Lv3)

---

## Haki Powers — Detailed Specification

### General Rules

- **One Haki activation per turn** (active Hakis: Observation and Conqueror's)
- **Armament is passive** — it does not consume a turn action (triggers on opponent's hit)
- **Using an active Haki does NOT replace your shot** — you still fire normally
- **Activation timing:** Only on YOUR turn (before/alongside your shot)
- **Opponent notification:** Opponent knows a Haki was used but NOT the target/location (except Armament, which reveals on hit)
- **Visibility:** Opponent does not see your Haki loadout. They discover abilities only when triggered.

---

### Observation Haki (Kenbunshoku)

*"The ability to sense the presence of others"*

**When:** Activated during your turn (active). You still fire your shot.

**Level progression (stacking):**

| Level | Uses/Game | Effect |
|-------|-----------|--------|
| Lv1 (Unlock) | 1 weak | Reveal a **2×2** area on opponent's board (shows ship cells vs empty, no damage) |
| Lv2 (Mastery) | 1 weak + 1 strong | Weak: 2×2 reveal. Strong: **3×3** reveal |
| Lv3 (Awakening) | 1 weak + 1 awakened | Weak: 2×2 reveal. Awakened: **3×3 reveal + full row OR column** of your choice |

**Mechanics:**
- Player selects the top-left corner of the reveal area (2×2 or 3×3)
- At Lv3, the awakened use shows the 3×3 area PLUS an entire row or column (player picks which)
- Revealed cells show HAS_SHIP or EMPTY status. No damage is dealt.
- Opponent receives notification: "Enemy used Observation Haki!" (no location disclosed)

---

### Armament Haki (Busoshoku)

*"The ability to use willpower as invisible armor"*

**When:** Assigned during **ship placement phase** (passive trigger during battle)

**Ship assignment:**
- Lv1: Choose 1 ship → receives the weak buff
- Lv2: Choose 2 ships → 1 with weak buff, 1 with strong buff
- Lv3: Choose 2 ships → 1 with weak buff, 1 with awakened buff

No ship size restriction. Player chooses freely.

**Level progression:**

| Level | Ship 1 (Weak) | Ship 2 (Strong/Awakened) |
|-------|---------------|--------------------------|
| Lv1 | First hit on this ship → opponent skips next turn | — |
| Lv2 | First hit → skip turn | First 3 hits each → opponent skips next turn |
| Lv3 | First hit → skip turn | First 3 hits each → opponent skips turn + **counter-fire** the same coordinate on opponent's board |

**Counter-fire rules (Lv3 awakened):**
- When the opponent hits the awakened ship, the same (x,y) coordinate is automatically fired on the opponent's own board
- If that coordinate is already hit, pick an **adjacent cell** (orthogonal or diagonal, 1 square distance) that hasn't been hit yet
- If ALL adjacent cells are already hit, expand to 2 squares distance. Always finds somewhere to land within 1-2 squares.
- Counter-fire result (HIT/MISS/SUNK) is resolved normally

**Opponent notification:**
- On trigger: "Your cannonball struck — but Armament Haki deflects your momentum! Turn lost."
- On counter-fire: "Armament Haki counter-attacks! Coordinate (x,y) struck on your board!"

---

### Conqueror's Haki (Haoshoku)

*"The power to overwhelm the will of others"*

**When:** Activated during your turn (active). You still fire your shot.

**Prerequisite:** Observation Lv1 + Armament Lv1 + one awakening (5+ points already spent)

**Level progression:**

| Level | Uses/Game | Effect |
|-------|-----------|--------|
| Lv1 (Unlock) | 1 weak | Opponent skips next **3 turns** |
| Lv2 (Mastery) | 1 weak + 1 strong | Weak: skip 3. Strong: skip **5 turns** |
| Lv3 (Awakening) | 1 weak + 1 awakened | Weak: skip 3. Awakened: skip 5 + your activation shot hits in an **X pattern** (center + 4 diagonals = 5 cells) |

**During skipped turns:**
- The user who activated Conqueror's fires every turn (unanswered shots)
- The user CAN use other active Hakis during the skip window (e.g., Observation to scout)
- The skipped opponent cannot do anything — their turns are simply passed

**Cooldown:**
- After the weak use (3 skipped turns end): **1 turn cooldown** before using strong/awakened
- After the awakened use (5 skipped turns end): **2 turns cooldown** before using weak again
- During cooldown, everything is normal (both players alternate turns, no Conqueror's available)

**X-pattern shot (Lv3):**
- Fires on the turn Conqueror's is activated
- Hits the chosen cell + the 4 diagonal cells (5 cells total)
- Each cell resolves independently (HIT/MISS/SUNK)
- If a diagonal cell is out of bounds (corner/edge shot), it wraps or is simply skipped (lost shot)

---

## Interactions Between Hakis

### Armament vs Conqueror's Skip

If Player A uses Conqueror's and during the free turns hits Player B's armored ship:
- Armament **still triggers** — Player A loses their next turn
- This "eats" one of A's free turns from the Conqueror's window
- The Armament only eats ONE turn per trigger (does not cancel the remaining skip)

### Conqueror's vs Conqueror's

Both players can have Conqueror's. Since you can only activate on YOUR turn, and activation requires your turn to exist, they cannot directly clash. If both players stagger usage, the game becomes a back-and-forth of skip windows.

### Observation during Conqueror's window

Player A uses Conqueror's (skip 5). During those 5 free turns, Player A can use Observation on one of them (one Haki per turn rule still applies). This creates a devastating intel + free shots combo. **Intentional power fantasy for late-game players.**

---

## Match Flow Changes

### Ship Placement Phase

1. Player places fleet as normal
2. **NEW:** If player has Armament Haki, UI prompts them to assign buffed ship(s)
3. Player selects which ship(s) receive Armament (with clear indicator of weak vs strong/awakened)
4. Ready up

### Battle Phase

Each turn:
1. (Optional) Player activates ONE active Haki (Observation or Conqueror's)
2. Player fires their shot (unless stunned by Conqueror's or Armament trigger)
3. Shot resolves (HIT/MISS/SUNK)
4. If shot hit an armored ship → Armament triggers (skip/counter-fire)
5. Opponent receives relevant notifications
6. Turn passes

### Game Over

No changes to win condition. All ships sunk = game over. Haki is a tool, not an alternate win condition.

---

## UI Concepts

### Haki Bar (Battle Screen)

Below player's board, show 3 Haki icons with charge indicators:
- **Eye icon** (Observation) — pips showing remaining uses, grayed when depleted
- **Fist icon** (Armament) — shows assigned ship silhouettes, passive indicator
- **Crown icon** (Conqueror's) — pips showing remaining uses, cooldown timer when on CD

### Activation Flow

- Click Haki icon → enters targeting mode (Observation: select area; Conqueror's: confirm activation)
- Haki resolves → then normal shot targeting proceeds
- Clear animation/SFX for each Haki (especially Conqueror's — lightning/shockwave like anime)

### Ship Placement (Armament Assignment)

- After placing all ships, if Armament is unlocked, show "Assign Armament Haki" step
- Ships glow/highlight when selected for Armament
- Clear distinction between weak (dark aura) and strong/awakened (red/black coating like in anime)

### Haki Profile (Settings/Profile)

- Show Haki skill tree with 3 branches
- Current points available
- Unlock/upgrade buttons
- Visual progression (locked → unlocked → awakened with distinct art)

### Opponent Notifications (Battle)

- Toast/banner when opponent uses Haki: "Enemy's Observation Haki activates!" / "Conqueror's Haki! Your will falters..."
- Armament reveal on hit: ship briefly flashes black with Haki coating effect
- Skipped turns: red overlay on board "Overwhelmed by Conqueror's Haki — X turns remaining"

---

## Data Model (High Level)

### New Entities

```
HakiProfile (per user)
├── userId (FK → users)
├── hakiPoints (total earned)
├── hakiPointsAvailable (unspent)
├── observationLevel (0-3)
├── armamentLevel (0-3)
├── conquerorsLevel (0-3)
└── bountyMilestonesReached (int, 0-16)

HakiBattleState (per board/game, runtime)
├── boardId (FK → boards)
├── observationUsesRemaining (int)
├── conquerorsUsesRemaining (int)
├── armamentShip1Id (FK → ships, nullable)
├── armamentShip2Id (FK → ships, nullable)
├── armamentShip1HitsAbsorbed (int)
├── armamentShip2HitsAbsorbed (int)
├── conquerorsCooldownTurnsLeft (int)
├── opponentSkipTurnsLeft (int)
└── hakiEventsLog (JSON or separate table)
```

### Modified Entities

- **User** — add FK to HakiProfile (or embed fields directly)
- **Game/Board** — add FK to HakiBattleState
- **Shot** — add `triggeredArmament` boolean, `wasCounterFire` boolean

---

## Bounty Road — Exact Thresholds (for implementation)

Starting bounty: 100,000,000 (100M)
Final milestone: 3,000,000,000 (3B)
Range: 2,900,000,000
Step: 2,900,000,000 / 16 ≈ 181,250,000

| Milestone | Bounty (exact) | Bounty (display) |
|-----------|---------------|-----------------|
| 1 | 281,250,000 | 281M |
| 2 | 462,500,000 | 462M |
| 3 | 643,750,000 | 644M |
| 4 | 825,000,000 | 825M |
| 5 | 1,006,250,000 | 1B |
| 6 | 1,187,500,000 | 1.2B |
| 7 | 1,368,750,000 | 1.4B |
| 8 | 1,550,000,000 | 1.6B |
| 9 | 1,731,250,000 | 1.7B |
| 10 | 1,912,500,000 | 1.9B |
| 11 | 2,093,750,000 | 2.1B |
| 12 | 2,275,000,000 | 2.3B |
| 13 | 2,456,250,000 | 2.5B |
| 14 | 2,637,500,000 | 2.6B |
| 15 | 2,818,750,000 | 2.8B |
| 16 | 3,000,000,000 | 3B |

---

## Example Player Builds

### "The Scout" (early game, 8 points)
- Observation Lv3 (4 pts) — full intel capability
- Armament Lv2 (2 pts) — defensive with 2 buffed ships
- Conqueror's: locked (hasn't met prerequisite for awakening + can't afford)

Wait — prerequisite requires one awakening. So with Obs Lv3 + Arm Lv2 = 6 pts, Conqueror's is unlockable. But costs 3 more = 9 total. Not possible with 8 pts.

### "The Wall" (8 points)
- Observation Lv1 (1 pt) — minimal intel
- Armament Lv3 (4 pts) — max defense, counter-fire
- Conqueror's Lv1 (3 pts) — meets prereq (Obs Lv1 + Arm Lv1 + Arm Awakening)

### "The Emperor" (19 points, endgame)
- Everything maxed. Full power fantasy.

### "The Assassin" (12 points)
- Observation Lv3 (4 pts) — full intel
- Armament Lv1 (1 pt) — minimal defense
- Conqueror's Lv2 (6 pts) — 8 total skipped turns, devastating offense

---

## Out of Scope (Future)

- Haki respec (redistributing points)
- Haki-based matchmaking (matching by point count)
- Haki achievements/badges
- Animated Haki effects (ship coating, lightning cracks)
- Sound effects per Haki type
