"use client";

import { AuthProvider } from "@/lib/auth";
import { SoundProvider } from "@/lib/sound";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SoundProvider>{children}</SoundProvider>
    </AuthProvider>
  );
}
