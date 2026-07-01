import { apiPost } from "./client";
import type {
  BoardResponse,
  PlaceShipsRequest,
  ShotRequest,
  ShotResponse,
} from "./types";

export function placeShips(
  gameToken: string,
  data: PlaceShipsRequest,
): Promise<BoardResponse> {
  return apiPost<BoardResponse>(`/games/${gameToken}/place-ships`, data);
}

export function fireShot(
  gameToken: string,
  data: ShotRequest,
): Promise<ShotResponse> {
  return apiPost<ShotResponse>(`/games/${gameToken}/shots`, data);
}
