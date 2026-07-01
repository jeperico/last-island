"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth";
import type { ApiError } from "@/lib/api/client";
import type { Filiation } from "@/lib/api/types";
import { Alert, Input, Button } from "@/components/ui";

interface FormData {
  name: string;
  email: string;
  password: string;
  filiation: Filiation | "";
}

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    filiation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.register(
        formData.name,
        formData.email,
        formData.password,
        formData.filiation as Filiation,
      );
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "An unexpected error occurred");
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Input
          label="Email"
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Input
          label="Password"
          id="password"
          type="password"
          required
          minLength={8}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <fieldset>
          <legend className="sr-only">Filiation</legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, filiation: "PIRATE" })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all cursor-pointer ${
                formData.filiation === "PIRATE"
                  ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(212,160,23,0.3)]"
                  : "border-[var(--color-border)] hover:border-primary/50 hover:bg-[var(--color-surface-secondary)]"
              }`}
              aria-pressed={formData.filiation === "PIRATE"}
            >
              <span className="text-4xl">🏴‍☠️</span>
              <span className={`text-sm font-semibold ${
                formData.filiation === "PIRATE" ? "text-primary" : "text-text-primary"
              }`}>
                Pirate
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, filiation: "MARINE" })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 transition-all cursor-pointer ${
                formData.filiation === "MARINE"
                  ? "border-ocean bg-ocean/10 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                  : "border-[var(--color-border)] hover:border-ocean/50 hover:bg-[var(--color-surface-secondary)]"
              }`}
              aria-pressed={formData.filiation === "MARINE"}
            >
              <span className="text-4xl">⚓</span>
              <span className={`text-sm font-semibold ${
                formData.filiation === "MARINE" ? "text-ocean" : "text-text-primary"
              }`}>
                Marine
              </span>
            </button>
          </div>
          {/* Hidden radio for form validation (required) */}
          <input
            type="radio"
            name="filiation"
            value={formData.filiation}
            checked={formData.filiation !== ""}
            required
            className="sr-only"
            aria-hidden="true"
            readOnly
          />
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
