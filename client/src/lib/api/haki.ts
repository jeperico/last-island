import { apiGet, apiPost } from "./client";
import type { HakiProfileResponse, HakiUpgradeRequest } from "./types";

export function getHakiProfile(): Promise<HakiProfileResponse> {
  return apiGet<HakiProfileResponse>("/api/haki/profile");
}

export function upgradeHaki(data: HakiUpgradeRequest): Promise<HakiProfileResponse> {
  return apiPost<HakiProfileResponse>("/api/haki/upgrade", data);
}
