# Project: Last Island

## Description

Last Island is a multiplayer naval battle game (Battleship) themed around One Piece. Two players choose a filiation (Pirate or Marine), place fleets on a 10×10 sea chart, and take turns firing cannonballs until one fleet is sunk. The game uses real-time Server-Sent Events for turn notifications and features a dark nautical UI with One Piece theming.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 4.1, PostgreSQL, Flyway, Maven |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zod, react-hook-form |
| Real-time | Server-Sent Events (SSE) |
| Testing | JUnit 5 + Mockito (backend), ESLint (frontend) |
| Infra (local) | Docker Compose (Postgres), Makefile orchestration |

## Production Infrastructure

| Component | Platform | Details |
|-----------|----------|---------|
| Backend service | Render (Web Service) | Deployed via Dockerfile |
| Database | Render (PostgreSQL) | Managed Postgres instance |
| Frontend | Vercel | Next.js deployment |

## Hard Constraints

- No Spring context in unit tests (fast tests only, `@ExtendWith(MockitoExtension.class)`)
- One Piece naming conventions for enums, error messages, and UI copy (see `.kiro/steering/one-piece-naming.md`)
- Dark-only theme (no light mode toggle)
- Java 21 minimum

## Out of Scope

- Mobile native apps
- Payment / monetization
- AI opponents (multiplayer only)
- Chat between players
