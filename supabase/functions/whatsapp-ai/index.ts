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
    const { message, clientName, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o assistente WIFIControl Pro de um provedor de internet.
O cliente "${clientName}" enviou uma mensagem (pode ser transcrição de áudio, texto com erros ortográficos, gírias ou linguagem informal).

REGRAS DE INTERPRETAÇÃO DE LINGUAGEM NATURAL:
- Interprete mensagens com erros de português, abreviações, gírias e linguagem informal
- Exemplos de variações que DEVEM ser reconhecidas:
  * Bloqueio: "boqueia", "blokeia", "tira da rede", "chuta", "expulsa", "remove", "desconecta", "chuta fora", "bota pra fora", "tira o acesso"
  * Senha: "muda a pass", "troca o pass", "nova pass", "muda o password", "altera a chave"
  * Nome da rede: "muda o nome", "troca o ssid", "renomeia"
  * Dispositivos: "quem ta usando", "quem tá", "mostra quem ta", "lista os devices", "quais devices", "ver dispositivos"
  * Ajuda: "socorro", "help", "o que vc faz", "o que voce faz", "menu", "opções"
- USE O HISTÓRICO DA CONVERSA para entender o contexto. Se o cliente disser "bloqueia o primeiro" ou "bloqueia o celular da lista", olhe a última listagem de dispositivos no histórico.

Sua tarefa:
1. Identificar a INTENÇÃO do cliente interpretando linguagem natural:
   - "change_password": qualquer intenção de trocar/mudar/alterar senha, pass, password, chave wifi
   - "change_ssid": qualquer intenção de trocar/mudar nome da rede, ssid, nome do wifi
   - "guest_wifi": wifi visitante, rede para convidados, acesso temporário, wifi de visita
   - "list_devices": qualquer intenção de ver/listar/mostrar quem está conectado, dispositivos, devices
   - "block_device": qualquer intenção de bloquear/remover/expulsar/tirar/desconectar um dispositivo específico ou referência a dispositivo da lista anterior
   - "help": pedido de ajuda, lista de comandos, o que o bot faz
   - "unknown": mensagens completamente fora do contexto

2. Se for troca de senha ou nome de rede:
   - Verifique se o cliente já informou o valor desejado na mensagem.
   - Se SIM: confirme a alteração com o valor informado e coloque em "client_provided_value".
   - Se NÃO: ofereça exatamente 3 sugestões criativas e seguras em "suggestions".
3. Para senhas sugeridas: use 8-12 caracteres com letras e números, fáceis de lembrar.
4. Para nomes de rede sugeridos: use nomes curtos, criativos e sem caracteres especiais.
5. Para "list_devices": responda com uma lista de 3-5 dispositivos conectados simulados. Formate CADA dispositivo em uma linha separada:
📱 Celular Android — 192.168.1.10
💻 Notebook — 192.168.1.11
📺 Smart TV — 192.168.1.12
🖥️ Desktop — 192.168.1.13
🎮 Console — 192.168.1.14
Use emojis diferentes para cada tipo. Coloque linha introdutória antes e mensagem de encerramento após.
6. Para "block_device": identifique o dispositivo pela mensagem OU pelo contexto do histórico (se o cliente referenciar "o primeiro", "o celular da lista", etc.). Coloque o nome/IP em "client_provided_value". Responda de forma engraçada dizendo que não entendeu direito mas que vai bloquear mesmo assim.
7. Para "help": liste os comandos disponíveis de forma clara e amigável.

IMPORTANTE: Responda SEMPRE em JSON válido com esta estrutura EXATA (sem markdown, sem texto fora do JSON):
{
  "intent": "change_password" | "change_ssid" | "guest_wifi" | "list_devices" | "block_device" | "help" | "unknown",
  "understood": true/false,
  "client_provided_value": "valor informado pelo cliente ou nome/IP do dispositivo" ou null,
  "suggestions": ["sugestao1", "sugestao2", "sugestao3"] ou [],
  "response": "mensagem amigável para o cliente",
  "needs_confirmation": false
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
            // Include conversation history for context (last 10 messages)
            ...(Array.isArray(history) ? history.slice(-10).map((h: { sender: string; content: string }) => ({
              role: h.sender === "user" ? "user" : "assistant",
              content: h.content,
            })) : []),
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
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
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
