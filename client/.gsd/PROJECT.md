# Project Vision

## What
Last Island Client — the web frontend for a multiplayer naval battle game (Battleship) with One Piece theming. Connects to the Spring Boot backend via REST + WebSocket (STOMP). Players register, create/join matches, place ships, and battle in real-time on 10×10 boards with fog of war.

## Stack
- React 19 + Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- State management: TBD (decide when WebSocket integration begins)
- WebSocket client: TBD (likely @stomp/stompjs, decide later)
- Deployment: Vercel

## Constraints
- Must consume the existing Spring Boot REST API (JWT auth, game CRUD, board/ship placement, shooting)
- Must handle STOMP WebSocket events for real-time turn notifications
- Server-authoritative: client never has opponent board state, only shot results
- Minimal/clean design first; One Piece theming comes later (v2)
- Responsive but desktop-first (naval battle grid needs space)
- All auth tokens stored securely (httpOnly cookies or secure storage pattern)

## Out of scope
- One Piece theming / skins (v2)
- Mobile native app
- Offline mode
- Chat system
- Spectator mode
- AI opponents
