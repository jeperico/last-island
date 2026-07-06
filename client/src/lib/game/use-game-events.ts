"use client";

import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth-storage";
import type {
  GameEventHandlers,
  ConnectedEventData,
  OpponentJoinedEventData,
  ShipsPlacedEventData,
  ShotReceivedEventData,
  GameOverEventData,
} from "@/types/game-events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function useGameEvents(
  gameToken: string,
  handlers: GameEventHandlers,
  enabled: boolean = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<GameEventHandlers>(handlers);

  // Keep handlers ref up-to-date without triggering reconnect
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    const jwt = getAccessToken();
    if (!jwt) {
      return;
    }

    const url = `${API_BASE_URL}/games/${gameToken}/events?token=${encodeURIComponent(jwt)}`;
    const es = new EventSource(url);
    esRef.current = es;

    function handleConnected(event: MessageEvent) {
      const data: ConnectedEventData = event.data
        ? JSON.parse(event.data)
        : {};
      setConnected(true);
      handlersRef.current.onConnected?.(data);
    }

    function handleOpponentJoined(event: MessageEvent) {
      const data: OpponentJoinedEventData = JSON.parse(event.data);
      handlersRef.current.onOpponentJoined?.(data);
    }

    function handleShipsPlaced(event: MessageEvent) {
      const data: ShipsPlacedEventData = JSON.parse(event.data);
      handlersRef.current.onShipsPlaced?.(data);
    }

    function handleShotReceived(event: MessageEvent) {
      const data: ShotReceivedEventData = JSON.parse(event.data);
      handlersRef.current.onShotReceived?.(data);
    }

    function handleGameOver(event: MessageEvent) {
      const data: GameOverEventData = JSON.parse(event.data);
      handlersRef.current.onGameOver?.(data);
    }

    function handleError(event: Event) {
      // If token expired, close the connection
      const token = getAccessToken();
      if (!token) {
        es.close();
        setConnected(false);
      }
      handlersRef.current.onError?.(event);
    }

    es.addEventListener("CONNECTED", handleConnected);
    es.addEventListener("OPPONENT_JOINED", handleOpponentJoined);
    es.addEventListener("SHIPS_PLACED", handleShipsPlaced);
    es.addEventListener("SHOT_RECEIVED", handleShotReceived);
    es.addEventListener("GAME_OVER", handleGameOver);
    es.onerror = handleError;

    return () => {
      es.removeEventListener("CONNECTED", handleConnected);
      es.removeEventListener("OPPONENT_JOINED", handleOpponentJoined);
      es.removeEventListener("SHIPS_PLACED", handleShipsPlaced);
      es.removeEventListener("SHOT_RECEIVED", handleShotReceived);
      es.removeEventListener("GAME_OVER", handleGameOver);
      es.onerror = null;
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [gameToken, enabled]);

  return { connected };
}
