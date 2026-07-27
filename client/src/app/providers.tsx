"use client";

import { AuthProvider } from "@/lib/auth";
import { SoundProvider } from "@/lib/sound";
import { SoundToggle } from "@/components/sound-toggle";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SoundProvider>
        <SoundToggle />
        {children}
      </SoundProvider>
    </AuthProvider>
  );
}
