"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { createGame, joinGame, listGames } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { GameSummaryResponse, PageResponse } from "@/lib/api/types";
import { joinGameSchema, type JoinGameFormData } from "@/lib/validations/join-game";
import {
  PageHeader,
  Alert,
  Button,
  Input,
  Card,
  EmptyState,
  Skeleton,
  Spinner,
} from "@/components/ui";

export default function Home() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinGameFormData>({
    resolver: zodResolver(joinGameSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);
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
        <Spinner size="lg" />
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

  async function onJoin(data: JoinGameFormData) {
    setError(null);
    setJoiningGame(true);
    try {
      const response = await joinGame(data.token.trim());
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
        <PageHeader
          title={`Welcome${user ? `, ${user.name}` : ""}`}
          actions={
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          }
        />

        {/* Error display */}
        {error && (
          <Alert
            variant="error"
            dismissible
            onDismiss={() => setError(null)}
            className="mb-4"
          >
            {error}
          </Alert>
        )}

        {/* Create Game */}
        <section className="mb-6">
          <Button
            variant="primary"
            fullWidth
            loading={creatingGame}
            onClick={handleCreateGame}
          >
            Create Battle
          </Button>
        </section>

        {/* Join by Token */}
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Join by Token
          </h2>
          <form onSubmit={handleSubmit(onJoin)} className="flex gap-2">
            <div className="flex-1">
              <Input
                id="join-token"
                placeholder="Enter game token"
                error={errors.token?.message}
                {...register("token")}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={joiningGame}
            >
              Join
            </Button>
          </form>
        </section>

        {/* Available Games */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Available Games
          </h2>

          {loadingGames && (
            <div className="space-y-2">
              <Skeleton height="3.5rem" className="w-full" />
              <Skeleton height="3.5rem" className="w-full" />
              <Skeleton height="3.5rem" className="w-full" />
            </div>
          )}

          {!loadingGames && gamesPage && gamesPage.content.length === 0 && (
            <EmptyState
              title="No battles available"
              description="Create one to start!"
            />
          )}

          {!loadingGames && gamesPage && gamesPage.content.length > 0 && (
            <div className="space-y-2">
              {gamesPage.content.map((game) => (
                <Card key={game.id} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {game.bluePlayerName}
                      </p>
                      <p className="text-xs text-text-muted">
                        Token: {game.token} · {formatDate(game.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinFromList(game.token)}
                      loading={joiningGame}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-secondary">
                  Page {currentPage + 1} of {gamesPage.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={gamesPage.last}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
