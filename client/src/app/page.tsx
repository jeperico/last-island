"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { useSound } from "@/lib/sound";
import { useLobbyEvents } from "@/lib/game";
import {
  createGame,
  joinGame,
  listGames,
  getGame,
  getBattleLog,
  getLeaderboard,
  getHakiProfile,
} from "@/lib/api";
import type { ApiError } from "@/lib/api/client";
import type {
  BattleLogEntryResponse,
  GameStateResponse,
  GameSummaryResponse,
  LeaderboardEntryResponse,
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
import { HakiTutorialModal } from "@/components/haki-tutorial-modal";
import { PlayerProfileModal } from "@/components/player-profile-modal";
import { formatBounty } from "@/lib/format";

export default function Home() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const { isMuted, toggleMute } = useSound();
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
  const [hakiTutorialOpen, setHakiTutorialOpen] = useState(false);
  const [profilePlayer, setProfilePlayer] = useState<LeaderboardEntryResponse | null>(null);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (isLoading || !user || hasFetched.current) return;
    hasFetched.current = true;

    async function fetchAll() {
      const hakiTutorialSeen = localStorage.getItem("last-island-haki-tutorial-seen");
      const [gamesResult, logResult, leaderboardResult] = await Promise.allSettled([
        listGames({ page: 0, size: 5 }),
        getBattleLog({ page: 0, size: 5 }),
        getLeaderboard(),
      ]);

      if (gamesResult.status === "fulfilled") {
        setGamesPage(gamesResult.value);
      } else {
        setError("Failed to load games");
      }
      setLoadingGames(false);

      if (logResult.status === "fulfilled") {
        setBattleLog(logResult.value);
      }
      setLoadingBattleLog(false);

      if (leaderboardResult.status === "fulfilled") {
        setLeaderboard(leaderboardResult.value);
      }
      setLoadingLeaderboard(false);

      if (!hakiTutorialSeen) {
        try {
          const hakiProfile = await getHakiProfile();
          if (hakiProfile.hakiPointsAvailable > 0) {
            setHakiTutorialOpen(true);
          }
        } catch {
          // Non-critical
        }
      }
    }

    setLoadingGames(true);
    setLoadingBattleLog(true);
    setLoadingLeaderboard(true);
    fetchAll();
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
              priority
            />
            <h1 className="text-2xl font-bold text-text-primary">
              {`Welcome${user ? `, ${user.name}` : ""}`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-secondary border border-border text-text-secondary hover:bg-surface-elevated hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <Link
              href="/haki"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 hover:border-purple-400 hover:text-purple-200 transition-colors"
              aria-label="Haki"
            >
              👁
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-secondary border border-border text-text-secondary hover:bg-surface-elevated hover:border-primary/40 hover:text-primary transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50 hover:border-red-400 hover:text-red-300 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              ⏻
            </button>
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
                🏆 Leaderboard
              </h2>

              {loadingLeaderboard && (
                <div className="space-y-2">
                  <Skeleton height="3.5rem" className="w-full rounded-lg" />
                  <Skeleton height="3.5rem" className="w-full rounded-lg" />
                  <Skeleton height="3.5rem" className="w-full rounded-lg" />
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
                  <div className="rounded-xl border border-border bg-surface overflow-hidden">
                    {/* Top 3 podium */}
                    {leaderboard.entries.filter(e => e.position <= 3).length > 0 && (
                      <div className="grid grid-cols-3 gap-px bg-border-light">
                        {[2, 1, 3].map((pos) => {
                          const entry = leaderboard.entries.find(e => e.position === pos);
                          if (!entry) return <div key={pos} className="bg-surface-secondary/30 p-3" />;
                          const avatarBg = entry.avatar
                            ? `/avatars/${entry.avatar.toLowerCase()}/${entry.avatar.toLowerCase()}-bg-02.jpg`
                            : null;
                          const medalEmoji = pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉";
                          const isFirst = pos === 1;
                          return (
                            <div
                              key={pos}
                              className={[
                                "relative flex flex-col items-center gap-1.5 overflow-hidden cursor-pointer",
                                isFirst ? "p-4 py-5" : "p-3 pt-6",
                                entry.isCurrentUser ? "ring-2 ring-inset ring-primary/50" : "",
                              ].filter(Boolean).join(" ")}
                              onClick={() => setProfilePlayer(entry)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfilePlayer(entry); } }}
                            >
                              {/* Avatar background */}
                              {avatarBg && (
                                <div className="absolute inset-0 overflow-hidden">
                                  <div
                                    className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 -rotate-90 bg-contain bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url(${avatarBg})` }}
                                  />
                                </div>
                              )}
                              {/* Color gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
                              {/* Medal badge */}
                              <span className={`relative z-10 ${isFirst ? "text-2xl" : "text-lg"}`}>{medalEmoji}</span>
                              <AvatarIcon avatar={entry.avatar} rank={entry.rank} size={isFirst ? "lg" : "md"} className="relative z-10" priority />
                              <p className={`relative z-10 font-bold text-white truncate max-w-full text-center drop-shadow-md ${isFirst ? "text-base" : "text-sm"}`}>
                                {entry.name}
                              </p>
                              <p className="relative z-10 text-xs font-bold text-secondary drop-shadow-md">
                                {formatBounty(entry.bounty)} ₿
                              </p>
                              <p className="relative z-10 text-[10px] text-white/70">
                                {entry.wins}W · {Math.round(entry.winRate * 100)}%
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rest of rankings */}
                    <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-border-light">
                      {leaderboard.entries.filter(e => e.position > 3).map((entry) => (
                        <div
                          key={`${entry.position}-${entry.name}`}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-secondary cursor-pointer ${
                            entry.isCurrentUser ? "bg-primary/5 border-l-2 border-l-primary" : ""
                          }`}
                          onClick={() => setProfilePlayer(entry)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfilePlayer(entry); } }}
                        >
                          <span className="w-6 text-center text-xs font-bold text-text-muted">
                            {entry.position}
                          </span>
                          <AvatarIcon avatar={entry.avatar} rank={entry.rank} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {entry.name}
                            </p>
                            <p className="text-xs text-text-muted">
                              {entry.rank.replace("_", " ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-secondary">
                              {formatBounty(entry.bounty)} ₿
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {entry.wins}W · {Math.round(entry.winRate * 100)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Your position — pinned footer */}
                    {(() => {
                      const userEntry =
                        leaderboard.currentUserEntry ??
                        leaderboard.entries.find((e) => e.isCurrentUser);
                      if (!userEntry) return null;
                      const rankBg: Record<string, string> = {
                        default: "bg-surface-secondary/50",
                        rising: "bg-blue-950/40 border-t-blue-500/30",
                        elite: "bg-yellow-950/30 border-t-yellow-500/30",
                        legendary: "bg-purple-950/30 border-t-purple-500/30",
                        mythical: "bg-red-950/30 border-t-red-500/30",
                        king: "bg-white/5 border-t-white/30",
                      };
                      const tier = getRankTier(userEntry.rank);
                      return (
                        <div
                          className={`border-t flex items-center gap-3 px-4 py-2.5 cursor-pointer ${rankBg[tier] || rankBg.default}`}
                          onClick={() => setProfilePlayer(userEntry)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfilePlayer(userEntry); } }}
                        >
                          <span className="w-6 text-center text-xs font-bold text-primary">
                            {userEntry.position}
                          </span>
                          <AvatarIcon avatar={userEntry.avatar} rank={userEntry.rank} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {userEntry.name} <span className="text-xs text-primary">(you)</span>
                            </p>
                            <p className="text-xs text-text-muted">
                              {userEntry.rank.replace("_", " ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-secondary">
                              {formatBounty(userEntry.bounty)} ₿
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {userEntry.wins}W · {Math.round(userEntry.winRate * 100)}%
                            </p>
                          </div>
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
                      className={[
                        "group flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-all duration-150",
                        entry.result === "VICTORY"
                          ? "bg-green-950/20 border-green-500/20 hover:bg-green-950/30"
                          : "bg-red-950/20 border-red-500/20 hover:bg-red-950/30",
                      ].join(" ")}
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
                      const gameRankBg: Record<string, string> = {
                        default: "bg-surface",
                        rising: "bg-blue-950/40",
                        elite: "bg-yellow-950/30",
                        legendary: "bg-purple-950/30",
                        mythical: "bg-red-950/30",
                        king: "bg-white/5",
                      };
                      return (
                        <button
                          key={game.id || game.token}
                          type="button"
                          onClick={() => handleJoinFromList(game.token)}
                          disabled={joiningGame}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${style.border} ${style.glow} ${gameRankBg[tier] || gameRankBg.default} hover:bg-surface-secondary transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
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

      <HakiTutorialModal
        open={hakiTutorialOpen}
        onClose={() => setHakiTutorialOpen(false)}
      />

      <PlayerProfileModal
        open={!!profilePlayer}
        onClose={() => setProfilePlayer(null)}
        player={profilePlayer}
      />
    </div>
  );
}
