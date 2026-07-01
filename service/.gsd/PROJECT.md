# Project Vision

## What
Last Island — a multiplayer naval battle game (Battleship) with One Piece theming. Two players compete in turn-based combat on 10×10 boards with fog of war. Server is authoritative: clients never receive opponent board state. Web interface with real-time WebSocket communication.

## Stack
- Java 21, Spring Boot 4.1, Maven
- Spring WebMVC + WebSocket (STOMP)
- Spring Security (user auth)
- PostgreSQL + Flyway (persistence & migrations)
- Lombok (boilerplate reduction)
- JUnit 5 + Spring Boot Test (automated testing)
- Future: web frontend (not in this repo)

## Constraints
- Server-authoritative: opponent board state must NEVER leak to the client
- Multiplayer: exactly 2 players per match, alternating turns
- Standard fleet: 5 ships (sizes 5, 4, 3, 3, 2)
- Board: 10×10 grid
- Shot results: MISS, HIT, SUNK (revealing ship type)
- Must be deployed and publicly accessible
- Automated tests covering all domain rules
- Clean architecture: well-separated domains

## Out of scope
- AI/bot opponents
- Spectator mode
- Chat system
- Ranking/ELO
- Mobile native apps
- More than 2 players per match
