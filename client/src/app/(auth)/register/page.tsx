"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { registerSchema, type RegisterFormData } from "@/lib/validations/register";
import { Alert, Input, Button } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
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

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function onValid(data: RegisterFormData) {
    setError(null);
    setLoading(true);

    try {
      await auth.register(data.name, data.email, data.password, data.filiation);
      router.push("/");
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
      <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">
        Create Account
      </h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onValid)} className="space-y-4">
        <Input
          label="Name"
          id="name"
          type="text"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          id="email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          id="password"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />

        <fieldset>
          <legend className="sr-only">Filiation</legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("filiation", "PIRATE", { shouldValidate: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all cursor-pointer ${
                filiation === "PIRATE"
                  ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(212,160,23,0.3)]"
                  : "border-[var(--color-border)] hover:border-primary/50 hover:bg-[var(--color-surface-secondary)]"
              }`}
              aria-pressed={filiation === "PIRATE"}
            >
              <span className="text-4xl">🏴‍☠️</span>
              <span className={`text-sm font-semibold ${
                filiation === "PIRATE" ? "text-primary" : "text-text-primary"
              }`}>
                Pirate
              </span>
            </button>
            <button
              type="button"
              onClick={() => setValue("filiation", "MARINE", { shouldValidate: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all cursor-pointer ${
                filiation === "MARINE"
                  ? "border-ocean bg-ocean/10 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                  : "border-[var(--color-border)] hover:border-ocean/50 hover:bg-[var(--color-surface-secondary)]"
              }`}
              aria-pressed={filiation === "MARINE"}
            >
              <span className="text-4xl">⚓</span>
              <span className={`text-sm font-semibold ${
                filiation === "MARINE" ? "text-ocean" : "text-text-primary"
              }`}>
                Marine
              </span>
            </button>
          </div>
          {errors.filiation && (
            <p className="text-xs text-danger mt-1">{errors.filiation.message}</p>
          )}
        </fieldset>

        <Button variant="primary" fullWidth loading={loading} type="submit">
          Sign Up
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
