"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/register";
import { Alert, Input, Button } from "@/components/ui";
import { CharacterSelect } from "@/components/character-select";
import { trackAvatarSelected } from "@/lib/analytics";

export default function RegisterPage() {
  const auth = useAuth();
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Preload character images so they're cached when the select opens
  useEffect(() => {
    const avatars = ["luffy", "zoro", "robin", "chopper", "ace", "usopp"];
    avatars.forEach((name) => {
      const img = new window.Image();
      img.src = `/avatars/${name}/full-body.jpg`;
    });
  }, []);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function onValid(_data: RegisterFormData) {
    setError(null);
    setShowCharacterSelect(true);
  }

  async function handleCharacterConfirm(avatar: string) {
    setIsRegistering(true);
    setError(null);
    try {
      const data = getValues();
      await auth.register(data.name, data.email, data.password, avatar);
      trackAvatarSelected(avatar, "register");
    } catch (err) {
      setIsRegistering(false);
      if (err instanceof ApiError) {
        setError(err.message ?? "An unexpected error occurred");
      }
      setShowCharacterSelect(false);
    }
  }

  function handleCharacterClose() {
    setShowCharacterSelect(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2">
        <Image
          src="/skull-icon.png"
          alt="Jolly Roger"
          width={64}
          height={64}
          priority
          className="drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
        />
        <h1 className="text-2xl font-bold text-text-primary">Join the Crew!</h1>
        <p className="text-sm text-text-secondary">
          Every great pirate starts somewhere
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onValid)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Pirate Name"
            id="name"
            type="text"
            placeholder="Monkey D. Luffy"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Den Den Mushi Address"
            id="email"
            type="email"
            placeholder="luffy@strawhat.crew"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Secret Code"
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Repeat Secret Code"
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <Button variant="primary" fullWidth loading={loading} type="submit">
          Choose Your Captain ⚔️
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Already part of a crew?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>

      {showCharacterSelect && (
        <CharacterSelect
          onConfirm={handleCharacterConfirm}
          onClose={handleCharacterClose}
          isLoading={isRegistering}
        />
      )}
    </div>
  );
}
