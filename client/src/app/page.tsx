"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { createGame, joinGame, listGames, getBattleLog, getLeaderboard } from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type { BattleLogEntryResponse, GameSummaryResponse, LeaderboardResponse, PageResponse } from "@/lib/api/types";
import { joinGameSchema, type JoinGameFormData } from "@/lib/validations/join-game";
import Image from "next/image";
import {
  PageHeader,
  Alert,
  Button,
  Input,
  Card,
  Badge,
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
  const [loadingGames, setLoadingGames] = useState(false);
  const [battleLog, setBattleLog] = useState<BattleLogEntryResponse[]>([]);
  const [loadingBattleLog, setLoadingBattleLog] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<"ALL" | "PIRATE" | "MARINE">("ALL");
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;

    async function fetchGames() {
      setLoadingGames(true);
      setLoadingBattleLog(true);
      try {
        const response = await listGames({ page: 0, size: 5 });
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
      try {
        const log = await getBattleLog();
        if (!cancelled) {
          setBattleLog(log);
        }
      } catch {
        // Battle log is non-critical, silently ignore
      } finally {
        if (!cancelled) {
          setLoadingBattleLog(false);
        }
      }
    }

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;

    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard(leaderboardTab);
        if (!cancelled) {
          setLeaderboard(data);
        }
      } catch {
        // Leaderboard is non-critical, silently ignore
      } finally {
        if (!cancelled) {
          setLoadingLeaderboard(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, leaderboardTab]);

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

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  const podiumMedals = ["🥇", "🥈", "🥉"] as const;
  const podiumRingColors = ["ring-gold", "ring-silver", "ring-bronze"] as const;
  const podiumBorderColors = ["border-t-gold", "border-t-silver", "border-t-bronze"] as const;

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-7xl">
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

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          {/* Left column — Leaderboard + Battle Log */}
          <div>
            {/* Leaderboard section */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                🏆 Leaderboard
              </h2>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={leaderboardTab === "ALL" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setLeaderboardTab("ALL")}
                >
                  All
                </Button>
                <Button
                  variant={leaderboardTab === "PIRATE" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setLeaderboardTab("PIRATE")}
                >
                  Pirates
                </Button>
                <Button
                  variant={leaderboardTab === "MARINE" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setLeaderboardTab("MARINE")}
                >
                  Marines
                </Button>
              </div>

              {loadingLeaderboard && (
                <div className="space-y-2">
                  <Skeleton height="3.5rem" className="w-full" />
                  <Skeleton height="3.5rem" className="w-full" />
                  <Skeleton height="3.5rem" className="w-full" />
                </div>
              )}

              {!loadingLeaderboard && leaderboard && leaderboard.entries.length === 0 && (
                <EmptyState
                  title="No rankings yet"
                  description="Battle other captains to claim your spot!"
                />
              )}

              {!loadingLeaderboard && leaderboard && leaderboard.entries.length > 0 && (
                <div>
                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center gap-4 mb-6">
                    {/* 2nd place */}
                    {leaderboard.entries.length >= 2 && (
                      <div className={`flex flex-col items-center p-3 rounded-lg bg-surface-elevated border-t-2 ${podiumBorderColors[1]} mt-6 w-28`}>
                        <Image
                          src="/skull-icon.png"
                          alt="avatar"
                          width={48}
                          height={48}
                          className={`rounded-full ring-2 ${podiumRingColors[1]}`}
                        />
                        <span className="mt-1 text-sm">{podiumMedals[1]}</span>
                        <p className="text-sm font-semibold text-text-primary truncate w-full text-center">
                          {leaderboard.entries[1].name}
                        </p>
                        <span className="text-xs">
                          {leaderboard.entries[1].filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}
                        </span>
                        <p className="text-xs text-text-muted">
                          {leaderboard.entries[1].wins} wins
                        </p>
                      </div>
                    )}

                    {/* 1st place */}
                    {leaderboard.entries.length >= 1 && (
                      <div className={`flex flex-col items-center p-3 rounded-lg bg-surface-elevated border-t-2 ${podiumBorderColors[0]} mt-0 w-28`}>
                        <Image
                          src="/skull-icon.png"
                          alt="avatar"
                          width={48}
                          height={48}
                          className={`rounded-full ring-2 ${podiumRingColors[0]}`}
                        />
                        <span className="mt-1 text-sm">{podiumMedals[0]}</span>
                        <p className="text-sm font-semibold text-text-primary truncate w-full text-center">
                          {leaderboard.entries[0].name}
                        </p>
                        <span className="text-xs">
                          {leaderboard.entries[0].filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}
                        </span>
                        <p className="text-xs text-text-muted">
                          {leaderboard.entries[0].wins} wins
                        </p>
                      </div>
                    )}

                    {/* 3rd place */}
                    {leaderboard.entries.length >= 3 && (
                      <div className={`flex flex-col items-center p-3 rounded-lg bg-surface-elevated border-t-2 ${podiumBorderColors[2]} mt-6 w-28`}>
                        <Image
                          src="/skull-icon.png"
                          alt="avatar"
                          width={48}
                          height={48}
                          className={`rounded-full ring-2 ${podiumRingColors[2]}`}
                        />
                        <span className="mt-1 text-sm">{podiumMedals[2]}</span>
                        <p className="text-sm font-semibold text-text-primary truncate w-full text-center">
                          {leaderboard.entries[2].name}
                        </p>
                        <span className="text-xs">
                          {leaderboard.entries[2].filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}
                        </span>
                        <p className="text-xs text-text-muted">
                          {leaderboard.entries[2].wins} wins
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Entries 4-10 compact list */}
                  {leaderboard.entries.length > 3 && (
                    <div className="space-y-1">
                      {leaderboard.entries.slice(3, 10).map((entry) => (
                        <div
                          key={`${entry.position}-${entry.name}`}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-secondary ${
                            entry.isCurrentUser ? "bg-surface-secondary ring-1 ring-primary" : ""
                          }`}
                        >
                          <span className="text-sm font-bold text-text-secondary w-6 text-center">
                            {entry.position}
                          </span>
                          <span className="text-xs">
                            {entry.filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}
                          </span>
                          <span className="text-sm text-text-primary flex-1 truncate">
                            {entry.name}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {entry.wins} wins
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current user outside top 10 */}
                  {leaderboard.currentUserEntry && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <p className="text-xs text-text-muted mb-2">Your position</p>
                      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-surface-secondary ring-1 ring-primary">
                        <span className="text-sm font-bold text-text-secondary w-6 text-center">
                          {leaderboard.currentUserEntry.position}
                        </span>
                        <span className="text-xs">
                          {leaderboard.currentUserEntry.filiation === "PIRATE" ? "🏴‍☠️" : "⚓"}
                        </span>
                        <span className="text-sm text-text-primary flex-1 truncate">
                          {leaderboard.currentUserEntry.name}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {leaderboard.currentUserEntry.wins} wins
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Battle Log section */}
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                ⚔️ Battle Log
              </h2>

              {loadingBattleLog && (
                <div className="space-y-2">
                  <Skeleton height="2rem" className="w-full" />
                  <Skeleton height="2rem" className="w-full" />
                  <Skeleton height="2rem" className="w-full" />
                </div>
              )}

              {!loadingBattleLog && battleLog.length === 0 && (
                <EmptyState
                  title="No battles yet"
                  description="Your war record is empty, Captain!"
                />
              )}

              {!loadingBattleLog && battleLog.length > 0 && (
                <div>
                  {battleLog.map((entry) => (
                    <div
                      key={entry.gameId}
                      className="flex items-center gap-2 py-2 border-b border-border-light cursor-pointer hover:bg-surface-secondary rounded"
                    >
                      <Badge
                        variant={entry.result === "VICTORY" ? "success" : "danger"}
                      >
                        {entry.result}
                      </Badge>
                      <span className="text-sm text-text-primary flex-1 truncate">
                        vs {entry.opponentName}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-text-muted">→</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column — Games section (action-first on mobile) */}
          <div className="order-first lg:order-none">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                ⚓ Battle Station
              </h2>

              {/* Start Battle — big primary button */}
              <Button
                variant="primary"
                fullWidth
                loading={creatingGame}
                onClick={handleCreateGame}
                className="py-4 text-lg font-bold"
              >
                Start Battle
              </Button>

              {/* Active games list */}
              <div className="mt-4">
                {loadingGames && (
                  <div className="space-y-2">
                    <Skeleton height="3rem" className="w-full" />
                    <Skeleton height="3rem" className="w-full" />
                    <Skeleton height="3rem" className="w-full" />
                  </div>
                )}

                {!loadingGames && gamesPage && gamesPage.content.length === 0 && (
                  <EmptyState
                    title="No battles available"
                    description="Create one to start!"
                  />
                )}

                {!loadingGames && gamesPage && gamesPage.content.length > 0 && (
                  <div className="max-h-[320px] overflow-y-auto space-y-2">
                    {gamesPage.content.map((game) => (
                      <Card key={game.id} padding="sm">
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
                  </div>
                )}
              </div>

              {/* Join by token — compact form */}
              <div className="mt-4 pt-4 border-t border-border-light">
                <label className="text-sm text-text-secondary mb-1 block">
                  Join by Token
                </label>
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
                    size="sm"
                    type="submit"
                    loading={joiningGame}
                  >
                    Join
                  </Button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
