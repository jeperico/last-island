ALTER TABLE games ADD COLUMN token VARCHAR(6) UNIQUE;
CREATE INDEX idx_games_token ON games(token);
