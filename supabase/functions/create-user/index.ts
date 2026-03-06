import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, full_name, role, setup_key } = await req.json();

    // For initial setup (no users exist yet), use a setup key
    // For subsequent users, verify the caller is an admin
    const authHeader = req.headers.get("Authorization");

    // Check if this is initial setup
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    const isInitialSetup = (count === 0);

    if (!isInitialSetup) {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const isSetupCall = setup_key === serviceRoleKey;

      if (!isSetupCall) {
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Não autorizado" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const token = authHeader.replace("Bearer ", "");
        
        // Create a client with the caller's token to verify identity
        const supabaseCaller = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: claimsData, error: claimsError } = await supabaseCaller.auth.getClaims(token);
        
        if (claimsError || !claimsData?.claims) {
          return new Response(JSON.stringify({ error: "Token inválido" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const callerId = claimsData.claims.sub;

        const { data: callerRole } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", caller.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!callerRole) {
          return new Response(JSON.stringify({ error: "Apenas administradores podem criar usuários" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign role
    const userRole = isInitialSetup ? "admin" : (role || "technician");
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: userRole,
    });

    // Save initial password to profile for admin reference
    await supabaseAdmin.from("profiles").update({
      initial_password: password,
    }).eq("id", newUser.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: newUser.user.id, email: newUser.user.email, role: userRole },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
