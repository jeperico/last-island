"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/register";
import { Alert, Input, Button } from "@/components/ui";

const AVATAR_OPTIONS = [
  { key: "LUFFY", name: "Luffy", image: "/avatars/luffy/profile.svg" },
  { key: "ZORO", name: "Zoro", image: "/avatars/zoro/profile.svg" },
  { key: "ROBIN", name: "Robin", image: "/avatars/robin/profile.svg" },
  { key: "CHOPPER", name: "Chopper", image: "/avatars/chopper/profile.svg" },
  { key: "NAMI", name: "Nami", image: "/avatars/nami/profile.svg" },
  { key: "ACE", name: "Ace", image: "/avatars/ace/profile.svg" },
] as const;

export default function RegisterPage() {
  const auth = useAuth();
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const filiation = watch("filiation");
  const avatar = watch("avatar");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function onValid(data: RegisterFormData) {
    setError(null);
    setLoading(true);

    try {
      await auth.register(data.name, data.email, data.password, data.filiation, data.avatar ?? null);
      // Navigation handled by useRedirectIfAuthenticated once isAuthenticated flips
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message ?? "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/skull-icon.png"
          alt="Jolly Roger"
          width={64}
          height={64}
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

        <fieldset>
          <legend className="text-sm font-medium text-text-secondary mb-2">
            Choose your allegiance
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setValue("filiation", filiation === "PIRATE" ? (undefined as unknown as "PIRATE") : "PIRATE", { shouldValidate: true })
              }
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all duration-200 cursor-pointer ${
                filiation === "PIRATE"
                  ? "border-secondary bg-secondary/10 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-[1.03] hover:bg-secondary/20"
                  : "border-border hover:border-secondary/50 hover:bg-surface-secondary"
              }`}
              aria-pressed={filiation === "PIRATE"}
            >
              {filiation === "PIRATE" && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-navy text-xs font-bold">
                  ✓
                </span>
              )}
              <span className="text-4xl">🏴‍☠️</span>
              <span
                className={`text-sm font-semibold ${
                  filiation === "PIRATE" ? "text-secondary" : "text-text-primary"
                }`}
              >
                Pirate
              </span>
              <span className={`text-xs font-bold ${filiation === "PIRATE" ? "text-secondary/80" : "text-text-secondary"}`}>
                Freedom on the seas
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("filiation", filiation === "MARINE" ? (undefined as unknown as "MARINE") : "MARINE", { shouldValidate: true });
                setValue("avatar", null);
              }}
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all duration-200 cursor-pointer ${
                filiation === "MARINE"
                  ? "border-secondary bg-secondary/10 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-[1.03] hover:bg-secondary/20"
                  : "border-border hover:border-secondary/50 hover:bg-surface-secondary"
              }`}
              aria-pressed={filiation === "MARINE"}
            >
              {filiation === "MARINE" && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-navy text-xs font-bold">
                  ✓
                </span>
              )}
              <span className="text-4xl">⚓</span>
              <span
                className={`text-sm font-semibold ${
                  filiation === "MARINE" ? "text-secondary" : "text-text-primary"
                }`}
              >
                Marine
              </span>
              <span className={`text-xs font-bold ${filiation === "MARINE" ? "text-secondary/80" : "text-text-secondary"}`}>Justice above all</span>
            </button>
          </div>
          {errors.filiation && (
            <p className="text-xs text-danger mt-1">
              {errors.filiation.message}
            </p>
          )}
        </fieldset>

        {filiation === "PIRATE" && (
          <fieldset>
            <legend className="text-sm font-medium text-text-secondary mb-2">
              Choose Your Captain
            </legend>
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setValue("avatar", avatar === opt.key ? null : opt.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    avatar === opt.key
                      ? "border-primary ring-2 ring-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  aria-pressed={avatar === opt.key}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.image}
                    alt={opt.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-text-secondary">
                    {opt.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Optional — you can pick later in settings
            </p>
          </fieldset>
        )}

        <Button variant="primary" fullWidth loading={loading} type="submit">
          Set Sail! 🏴‍☠️
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Already part of a crew?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
