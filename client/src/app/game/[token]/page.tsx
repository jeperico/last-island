"use client";

import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";

export default function GamePage() {
  const { isLoading } = useRequireAuth();
  const params = useParams();
  const token = params.token as string;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Game: {token}
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        This page is under construction
      </p>
    </div>
  );
}
