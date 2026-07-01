"use client";

import { useRequireAuth } from "@/lib/auth";

export default function Home() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center px-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Last Island — Naval Battle
        </p>
      </main>
    </div>
  );
}
