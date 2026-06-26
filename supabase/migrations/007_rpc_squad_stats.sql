-- Migration 007: RPC Squad Stats Calculation

CREATE OR REPLACE FUNCTION get_squad_stats(p_squad_id UUID)
RETURNS json AS $$
DECLARE
    v_attack NUMERIC := 0;
    v_defense NUMERIC := 0;
    v_players_count INT := 0;
BEGIN
    -- This is a simplified logic. In a real scenario, we'd join with player_ratings
    -- and calculate based on their specific position (GK, DEF, MID, ATT).
    -- For now, we simulate pulling their overall rating from player_ratings.
    
    SELECT 
        COALESCE(AVG(pr.overall) FILTER (WHERE sp.position_in_formation IN ('FW', 'AM')), 75),
        COALESCE(AVG(pr.overall) FILTER (WHERE sp.position_in_formation IN ('GK', 'CB', 'LB', 'RB', 'DM')), 75),
        COUNT(*)
    INTO v_attack, v_defense, v_players_count
    FROM pvp_squad_players sp
    JOIN player_seasons ps ON ps.id = sp.player_season_id
    JOIN player_ratings pr ON pr.player_season_id = ps.id
    WHERE sp.pvp_squad_id = p_squad_id AND sp.is_starting_xi = true;

    -- Fallbacks if squad is empty (e.g. testing)
    IF v_players_count = 0 THEN
        v_attack := 75;
        v_defense := 75;
    END IF;

    RETURN json_build_object(
        'attack', ROUND(v_attack, 1),
        'defense', ROUND(v_defense, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
