-- Migration 001: Football Data & Profiles

CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    tier INT NOT NULL,
    season_length INT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    founded_year INT,
    badge_color_primary VARCHAR(7),
    badge_color_secondary VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    position TEXT CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
    nationality TEXT NOT NULL,
    birth_date DATE,
    retired BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    season_year INT NOT NULL,
    stats_raw JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_season_id UUID REFERENCES player_seasons(id) ON DELETE CASCADE,
    overall INT CHECK (overall BETWEEN 1 AND 99),
    finishing INT CHECK (finishing BETWEEN 1 AND 99),
    passing INT CHECK (passing BETWEEN 1 AND 99),
    defending INT CHECK (defending BETWEEN 1 AND 99),
    physical INT CHECK (physical BETWEEN 1 AND 99),
    pace INT CHECK (pace BETWEEN 1 AND 99),
    rating_formula_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_seed TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at (Requires a reusable function)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leagues_updated_at ON leagues;
CREATE TRIGGER set_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_clubs_updated_at ON clubs;
CREATE TRIGGER set_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_players_updated_at ON players;
CREATE TRIGGER set_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_player_seasons_updated_at ON player_seasons;
CREATE TRIGGER set_player_seasons_updated_at BEFORE UPDATE ON player_seasons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_player_ratings_updated_at ON player_ratings;
CREATE TRIGGER set_player_ratings_updated_at BEFORE UPDATE ON player_ratings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Policies
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Read access for everyone
DROP POLICY IF EXISTS "Public read access for leagues" ON leagues;
CREATE POLICY "Public read access for leagues" ON leagues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for clubs" ON clubs;
CREATE POLICY "Public read access for clubs" ON clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for players" ON players;
CREATE POLICY "Public read access for players" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for player_seasons" ON player_seasons;
CREATE POLICY "Public read access for player_seasons" ON player_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for player_ratings" ON player_ratings;
CREATE POLICY "Public read access for player_ratings" ON player_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for profiles" ON profiles;
CREATE POLICY "Public read access for profiles" ON profiles FOR SELECT USING (true);
