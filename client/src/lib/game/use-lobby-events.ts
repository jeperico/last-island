"use client";

import { useEffect, useRef, useState } from "react";
import type {
  LobbyEventHandlers,
  GameCreatedEventData,
  GameRemovedEventData,
} from "@/types/game-events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 8000;

export function useLobbyEvents(
  handlers: LobbyEventHandlers,
  enabled: boolean = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<LobbyEventHandlers>(handlers);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep handlers ref up-to-date without triggering reconnect
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let aborted = false;

    function connect() {
      if (aborted) return;

      const basePath = API_BASE_URL || "/api";
      const url = `${basePath}/lobby/events`;
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      function handleLobbyConnected(event: MessageEvent) {
        void event;
        retryCountRef.current = 0;
        setConnected(true);
      }

      function handleGameCreated(event: MessageEvent) {
        const data: GameCreatedEventData = JSON.parse(event.data);
        handlersRef.current.onGameCreated?.(data);
      }

      function handleGameRemoved(event: MessageEvent) {
        const data: GameRemovedEventData = JSON.parse(event.data);
        handlersRef.current.onGameRemoved?.(data);
      }

      function handleError(event: Event) {
        es.close();
        setConnected(false);

        if (aborted) return;

        retryCountRef.current += 1;

        if (retryCountRef.current > MAX_RETRIES) {
          handlersRef.current.onError?.(event);
          return;
        }

        const delay = Math.min(
          BASE_BACKOFF_MS * Math.pow(2, retryCountRef.current - 1),
          MAX_BACKOFF_MS,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      }

      es.addEventListener("LOBBY_CONNECTED", handleLobbyConnected);
      es.addEventListener("GAME_CREATED", handleGameCreated);
      es.addEventListener("GAME_REMOVED", handleGameRemoved);
      es.onerror = handleError;
    }

    connect();

    return () => {
      aborted = true;

      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
