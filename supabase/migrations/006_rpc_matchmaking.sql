-- Migration 006: RPC Matchmaking Logic

CREATE OR REPLACE FUNCTION find_and_join_pvp_match(
    p_player_id UUID,
    p_squad_id UUID
) RETURNS UUID AS $$
DECLARE
    v_match_id UUID;
BEGIN
    -- Try to find an existing waiting match and lock it for update
    SELECT id INTO v_match_id
    FROM pvp_matches
    WHERE status = 'waiting' 
      AND player_a_id != p_player_id
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_match_id IS NOT NULL THEN
        -- We found a match, join as player B
        UPDATE pvp_matches
        SET player_b_id = p_player_id,
            squad_b_id = p_squad_id,
            status = 'starting'
        WHERE id = v_match_id;
        
        RETURN v_match_id;
    ELSE
        -- No match found, create a new one as player A
        INSERT INTO pvp_matches (player_a_id, squad_a_id, status)
        VALUES (p_player_id, p_squad_id, 'waiting')
        RETURNING id INTO v_match_id;
        
        RETURN v_match_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
