-- ============================================================
-- V1: Create all domain tables for Last Island
-- ============================================================

-- 1. users (no FKs)
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    name          VARCHAR(255) NOT NULL UNIQUE,
    filiation     VARCHAR(10)  NOT NULL,
    bounty        BIGINT       NOT NULL DEFAULT 0,
    rank          VARCHAR(50)  NOT NULL,
    wins          INTEGER      NOT NULL DEFAULT 0,
    losses        INTEGER      NOT NULL DEFAULT 0,
    total_shots   INTEGER      NOT NULL DEFAULT 0,
    total_hits    INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 2. boards (FK → users)
CREATE TABLE boards (
    id            UUID PRIMARY KEY,
    owner_id      UUID         NOT NULL REFERENCES users(id),
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_boards_owner_id ON boards(owner_id);

-- 3. ships (FK → boards)
CREATE TABLE ships (
    id            UUID PRIMARY KEY,
    board_id      UUID         NOT NULL REFERENCES boards(id),
    type          VARCHAR(20)  NOT NULL,
    orientation   VARCHAR(10)  NOT NULL,
    "row"         INTEGER      NOT NULL,
    col           INTEGER      NOT NULL,
    hits          INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_ships_board_id ON ships(board_id);

-- 4. shots (FKs → boards, users)
CREATE TABLE shots (
    id            UUID PRIMARY KEY,
    board_id      UUID         NOT NULL REFERENCES boards(id),
    attacker_id   UUID         NOT NULL REFERENCES users(id),
    "row"         INTEGER      NOT NULL,
    col           INTEGER      NOT NULL,
    result        VARCHAR(10)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_shots_board_id ON shots(board_id);
CREATE INDEX idx_shots_attacker_id ON shots(attacker_id);

-- 5. games (FKs → boards, users — all nullable)
CREATE TABLE games (
    id              UUID PRIMARY KEY,
    blue_board_id   UUID         REFERENCES boards(id),
    red_board_id    UUID         REFERENCES boards(id),
    current_turn_id UUID         REFERENCES users(id),
    phase           VARCHAR(20)  NOT NULL,
    started_at      TIMESTAMP,
    ended_at        TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL,
    updated_at      TIMESTAMP    NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_games_blue_board_id ON games(blue_board_id);
CREATE INDEX idx_games_red_board_id ON games(red_board_id);
CREATE INDEX idx_games_current_turn_id ON games(current_turn_id);

-- 6. game_results (FKs → games, users)
CREATE TABLE game_results (
    id            UUID PRIMARY KEY,
    game_id       UUID         NOT NULL UNIQUE REFERENCES games(id),
    winner_id     UUID         NOT NULL REFERENCES users(id),
    loser_id      UUID         NOT NULL REFERENCES users(id),
    turns         INTEGER      NOT NULL,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_game_results_winner_id ON game_results(winner_id);
CREATE INDEX idx_game_results_loser_id ON game_results(loser_id);
