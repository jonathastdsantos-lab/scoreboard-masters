import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { simulateBlock } from "../_shared/math.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { match_id } = await req.json();

    // 1. Fetch match details
    const { data: match, error: matchError } = await supabaseClient
      .from('pvp_matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchError || !match) throw new Error("Match not found");
    if (match.status === 'finished' || match.status === 'abandoned') {
      return new Response(JSON.stringify({ message: "Match already ended" }), { headers: corsHeaders });
    }

    // 2. Fetch stats via RPC
    const { data: statsA } = await supabaseClient.rpc('get_squad_stats', { p_squad_id: match.squad_a_id });
    const { data: statsB } = await supabaseClient.rpc('get_squad_stats', { p_squad_id: match.squad_b_id });

    // 3. Count current blocks simulated
    const { data: events, error: evtErr } = await supabaseClient
      .from('pvp_match_events')
      .select('*')
      .eq('match_id', match_id)
      .eq('event_type', 'block_end');
      
    const currentBlock = events ? events.length : 0;

    // Check Halftime logic (Block 4 ended = 45 mins)
    if (currentBlock === 4 && match.status !== 'second_half') {
      // Pause for halftime. Client needs to submit tactics and call resume
      await supabaseClient.from('pvp_matches').update({ status: 'halftime' }).eq('id', match_id);
      return new Response(JSON.stringify({ message: "Halftime reached" }), { headers: corsHeaders });
    }

    if (currentBlock >= 9) {
      // End match
      await supabaseClient.from('pvp_matches').update({ status: 'finished' }).eq('id', match_id);
      // In a real scenario, we'd calculate ELO here.
      return new Response(JSON.stringify({ message: "Match finished" }), { headers: corsHeaders });
    }

    // 4. Simulate the next block
    const blockNumber = currentBlock + 1;
    const result = simulateBlock(match_id, blockNumber, statsA, statsB);

    // 5. Insert block event
    await supabaseClient.from('pvp_match_events').insert({
      match_id: match_id,
      event_type: 'block_end',
      minute: blockNumber * 10,
      description: `Block ${blockNumber} completed`
    });

    // 6. Insert goal event if anyone scored
    if (result.scoringTeam) {
      const isTeamA = result.scoringTeam === 'A';
      await supabaseClient.from('pvp_match_events').insert({
        match_id: match_id,
        event_type: 'goal',
        player_id: isTeamA ? match.player_a_id : match.player_b_id, // placeholder for actual scorer
        minute: (blockNumber * 10) - Math.floor(Math.random() * 9), // Random minute within the block
        description: `GOL DO TIME ${result.scoringTeam}!`
      });
      
      // Update score in pvp_matches
      const updateField = isTeamA ? { score_a: match.score_a + 1 } : { score_b: match.score_b + 1 };
      await supabaseClient.from('pvp_matches').update(updateField).eq('id', match_id);
    }

    if (match.status === 'starting') {
       await supabaseClient.from('pvp_matches').update({ status: 'first_half' }).eq('id', match_id);
    }

    return new Response(
      JSON.stringify({ message: "Block simulated", block: blockNumber, goal: result.scoringTeam }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
