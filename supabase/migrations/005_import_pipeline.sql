-- Migration 005: Add External IDs for API-Football Integration

ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id INT UNIQUE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS external_id INT UNIQUE;

-- We need to add a unique constraint on player_seasons to allow upserts.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_player_season') THEN
        ALTER TABLE player_seasons ADD CONSTRAINT unique_player_season UNIQUE (player_id, club_id, league_id, season_year);
    END IF;
END $$;

-- We also need a unique constraint on player_ratings to allow the rating script to upsert
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_player_season_rating') THEN
        ALTER TABLE player_ratings ADD CONSTRAINT unique_player_season_rating UNIQUE (player_season_id);
    END IF;
END $$;
