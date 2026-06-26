-- Migration 003: PvP Mode

CREATE TABLE IF NOT EXISTS pvp_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    squad_name TEXT NOT NULL,
    formation TEXT NOT NULL,
    league_pool_id UUID REFERENCES league_pools(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_squad_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pvp_squad_id UUID REFERENCES pvp_squads(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_season_id UUID REFERENCES player_seasons(id) ON DELETE CASCADE,
    slot_position TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_a_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    player_b_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    squad_a_id UUID REFERENCES pvp_squads(id) ON DELETE SET NULL,
    squad_b_id UUID REFERENCES pvp_squads(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('waiting', 'first_half', 'halftime', 'second_half', 'finished')) DEFAULT 'waiting',
    score_a INT DEFAULT 0,
    score_b INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES pvp_matches(id) ON DELETE CASCADE,
    minute INT NOT NULL,
    event_type TEXT CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'injury', 'substitution')),
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    team_side TEXT CHECK (team_side IN ('a', 'b')) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_tactical_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES pvp_matches(id) ON DELETE CASCADE,
    team_side TEXT CHECK (team_side IN ('a', 'b')) NOT NULL,
    made_at_minute INT NOT NULL,
    change_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_pvp_squads_updated_at ON pvp_squads;
CREATE TRIGGER set_pvp_squads_updated_at BEFORE UPDATE ON pvp_squads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_pvp_squad_players_updated_at ON pvp_squad_players;
CREATE TRIGGER set_pvp_squad_players_updated_at BEFORE UPDATE ON pvp_squad_players FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_pvp_matches_updated_at ON pvp_matches;
CREATE TRIGGER set_pvp_matches_updated_at BEFORE UPDATE ON pvp_matches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE pvp_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_squad_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_tactical_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own pvp_squads" ON pvp_squads;
CREATE POLICY "Users see their own pvp_squads" ON pvp_squads FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fog of war for pvp_squad_players" ON pvp_squad_players;
CREATE POLICY "Fog of war for pvp_squad_players" ON pvp_squad_players FOR SELECT USING (
    pvp_squad_id IN (SELECT id FROM pvp_squads WHERE user_id = auth.uid())
    OR
    pvp_squad_id IN (
        SELECT squad_a_id FROM pvp_matches WHERE player_b_id = auth.uid() AND status != 'waiting'
        UNION
        SELECT squad_b_id FROM pvp_matches WHERE player_a_id = auth.uid() AND status != 'waiting'
    )
);

DROP POLICY IF EXISTS "Users can edit own pvp_squad_players" ON pvp_squad_players;
CREATE POLICY "Users can edit own pvp_squad_players" ON pvp_squad_players FOR ALL USING (
    pvp_squad_id IN (SELECT id FROM pvp_squads WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can read pvp_matches" ON pvp_matches;
CREATE POLICY "Participants can read pvp_matches" ON pvp_matches FOR SELECT USING (
    auth.uid() = player_a_id OR auth.uid() = player_b_id
);

DROP POLICY IF EXISTS "Participants can read match events" ON pvp_match_events;
CREATE POLICY "Participants can read match events" ON pvp_match_events FOR SELECT USING (
    match_id IN (SELECT id FROM pvp_matches WHERE player_a_id = auth.uid() OR player_b_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can insert tactical changes" ON pvp_tactical_changes;
CREATE POLICY "Participants can insert tactical changes" ON pvp_tactical_changes FOR INSERT WITH CHECK (
    match_id IN (SELECT id FROM pvp_matches WHERE player_a_id = auth.uid() OR player_b_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can read tactical changes" ON pvp_tactical_changes;
CREATE POLICY "Participants can read tactical changes" ON pvp_tactical_changes FOR SELECT USING (
    match_id IN (SELECT id FROM pvp_matches WHERE player_a_id = auth.uid() OR player_b_id = auth.uid())
);
