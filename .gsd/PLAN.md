# Plan #6a: Frontend Battle Haki — Foundation (Types, API, SSE Wiring)

## Objective

Add Haki battle types, API client functions, and SSE event wiring as the foundation layer for the Battle Haki UI.

## Files to touch

- modify `client/src/interfaces/api.ts` — Add Haki battle request/response interfaces (ObservationRequest, ObservationResponse, RevealedCell, ConquerorsActivationRequest, ConquerorsActivationResponse, XPatternShotResult, ArmamentAssignmentRequest); add `id: string` to `ShipResponse`; add `armamentTriggered` and `counterFire` fields to `ShotResponse`
- modify `client/src/types/game-events.ts` — Add `OBSERVATION_HAKI_USED`, `ARMAMENT_HAKI_TRIGGERED`, `CONQUERORS_HAKI_USED` to `GameEventType`; add data interfaces (`ObservationHakiUsedEventData`, `ArmamentHakiTriggeredEventData`, `ConquerorsHakiUsedEventData`); extend `GameEventHandlers` with new callbacks
- modify `client/src/lib/game/use-game-events.ts` — Register event listeners for the 3 new Haki SSE events
- modify `client/src/lib/api/haki.ts` — Add `activateObservation`, `activateConquerors`, `assignArmament` functions
- modify `client/src/lib/api/index.ts` — Re-export new haki API functions and new types

## Steps

1. **Add Haki battle interfaces to `client/src/interfaces/api.ts`**:
   ```typescript
   // After existing HakiUpgradeRequest interface:

   // ─── Haki Battle ──────────────────────────────────────────────────────────────

   export type CellRevealStatus = "HAS_SHIP" | "EMPTY";

   export interface RevealedCell {
     row: number;
     col: number;
     status: CellRevealStatus;
   }

   export interface ObservationRequest {
     row: number;
     col: number;
     revealRowIndex?: number | null;
     revealColIndex?: number | null;
   }

   export interface ObservationResponse {
     revealedCells: RevealedCell[];
     effectLevel: string;
   }

   export interface ConquerorsActivationRequest {
     row?: number | null;
     col?: number | null;
   }

   export interface XPatternShotResult {
     row: number;
     col: number;
     result: ShotResult;
     sunkShipType: string | null;
   }

   export interface ConquerorsActivationResponse {
     skipTurns: number;
     effectLevel: string;
     xPatternShots: XPatternShotResult[] | null;
   }

   export interface ArmamentAssignmentRequest {
     ship1Id: string;
     ship2Id: string | null;
   }

   export interface CounterFireResult {
     row: number;
     col: number;
     result: ShotResult;
     sunkShipType: string | null;
   }
   ```

2. **Add `id` field to `ShipResponse`** in `client/src/interfaces/api.ts`:
   ```typescript
   export interface ShipResponse {
     id: string;  // ← NEW
     type: ShipType;
     orientation: Orientation;
     row: number;
     col: number;
     size: number;
   }
   ```

3. **Add armament fields to `ShotResponse`** in `client/src/interfaces/api.ts`:
   ```typescript
   export interface ShotResponse {
     row: number;
     col: number;
     result: ShotResult;
     sunkShipType: string | null;
     gameOver: boolean;
     winnerName: string | null;
     armamentTriggered: boolean;       // ← NEW
     counterFire: CounterFireResult | null;  // ← NEW
   }
   ```

4. **Add SSE event types to `client/src/types/game-events.ts`**:
   - Extend `GameEventType` union with `| "OBSERVATION_HAKI_USED" | "ARMAMENT_HAKI_TRIGGERED" | "CONQUERORS_HAKI_USED"`
   - Add data interfaces:
     ```typescript
     export interface ObservationHakiUsedEventData {}

     export interface ArmamentHakiTriggeredEventData {
       turnSkipped: boolean;
       counterFireRow?: number | null;
       counterFireCol?: number | null;
       counterFireResult?: ShotResult | null;
       counterFireSunkShipType?: string | null;
     }

     export interface ConquerorsHakiUsedEventData {
       skipTurns: number;
       effectLevel: string;
     }
     ```
   - Extend `GameEventHandlers`:
     ```typescript
     onObservationHakiUsed?: (data: ObservationHakiUsedEventData) => void;
     onArmamentHakiTriggered?: (data: ArmamentHakiTriggeredEventData) => void;
     onConquerorsHakiUsed?: (data: ConquerorsHakiUsedEventData) => void;
     ```

