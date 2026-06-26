import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Pegar o token do usuário que chamou a function
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, pvp_squad_id } = await req.json();
    const playerId = user.id;

    if (action === "find_match") {
      // 1. Tentar encontrar alguém na fila
      const { data: match, error: matchError } = await supabaseClient.rpc('find_and_join_pvp_match', {
        p_player_id: playerId,
        p_squad_id: pvp_squad_id
      });

      if (matchError) throw matchError;

      return new Response(
        JSON.stringify({ match_id: match }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
