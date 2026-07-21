"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useRedirectIfAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/login";
import { Alert, Input, Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading || isAuthenticated) {
    return null;
  }

  async function onValid(data: LoginFormData) {
    setError(null);
    setLoading(true);

    try {
      await auth.login(data.email, data.password);
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
      <div className="mb-6 flex flex-col items-center gap-2">
        <Image
          src="/skull-icon.png"
          alt="Jolly Roger"
          width={64}
          height={64}
          priority
          className="drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
        />
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome Aboard!
        </h1>
        <p className="text-sm text-text-secondary">
          Identify yourself to the crew, pirate
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onValid)} className="space-y-4">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button variant="primary" fullWidth loading={loading} type="submit">
          Board the Ship ⚓
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        No crew yet?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Join now
        </Link>
      </p>
    </div>
  );
}
