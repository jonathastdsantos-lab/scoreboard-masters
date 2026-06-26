-- Migration 004: Rankings & Private Leagues

CREATE TABLE IF NOT EXISTS private_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL CHECK (char_length(invite_code) = 6),
    league_pool_id UUID REFERENCES league_pools(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_league_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    private_league_id UUID REFERENCES private_leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(private_league_id, user_id)
);

CREATE TABLE IF NOT EXISTS elo_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    league_pool_id UUID REFERENCES league_pools(id) ON DELETE CASCADE,
    elo_score INT DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, league_pool_id)
);

CREATE TABLE IF NOT EXISTS elo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elo_ranking_id UUID REFERENCES elo_rankings(id) ON DELETE CASCADE,
    match_id UUID REFERENCES pvp_matches(id) ON DELETE SET NULL,
    elo_before INT NOT NULL,
    elo_after INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_private_leagues_updated_at ON private_leagues;
CREATE TRIGGER set_private_leagues_updated_at BEFORE UPDATE ON private_leagues FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_private_league_members_updated_at ON private_league_members;
CREATE TRIGGER set_private_league_members_updated_at BEFORE UPDATE ON private_league_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_elo_rankings_updated_at ON elo_rankings;
CREATE TRIGGER set_elo_rankings_updated_at BEFORE UPDATE ON elo_rankings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE private_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read private_leagues they are members of" ON private_leagues;
CREATE POLICY "Users can read private_leagues they are members of" ON private_leagues FOR SELECT USING (
    id IN (SELECT private_league_id FROM private_league_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners can manage their private leagues" ON private_leagues;
CREATE POLICY "Owners can manage their private leagues" ON private_leagues FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can read private_league_members" ON private_league_members;
CREATE POLICY "Members can read private_league_members" ON private_league_members FOR SELECT USING (
    private_league_id IN (SELECT private_league_id FROM private_league_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can join private leagues" ON private_league_members;
CREATE POLICY "Users can join private leagues" ON private_league_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can delete members" ON private_league_members;
CREATE POLICY "Owners can delete members" ON private_league_members FOR DELETE USING (
    private_league_id IN (SELECT id FROM private_leagues WHERE owner_id = auth.uid())
);

-- Elo is public for rankings
DROP POLICY IF EXISTS "Public read for elo_rankings" ON elo_rankings;
CREATE POLICY "Public read for elo_rankings" ON elo_rankings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own elo history" ON elo_history;
CREATE POLICY "Users can read own elo history" ON elo_history FOR SELECT USING (
    elo_ranking_id IN (SELECT id FROM elo_rankings WHERE user_id = auth.uid())
);
