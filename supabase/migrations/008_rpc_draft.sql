-- Migration 008: RPC Draft Generator

CREATE OR REPLACE FUNCTION roll_draft_players(p_position TEXT, p_limit INT)
RETURNS TABLE (
    player_id UUID,
    player_season_id UUID,
    full_name TEXT,
    overall INT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as player_id,
        ps.id as player_season_id,
        p.full_name,
        pr.overall,
        'https://ui-avatars.com/api/?name=' || REPLACE(p.full_name, ' ', '+') || '&background=random' as avatar_url
    FROM player_ratings pr
    JOIN player_seasons ps ON pr.player_season_id = ps.id
    JOIN players p ON p.id = ps.player_id
    WHERE p.position = p_position
    -- We use a weighted random order: higher overall = slightly less chance to appear every time,
    -- but for simplicity now we just use random().
    ORDER BY random()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
