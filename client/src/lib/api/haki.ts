import { apiGet, apiPost } from "./client";
import type {
  HakiProfileResponse,
  HakiUpgradeRequest,
  ObservationRequest,
  ObservationResponse,
  ConquerorsActivationRequest,
  ConquerorsActivationResponse,
  ArmamentAssignmentRequest,
} from "./types";

export function getHakiProfile(): Promise<HakiProfileResponse> {
  return apiGet<HakiProfileResponse>("/api/haki/profile");
}

export function upgradeHaki(data: HakiUpgradeRequest): Promise<HakiProfileResponse> {
  return apiPost<HakiProfileResponse>("/api/haki/upgrade", data);
}

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
