"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api/auth";
import { setTokens, getAccessToken } from "@/lib/auth-storage";
import { setTokenProvider } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/client";
import type { Filiation } from "@/lib/api/types";

interface FormData {
  name: string;
  email: string;
  password: string;
  filiation: Filiation | "";
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    filiation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        filiation: formData.filiation as Filiation,
      });

      setTokens(response.accessToken, response.refreshToken);
      setTokenProvider(() => getAccessToken());
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
      <h1 className="mb-6 text-center text-2xl font-bold text-[var(--foreground)]">
        Create Account
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[var(--foreground)]">
            Filiation
          </legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <input
                type="radio"
                name="filiation"
                value="PIRATE"
                required
                checked={formData.filiation === "PIRATE"}
                onChange={(e) => setFormData({ ...formData, filiation: e.target.value as Filiation })}
                className="accent-blue-600"
              />
              Pirate
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <input
                type="radio"
                name="filiation"
                value="MARINE"
                checked={formData.filiation === "MARINE"}
                onChange={(e) => setFormData({ ...formData, filiation: e.target.value as Filiation })}
                className="accent-blue-600"
              />
              Marine
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
