"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { createGame, joinGame, listGames } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { GameSummaryResponse, PageResponse } from "@/lib/api/types";

export default function Home() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joiningGame, setJoiningGame] = useState(false);
  const [gamesPage, setGamesPage] = useState<PageResponse<GameSummaryResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;

    async function fetchGames() {
      setLoadingGames(true);
      try {
        const response = await listGames({ page: currentPage, size: 10 });
        if (!cancelled) {
          setGamesPage(response);
        }
      } catch (err) {
        if (!cancelled) {
          const apiError = err as ApiError;
          setError(apiError.message ?? "Failed to load games");
        }
      } finally {
        if (!cancelled) {
          setLoadingGames(false);
        }
      }
    }

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, currentPage]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  async function handleCreateGame() {
    setError(null);
    setCreatingGame(true);
    try {
      const response = await createGame();
      router.push(`/game/${response.token}`);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  }

  async function handleJoinGame() {
    const trimmed = joinToken.trim();
    if (!trimmed) {
      setError("Please enter a game token");
      return;
    }
    setError(null);
    setJoiningGame(true);
    try {
      const response = await joinGame(trimmed);
      router.push(`/game/${response.token}`);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to join game");
    } finally {
      setJoiningGame(false);
    }
  }

  async function handleJoinFromList(token: string) {
    setError(null);
    setJoiningGame(true);
    try {
      const response = await joinGame(token);
      router.push(`/game/${response.token}`);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Failed to join game");
    } finally {
      setJoiningGame(false);
    }
  }

  function handlePrevPage() {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (gamesPage && !gamesPage.last) {
      setCurrentPage(currentPage + 1);
    }
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Welcome{user ? `, ${user.name}` : ""}
          </h1>
          <button
            onClick={logout}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Logout
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Create Game */}
        <section className="mb-6">
          <button
            onClick={handleCreateGame}
            disabled={creatingGame}
            className="w-full rounded bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingGame ? "Creating..." : "Create Game"}
          </button>
        </section>

        {/* Join by Token */}
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
            Join by Token
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter game token"
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleJoinGame}
              disabled={joiningGame}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joiningGame ? "Joining..." : "Join"}
            </button>
          </div>
        </section>

        {/* Available Games */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">
            Available Games
          </h2>

          {loadingGames && (
            <p className="text-sm text-gray-500">Loading games...</p>
          )}

          {!loadingGames && gamesPage && gamesPage.content.length === 0 && (
            <p className="text-sm text-gray-500">
              No games available. Create one!
            </p>
          )}

          {!loadingGames && gamesPage && gamesPage.content.length > 0 && (
            <div className="space-y-2">
              {gamesPage.content.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {game.bluePlayerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Token: {game.token} · {formatDate(game.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinFromList(game.token)}
                    disabled={joiningGame}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of {gamesPage.totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={gamesPage.last}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
