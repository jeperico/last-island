/**
 * Google Analytics 4 custom event helpers.
 * Events only fire when GA is loaded (NEXT_PUBLIC_GA_ID is set).
 */

type GTagEvent = {
  action: string;
  params?: Record<string, string | number>;
};

function trackEvent({ action, params }: GTagEvent) {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      "event",
      action,
      params,
    );
  }
}

// ─── Haki Events ─────────────────────────────────────────────────────────────

export function trackHakiUpgrade(hakiType: string, targetLevel: number) {
  trackEvent({
    action: "haki_upgrade",
    params: { haki_type: hakiType, level: targetLevel },
  });
}

// ─── Avatar Events ───────────────────────────────────────────────────────────

export function trackAvatarSelected(avatar: string, context: "register" | "settings") {
  trackEvent({
    action: "avatar_selected",
    params: { avatar, context },
  });
}
