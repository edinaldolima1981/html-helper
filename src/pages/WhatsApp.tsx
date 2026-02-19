import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Phone, User, Tag, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";

const quickCommands = [
  { label: "Trocar Senha", command: "Quero trocar a senha do meu wifi" },
  { label: "Trocar Nome da Rede", command: "Quero mudar o nome da minha rede wifi" },
  { label: "WiFi Visitante", command: "Criar wifi visitante por 24h" },
  { label: "Listar Dispositivos", command: "Quem está usando meu wifi?" },
  { label: "Ajuda", command: "Ajuda" },
];

interface Client {
  id: string;
  full_name: string;
  phone: string;
  plan: string | null;
}

interface AiResponse {
  intent: string;
  understood: boolean;
  client_provided_value: string | null;
  suggestions: string[];
  response: string;
  needs_confirmation: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  created_at: string;
  suggestions?: string[];
  intent?: string;
}

export default function WhatsApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Buscar clientes cadastrados
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from("clients").select("id, full_name, phone, plan").order("full_name");
      setClients(data || []);
    };
    fetchClients();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: true });
    setMessages((data || []).map((m: any) => ({ ...m, suggestions: undefined, intent: undefined })));
  };

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const processWithAI = async (content: string): Promise<AiResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-ai", {
        body: { message: content, clientName: selectedClient?.full_name || "Cliente" },
      });
      if (error) throw error;
      return data as AiResponse;
    } catch (e) {
      console.error("AI error:", e);
      toast({ title: "Erro", description: "Falha ao processar comando com IA.", variant: "destructive" });
      return null;
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedClient || loading) return;
    setLoading(true);

    // Add user message instantly
    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Save user message to DB
    await supabase.from("whatsapp_messages").insert({ sender: "user", content, is_command: true });

    // Process with AI
    const aiResult = await processWithAI(content);

    let responseText: string;
    let suggestions: string[] = [];
    let intent: string = "unknown";

    if (aiResult) {
      responseText = aiResult.response;
      suggestions = aiResult.suggestions || [];
      intent = aiResult.intent;
    } else {
      responseText = "Desculpe, não consegui processar seu comando. Tente novamente.";
    }

    // Save system response to DB
    await supabase.from("whatsapp_messages").insert({ sender: "system", content: responseText });

    // Add system message with suggestions
    const systemMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "system",
      content: responseText,
      created_at: new Date().toISOString(),
      suggestions,
      intent,
    };
    setMessages((prev) => [...prev, systemMsg]);

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user?.id,
      action: "Comando WhatsApp (IA)",
      details: `${selectedClient.full_name}: ${content}`,
    });

    setLoading(false);
  };

  const handleSuggestionClick = async (suggestion: string, intent: string) => {
    if (!selectedClient || loading) return;
    setLoading(true);

    const confirmMsg =
      intent === "change_password"
        ? `Quero usar a senha: ${suggestion}`
        : intent === "change_ssid"
        ? `Quero usar o nome: ${suggestion}`
        : suggestion;

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      content: confirmMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    await supabase.from("whatsapp_messages").insert({ sender: "user", content: confirmMsg, is_command: true });

    const successText =
      intent === "change_password"
        ? `✅ Senha WiFi alterada com sucesso!\nNova senha: **${suggestion}**\nTodos os dispositivos precisarão reconectar.`
        : intent === "change_ssid"
        ? `✅ Nome da rede alterado com sucesso!\nNovo nome: **${suggestion}**\nTodos os dispositivos precisarão reconectar.`
        : `✅ Ação confirmada: ${suggestion}`;

    await supabase.from("whatsapp_messages").insert({ sender: "system", content: successText });

    const sysMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "system",
      content: successText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, sysMsg]);

    await supabase.from("activity_log").insert({
      user_id: user?.id,
      action: intent === "change_password" ? "Senha WiFi alterada (IA)" : "Nome rede alterado (IA)",
      details: `${selectedClient.full_name}: ${suggestion}`,
    });

    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const filteredClients = clients.filter((c) => {
    if (!phoneSearch) return true;
    const search = phoneSearch.toLowerCase();
    return c.full_name.toLowerCase().includes(search) || c.phone.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Controle via WhatsApp</h2>
        <p className="text-muted-foreground mt-1">Selecione um cliente cadastrado para simular comandos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "600px" }}>
        {/* Conversations Panel */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <MessageSquare className="h-5 w-5 text-success" />
              Clientes
            </h3>
          </div>
          <div className="border-b px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: "calc(100% - 104px)" }}>
            {filteredClients.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum resultado encontrado"}
              </p>
            )}
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`flex w-full items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent ${
                  selectedClient?.id === client.id ? "border-l-4 border-l-primary bg-accent" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <Phone className="h-5 w-5 text-success" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium text-foreground truncate">{client.full_name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(client.phone)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col overflow-hidden rounded-xl border bg-card lg:col-span-2">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <User className="h-5 w-5 text-success" />
            </div>
            <div>
              {selectedClient ? (
                <>
                  <p className="font-medium text-foreground">{selectedClient.full_name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    {formatPhone(selectedClient.phone)}
                    {selectedClient.plan && (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{selectedClient.plan}</span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Nenhum cliente selecionado</p>
                  <p className="text-sm text-muted-foreground">Selecione um cliente na lista</p>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/50 p-4">
            {!selectedClient && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">← Selecione um cliente para iniciar</p>
              </div>
            )}
            {selectedClient && messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5">
                  <p className="text-sm">👋 Olá, {selectedClient.full_name.split(" ")[0]}! Sou o WIFIControl Pro. Mande sua mensagem por texto ou voz que eu entendo!</p>
                  <p className="mt-1 text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
            )}
            {selectedClient &&
              messages.map((m) => (
                <div key={m.id}>
                  <div className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] whitespace-pre-line px-4 py-2.5 text-sm ${
                        m.sender === "user"
                          ? "rounded-2xl rounded-br-sm bg-success text-white"
                          : "rounded-2xl rounded-bl-sm border bg-card text-foreground"
                      }`}
                    >
                      {m.content}
                      <p className={`mt-1 text-[10px] ${m.sender === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion buttons */}
                  {m.sender === "system" && m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-2">
                      {m.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(s, m.intent || "unknown")}
                          disabled={loading}
                          className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                        >
                          {m.intent === "change_password" ? "🔑" : m.intent === "change_ssid" ? "📶" : "✅"} {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick commands */}
          {selectedClient && (
            <div className="flex items-center gap-2 overflow-x-auto border-t bg-muted/50 px-4 py-2">
              <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              {quickCommands.map((qc) => (
                <button
                  key={qc.label}
                  onClick={() => sendMessage(qc.command)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={selectedClient ? "Digite um comando ou mande como se fosse áudio transcrito..." : "Selecione um cliente primeiro"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={!selectedClient || loading}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!selectedClient || loading}
                className="rounded-lg bg-success px-4 py-2.5 text-white transition-colors hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