5. **Wire SSE listeners in `client/src/lib/game/use-game-events.ts`**:
   - Import the 3 new event data types
   - Add handler functions following the existing pattern (parse JSON, call handlersRef):
     ```typescript
     function handleObservationHakiUsed(event: MessageEvent) {
       const data: ObservationHakiUsedEventData = event.data ? JSON.parse(event.data) : {};
       handlersRef.current.onObservationHakiUsed?.(data);
     }

     function handleArmamentHakiTriggered(event: MessageEvent) {
       const data: ArmamentHakiTriggeredEventData = JSON.parse(event.data);
       handlersRef.current.onArmamentHakiTriggered?.(data);
     }

     function handleConquerorsHakiUsed(event: MessageEvent) {
       const data: ConquerorsHakiUsedEventData = JSON.parse(event.data);
       handlersRef.current.onConquerorsHakiUsed?.(data);
     }
     ```
   - Add `addEventListener` calls:
     ```typescript
     es.addEventListener("OBSERVATION_HAKI_USED", handleObservationHakiUsed);
     es.addEventListener("ARMAMENT_HAKI_TRIGGERED", handleArmamentHakiTriggered);
     es.addEventListener("CONQUERORS_HAKI_USED", handleConquerorsHakiUsed);
     ```

6. **Add battle API functions to `client/src/lib/api/haki.ts`**:
   ```typescript
   import type {
     ObservationRequest,
     ObservationResponse,
     ConquerorsActivationRequest,
     ConquerorsActivationResponse,
     ArmamentAssignmentRequest,
   } from "./types";

   export function activateObservation(
     gameToken: string,
     data: ObservationRequest,
   ): Promise<ObservationResponse> {
     return apiPost<ObservationResponse>(`/api/games/${gameToken}/haki/observation`, data);
   }

   export function activateConquerors(
     gameToken: string,
     data: ConquerorsActivationRequest,
   ): Promise<ConquerorsActivationResponse> {
     return apiPost<ConquerorsActivationResponse>(`/api/games/${gameToken}/haki/conquerors`, data);
   }

   export function assignArmament(
     gameToken: string,
     data: ArmamentAssignmentRequest,
   ): Promise<void> {
     return apiPost<void>(`/api/games/${gameToken}/haki/armament`, data);
   }
   ```

7. **Update barrel exports in `client/src/lib/api/index.ts`**:
   - Add `activateObservation, activateConquerors, assignArmament` to the haki re-export line
   - Add new types to the type re-export block: `ObservationRequest, ObservationResponse, RevealedCell, CellRevealStatus, ConquerorsActivationRequest, ConquerorsActivationResponse, XPatternShotResult, ArmamentAssignmentRequest, CounterFireResult`

## Verification

```bash
cd client && npx next build
cd client && npx eslint src/
grep -r "OBSERVATION_HAKI_USED\|ARMAMENT_HAKI_TRIGGERED\|CONQUERORS_HAKI_USED" client/src/types/game-events.ts client/src/lib/game/use-game-events.ts
grep -r "activateObservation\|activateConquerors\|assignArmament" client/src/lib/api/haki.ts client/src/lib/api/index.ts
grep "armamentTriggered" client/src/interfaces/api.ts
grep "id: string" client/src/interfaces/api.ts | grep -i ship
```

## Rollback

```bash
git checkout -- client/src/interfaces/api.ts client/src/types/game-events.ts client/src/lib/game/use-game-events.ts client/src/lib/api/haki.ts client/src/lib/api/index.ts
```
