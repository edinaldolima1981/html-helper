import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, clientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o assistente WIFIControl Pro de um provedor de internet.
O cliente "${clientName}" enviou uma mensagem (pode ser transcrição de áudio ou texto).

Sua tarefa:
1. Identificar a INTENÇÃO do cliente com base nos exemplos abaixo:
   - "change_password": trocar senha, mudar senha, nova senha, alterar senha do wifi
   - "change_ssid": trocar nome da rede, mudar o nome do wifi, renomear a rede
   - "guest_wifi": wifi visitante, rede para convidados, acesso temporário
   - "list_devices": quem está usando meu wifi, listar dispositivos, ver quem está conectado, dispositivos conectados, quem está na minha rede, mostrar dispositivos
   - "help": ajuda, o que posso fazer, comandos disponíveis, menu
   - "unknown": qualquer outra coisa que não se encaixe acima

2. Se for troca de senha ou nome de rede:
   - Verifique se o cliente já informou o valor desejado na mensagem.
   - Se SIM: confirme a alteração com o valor informado.
   - Se NÃO: ofereça exatamente 3 sugestões criativas e seguras.
3. Para senhas sugeridas: use 8-12 caracteres com letras e números, fáceis de lembrar.
4. Para nomes de rede sugeridos: use nomes curtos, criativos e sem caracteres especiais.
5. Para "list_devices": responda com uma lista simulada de 3-5 dispositivos conectados (ex: Celular Android, Notebook, Smart TV, etc.) de forma amigável.
6. Para "help": liste os comandos disponíveis de forma clara.

IMPORTANTE: Responda SEMPRE em JSON válido com esta estrutura EXATA (sem markdown, sem texto fora do JSON):
{
  "intent": "change_password" | "change_ssid" | "guest_wifi" | "list_devices" | "help" | "unknown",
  "understood": true/false,
  "client_provided_value": "valor que o cliente informou" ou null,
  "suggestions": ["sugestao1", "sugestao2", "sugestao3"] ou [],
  "response": "mensagem amigável para o cliente",
  "needs_confirmation": true/false
}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        intent: "unknown",
        understood: false,
        client_provided_value: null,
        suggestions: [],
        response: content || "Não entendi o comando. Digite 'ajuda' para ver as opções.",
        needs_confirmation: false,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
