"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GameEventHandlers,
  ConnectedEventData,
  OpponentJoinedEventData,
  ShipsPlacedEventData,
  ShotReceivedEventData,
  GameOverEventData,
  TurnExpiredEventData,
  GameExpiredEventData,
  SurrenderEventData,
  ObservationHakiUsedEventData,
  ArmamentHakiTriggeredEventData,
  ConquerorsHakiUsedEventData,
  DeploymentCancelledEventData,
} from "@/types/game-events";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 8000;

export function useGameEvents(
  gameToken: string,
  handlers: GameEventHandlers,
  enabled: boolean = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<GameEventHandlers>(handlers);
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
      const url = `${basePath}/games/${gameToken}/events`;
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      function handleConnected(event: MessageEvent) {
        const data: ConnectedEventData = event.data
          ? JSON.parse(event.data)
          : {};
        retryCountRef.current = 0;
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

      function handleTurnExpired(event: MessageEvent) {
        const data: TurnExpiredEventData = JSON.parse(event.data);
        handlersRef.current.onTurnExpired?.(data);
      }

      function handleGameExpired(event: MessageEvent) {
        const data: GameExpiredEventData = event.data
          ? JSON.parse(event.data)
          : {};
        handlersRef.current.onGameExpired?.(data);
      }

      function handleSurrender(event: MessageEvent) {
        const data: SurrenderEventData = JSON.parse(event.data);
        handlersRef.current.onSurrender?.(data);
      }

      function handleObservationHakiUsed(event: MessageEvent) {
        const data: ObservationHakiUsedEventData = event.data ? JSON.parse(event.data) : {};
        handlersRef.current.onObservationHakiUsed?.(data);
      }

      function handleArmamentHakiTriggered(event: MessageEvent) {
        const data: ArmamentHakiTriggeredEventData = JSON.parse(event.data);
        handlersRef.current.onArmamentHakiTriggered?.(data);
      }

      function handleArmamentHakiDefended() {
        handlersRef.current.onArmamentHakiDefended?.();
      }

      function handleConquerorsHakiUsed(event: MessageEvent) {
        const data: ConquerorsHakiUsedEventData = JSON.parse(event.data);
        handlersRef.current.onConquerorsHakiUsed?.(data);
      }

      function handleDeploymentCancelled(event: MessageEvent) {
        const data: DeploymentCancelledEventData = event.data ? JSON.parse(event.data) : {};
        handlersRef.current.onDeploymentCancelled?.(data);
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

      es.addEventListener("CONNECTED", handleConnected);
      es.addEventListener("OPPONENT_JOINED", handleOpponentJoined);
      es.addEventListener("SHIPS_PLACED", handleShipsPlaced);
      es.addEventListener("SHOT_RECEIVED", handleShotReceived);
      es.addEventListener("GAME_OVER", handleGameOver);
      es.addEventListener("TURN_EXPIRED", handleTurnExpired);
      es.addEventListener("GAME_EXPIRED", handleGameExpired);
      es.addEventListener("SURRENDER", handleSurrender);
      es.addEventListener("OBSERVATION_HAKI_USED", handleObservationHakiUsed);
      es.addEventListener("ARMAMENT_HAKI_TRIGGERED", handleArmamentHakiTriggered);
      es.addEventListener("ARMAMENT_HAKI_DEFENDED", handleArmamentHakiDefended);
      es.addEventListener("CONQUERORS_HAKI_USED", handleConquerorsHakiUsed);
      es.addEventListener("DEPLOYMENT_CANCELLED", handleDeploymentCancelled);
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
  }, [gameToken, enabled]);

  return { connected };
}
