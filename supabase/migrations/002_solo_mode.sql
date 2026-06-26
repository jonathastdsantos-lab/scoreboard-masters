-- Migration 002: Solo Mode

CREATE TABLE IF NOT EXISTS league_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    league_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solo_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    league_pool_id UUID REFERENCES league_pools(id) ON DELETE RESTRICT,
    formation TEXT,
    current_round INT DEFAULT 1,
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solo_squad_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solo_season_id UUID REFERENCES solo_seasons(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_season_id UUID REFERENCES player_seasons(id) ON DELETE CASCADE,
    slot_position TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solo_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solo_season_id UUID REFERENCES solo_seasons(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    opponent_overall INT NOT NULL,
    score_home INT,
    score_away INT,
    result TEXT CHECK (result IN ('win', 'draw', 'loss')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL,
    league_pool_id UUID REFERENCES league_pools(id) ON DELETE RESTRICT,
    seed TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    solo_season_id UUID REFERENCES solo_seasons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_league_pools_updated_at ON league_pools;
CREATE TRIGGER set_league_pools_updated_at BEFORE UPDATE ON league_pools FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_solo_seasons_updated_at ON solo_seasons;
CREATE TRIGGER set_solo_seasons_updated_at BEFORE UPDATE ON solo_seasons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_solo_squad_players_updated_at ON solo_squad_players;
CREATE TRIGGER set_solo_squad_players_updated_at BEFORE UPDATE ON solo_squad_players FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_solo_matches_updated_at ON solo_matches;
CREATE TRIGGER set_solo_matches_updated_at BEFORE UPDATE ON solo_matches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_daily_challenges_updated_at ON daily_challenges;
CREATE TRIGGER set_daily_challenges_updated_at BEFORE UPDATE ON daily_challenges FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_daily_challenge_attempts_updated_at ON daily_challenge_attempts;
CREATE TRIGGER set_daily_challenge_attempts_updated_at BEFORE UPDATE ON daily_challenge_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE league_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_squad_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE solo_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for league_pools" ON league_pools;
CREATE POLICY "Public read for league_pools" ON league_pools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for daily_challenges" ON daily_challenges;
CREATE POLICY "Public read for daily_challenges" ON daily_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view and edit their own solo_seasons" ON solo_seasons;
CREATE POLICY "Users can view and edit their own solo_seasons" ON solo_seasons FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view and edit their own solo_squad_players" ON solo_squad_players;
CREATE POLICY "Users can view and edit their own solo_squad_players" ON solo_squad_players FOR ALL USING (
    solo_season_id IN (SELECT id FROM solo_seasons WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view and edit their own solo_matches" ON solo_matches;
CREATE POLICY "Users can view and edit their own solo_matches" ON solo_matches FOR ALL USING (
    solo_season_id IN (SELECT id FROM solo_seasons WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view and edit their own daily_challenge_attempts" ON daily_challenge_attempts;
CREATE POLICY "Users can view and edit their own daily_challenge_attempts" ON daily_challenge_attempts FOR ALL USING (auth.uid() = user_id);
