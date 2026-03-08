import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, router_id, command, params } = body;

    // Get router details from DB
    const { data: router, error: routerError } = await supabase
      .from("mikrotik_routers")
      .select("*")
      .eq("id", router_id)
      .single();

    if (routerError || !router) {
      return new Response(
        JSON.stringify({ error: "Router não encontrado", details: routerError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = `https://${router.ip_address}:${router.port}/rest`;

    switch (action) {
      case "test_connection": {
        // Try to get system identity
        const result = await mikrotikRequest(baseUrl, router.username, router.password, "/system/identity");
        
        // Update router status
        if (result.success) {
          await supabase
            .from("mikrotik_routers")
            .update({
              status: "online",
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", router_id);
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_info": {
        // Get system resource info
        const [identity, resource, routerboard] = await Promise.all([
          mikrotikRequest(baseUrl, router.username, router.password, "/system/identity"),
          mikrotikRequest(baseUrl, router.username, router.password, "/system/resource"),
          mikrotikRequest(baseUrl, router.username, router.password, "/system/routerboard"),
        ]);

        if (identity.success) {
          // Update router info in DB
          const resourceData = resource.data?.[0] || resource.data || {};
          const rbData = routerboard.data?.[0] || routerboard.data || {};
          
          await supabase
            .from("mikrotik_routers")
            .update({
              status: "online",
              last_seen_at: new Date().toISOString(),
              firmware_version: resourceData.version || null,
              model: rbData.model || null,
              serial_number: rbData["serial-number"] || null,
              uptime: resourceData.uptime || null,
            })
            .eq("id", router_id);
        }

        return new Response(
          JSON.stringify({
            success: identity.success,
            identity: identity.data,
            resource: resource.data,
            routerboard: routerboard.data,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_interfaces": {
        const result = await mikrotikRequest(baseUrl, router.username, router.password, "/interface");
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_ip_addresses": {
        const result = await mikrotikRequest(baseUrl, router.username, router.password, "/ip/address");
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_dhcp_leases": {
        const result = await mikrotikRequest(baseUrl, router.username, router.password, "/ip/dhcp-server/lease");
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "run_command": {
        if (!command) {
          return new Response(JSON.stringify({ error: "Comando não especificado" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await mikrotikRequest(baseUrl, router.username, router.password, command, params);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function mikrotikRequest(
  baseUrl: string,
  username: string,
  password: string,
  path: string,
  params?: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    if (err.name === "AbortError") {
      return { success: false, error: "Timeout: Não foi possível conectar ao router em 10s. Verifique se o IP é acessível pela internet." };
    }
    return { success: false, error: err.message };
  }
}
