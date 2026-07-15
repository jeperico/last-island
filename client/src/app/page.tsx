"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { useLobbyEvents } from "@/lib/game";
import {
  createGame,
  joinGame,
  listGames,
  getGame,
  getBattleLog,
  getLeaderboard,
} from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type {
  BattleLogEntryResponse,
  GameStateResponse,
  GameSummaryResponse,
  LeaderboardResponse,
  PageResponse,
} from "@/lib/api/types";
import type {
  GameCreatedEventData,
  GameRemovedEventData,
} from "@/types/game-events";

import {
  Alert,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  Spinner,
  AvatarIcon,
  getRankTier,
  tierStyles,
} from "@/components/ui";
import { GameOverPanel } from "./game/[token]/game-over-panel";
import { formatBounty } from "@/lib/format";

export default function Home() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [gamesPage, setGamesPage] =
    useState<PageResponse<GameSummaryResponse> | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);
  const [battleLog, setBattleLog] = useState<PageResponse<BattleLogEntryResponse> | null>(null);
  const [battleLogPage, setBattleLogPage] = useState(0);
  const [loadingBattleLog, setLoadingBattleLog] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [selectedBattle, setSelectedBattle] =
    useState<GameStateResponse | null>(null);
  const [loadingBattle, setLoadingBattle] = useState(false);

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
        const log = await getBattleLog({ page: 0, size: 5 });
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
      if (!leaderboard) setLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
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
  }, [isLoading, user]);

  useLobbyEvents(
    {
      onGameCreated: (data: GameCreatedEventData) => {
        setGamesPage((prev) => {
          const newGame: GameSummaryResponse = {
            id: "",
            token: data.token,
            bluePlayerName: data.bluePlayerName,
            bluePlayerAvatar: data.bluePlayerAvatar || null,
            bluePlayerBounty: data.bluePlayerBounty,
            bluePlayerRank: data.bluePlayerRank,
            createdAt: data.createdAt,
          };
          if (!prev) {
            return {
              content: [newGame],
              totalElements: 1,
              totalPages: 1,
              size: 5,
              page: 0,
              last: true,
            };
          }
          const alreadyExists = prev.content.some(
            (g) => g.token === data.token,
          );
          if (alreadyExists) return prev;
          const updatedContent = [newGame, ...prev.content].slice(0, prev.size);
          return {
            ...prev,
            content: updatedContent,
            totalElements: prev.totalElements + 1,
          };
        });
      },
      onGameRemoved: (data: GameRemovedEventData) => {
        setGamesPage((prev) => {
          if (!prev) return prev;
          const updatedContent = prev.content.filter(
            (g) => g.token !== data.token,
          );
          if (updatedContent.length === prev.content.length) return prev;
          return {
            ...prev,
            content: updatedContent,
            totalElements: Math.max(0, prev.totalElements - 1),
          };
        });
      },
    },
    !isLoading && !!user,
  );

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

  async function handleJoinFromList(token: string) {
    setError(null);
    setJoiningGame(true);
    try {
      const response = await joinGame(token);
      router.push(`/game/${response.token}`);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 409 && apiError.message?.includes("own")) {
        router.push(`/game/${token}`);
      } else {
        setError(apiError.message ?? "Failed to join game");
      }
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
  const podiumBgColors = [
    "bg-gold-bg",
    "bg-silver-bg",
    "bg-bronze-bg",
  ] as const;

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarIcon
              avatar={user?.avatar ?? null}
              rank={user?.rank ?? null}
              size="sm"
            />
            <h1 className="text-2xl font-bold text-text-primary">
              {`Welcome${user ? `, ${user.name}` : ""}`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-surface-secondary hover:text-primary transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-20">
          {/* Left column — Leaderboard + Battle Log */}
          <div>
            {/* Leaderboard section */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Leaderboard
              </h2>

              {loadingLeaderboard && (
                <div className="space-y-2">
                  <Skeleton height="3.5rem" className="w-full" />
                  <Skeleton height="3.5rem" className="w-full" />
                  <Skeleton height="3.5rem" className="w-full" />
                </div>
              )}

              {!loadingLeaderboard &&
                leaderboard &&
                leaderboard.entries.length === 0 && (
                  <div className="h-60 flex items-center justify-center">
                    <EmptyState
                      title="No rankings yet"
                      description="Battle other captains to claim your spot!"
                    />
                  </div>
                )}

              {!loadingLeaderboard &&
                leaderboard &&
                leaderboard.entries.length > 0 && (
                  <div>
                    <div className="h-68 overflow-y-auto overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col className="w-10" />
                          <col className="w-20" />
                          <col />
                          <col className="w-48" />
                          <col className="w-14" />
                          <col className="w-18" />
                        </colgroup>
                        <thead className="sticky top-0 bg-surface z-20">
                          <tr className="text-text-muted text-xs border-b border-border-light">
                            <th className="py-2 px-2 text-left">#</th>
                            <th className="py-2 px-2 text-left">Bounty</th>
                            <th className="py-2 px-2 text-left">Name</th>
                            <th className="py-2 px-2 text-left">Rank</th>
                            <th className="py-2 px-2 text-left">Wins</th>
                            <th className="py-2 px-2 text-left">Win Rate</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-1">
                          {leaderboard.entries.map((entry) => (
                            <tr
                              key={`${entry.position}-${entry.name}`}
                              className={`hover:bg-surface-secondary border-l-2 ${
                                entry.isCurrentUser
                                  ? "bg-surface-secondary border-l-primary"
                                  : entry.position <= 3
                                    ? `${podiumBgColors[entry.position - 1]} border-l-transparent`
                                    : "border-l-transparent"
                              }`}
                            >
                              <td className="py-2 px-2 font-bold text-text-secondary">
                                {entry.position <= 3
                                  ? podiumMedals[entry.position - 1]
                                  : entry.position}
                              </td>
                              <td className="py-2 px-2 text-left text-secondary font-medium">
                                {formatBounty(entry.bounty)} ₿
                              </td>
                              <td className="py-2 px-2 text-left text-text-primary font-medium truncate">
                                <span className="inline-flex items-center gap-1.5">
                                  <AvatarIcon
                                    avatar={entry.avatar}
                                    rank={entry.rank}
                                    size="sm"
                                    className="inline-block"
                                  />
                                  {entry.name}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-left text-text-muted text-xs">
                                {entry.rank.replace("_", " ")}
                              </td>
                              <td className="py-2 px-2 text-left text-text-secondary">
                                {entry.wins}
                              </td>
                              <td className="py-2 px-2 text-left text-text-secondary">
                                {Math.round(entry.winRate * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Your position — shown when relevant */}
                    {(() => {
                      const userEntry =
                        leaderboard.currentUserEntry ??
                        leaderboard.entries.find((e) => e.isCurrentUser);
                      if (!userEntry) return null;
                      return (
                        <div className="mt-4 pt-4 border-t border-border-light">
                          <p className="text-xs text-text-muted mb-2">
                            Your position
                          </p>
                          <table className="w-full text-sm table-fixed">
                            <colgroup>
                              <col className="w-10" />
                              <col className="w-20" />
                              <col />
                              <col className="w-48" />
                              <col className="w-14" />
                              <col className="w-18" />
                            </colgroup>
                            <tbody>
                              <tr className="bg-surface-secondary border-l-2 border-l-primary">
                                <td className="py-2 px-2 font-bold text-text-secondary">
                                  {userEntry.position}
                                </td>
                                <td className="py-2 px-2 text-left text-secondary font-medium">
                                  {formatBounty(userEntry.bounty)} ₿
                                </td>
                                <td className="py-2 px-2 text-left text-text-primary font-medium truncate">
                                  <span className="inline-flex items-center gap-1.5">
                                    <AvatarIcon
                                      avatar={userEntry.avatar}
                                      rank={userEntry.rank}
                                      size="sm"
                                      className="inline-block"
                                    />
                                    {userEntry.name}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-left text-text-muted text-xs">
                                  {userEntry.rank.replace("_", " ")}
                                </td>
                                <td className="py-2 px-2 text-left text-text-secondary">
                                  {userEntry.wins}
                                </td>
                                <td className="py-2 px-2 text-left text-text-secondary">
                                  {Math.round(userEntry.winRate * 100)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
            </section>

            {/* Battle Log section */}
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                ⚔️ Battle Log
              </h2>

              {!battleLog && loadingBattleLog && (
                <div className="space-y-2">
                  <Skeleton height="2rem" className="w-full" />
                  <Skeleton height="2rem" className="w-full" />
                  <Skeleton height="2rem" className="w-full" />
                </div>
              )}

              {!loadingBattleLog && (!battleLog || battleLog.content.length === 0) && (
                <EmptyState
                  title="No battles yet"
                  description="Your war record is empty, Captain!"
                />
              )}

              {battleLog && battleLog.content.length > 0 && (
                <div className="space-y-2">
                  {loadingBattleLog ? (
                    <div className="space-y-2">
                      <Skeleton height="3.25rem" className="w-full rounded-lg" />
                      <Skeleton height="3.25rem" className="w-full rounded-lg" />
                      <Skeleton height="3.25rem" className="w-full rounded-lg" />
                      <Skeleton height="3.25rem" className="w-full rounded-lg" />
                      <Skeleton height="3.25rem" className="w-full rounded-lg" />
                    </div>
                  ) : (
                    battleLog.content.map((entry) => (
                    <div
                      key={entry.gameId}
                      className="group flex items-center gap-3 px-3 py-3 rounded-lg border border-border-light cursor-pointer hover:border-primary/50 hover:bg-surface-secondary transition-all duration-150"
                      onClick={async () => {
                        setLoadingBattle(true);
                        try {
                          const state = await getGame(entry.token);
                          setSelectedBattle(state);
                        } catch {
                          // silently ignore
                        } finally {
                          setLoadingBattle(false);
                        }
                      }}
                    >
                      <Badge
                        variant={
                          entry.result === "VICTORY" ? "success" : "danger"
                        }
                      >
                        {entry.result}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary block truncate">
                          vs {entry.opponentName}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted group-hover:text-primary transition-colors">
                        View details →
                      </span>
                    </div>
                  ))
                  )}

                  {/* Pagination controls */}
                  {battleLog.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={battleLogPage === 0}
                        onClick={async () => {
                          const newPage = battleLogPage - 1;
                          setBattleLogPage(newPage);
                          setLoadingBattleLog(true);
                          try {
                            const log = await getBattleLog({ page: newPage, size: 5 });
                            setBattleLog(log);
                          } catch { /* ignore */ } finally {
                            setLoadingBattleLog(false);
                          }
                        }}
                      >
                        ← Prev
                      </Button>
                      <span className="text-xs text-text-muted">
                        {battleLogPage + 1} / {battleLog.totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={battleLog.last}
                        onClick={async () => {
                          const newPage = battleLogPage + 1;
                          setBattleLogPage(newPage);
                          setLoadingBattleLog(true);
                          try {
                            const log = await getBattleLog({ page: newPage, size: 5 });
                            setBattleLog(log);
                          } catch { /* ignore */ } finally {
                            setLoadingBattleLog(false);
                          }
                        }}
                      >
                        Next →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right column — Games section (action-first on mobile) */}
          <div className="order-first lg:order-0">
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

              {/* Divider */}
              <div className="my-4 border-t border-border" />

              {/* Active games list */}
              <div>
                {loadingGames && (
                  <div className="space-y-2">
                    <Skeleton height="3rem" className="w-full" />
                    <Skeleton height="3rem" className="w-full" />
                    <Skeleton height="3rem" className="w-full" />
                  </div>
                )}

                {!loadingGames &&
                  gamesPage &&
                  gamesPage.content.length === 0 && (
                    <EmptyState
                      title="No battles available"
                      description="Create one to start!"
                    />
                  )}

                {!loadingGames && gamesPage && gamesPage.content.length > 0 && (
                  <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar rounded-lg">
                    {gamesPage.content.map((game) => {
                      const tier = getRankTier(game.bluePlayerRank);
                      const style = tierStyles[tier];
                      return (
                        <button
                          key={game.id || game.token}
                          type="button"
                          onClick={() => handleJoinFromList(game.token)}
                          disabled={joiningGame}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${style.border} ${style.glow} bg-surface hover:bg-surface-secondary transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <AvatarIcon
                            avatar={game.bluePlayerAvatar}
                            rank={game.bluePlayerRank}
                            size="sm"
                          />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {game.bluePlayerName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {game.bluePlayerRank?.replace("_", " ")} ·{" "}
                              {formatDate(game.createdAt)}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-secondary whitespace-nowrap">
                            {formatBounty(game.bluePlayerBounty)} ₿
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {selectedBattle && user && (
        <GameOverPanel
          gameState={selectedBattle}
          user={user}
          onClose={() => setSelectedBattle(null)}
        />
      )}
    </div>
  );
}
