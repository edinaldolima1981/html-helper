import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Phone, User, Tag } from "lucide-react";

const quickCommands = [
  { label: "Trocar Senha", command: "Trocar senha wifi para NovaSenha123" },
  { label: "WiFi Visitante", command: "Criar wifi visitante por 24h" },
  { label: "Listar Dispositivos", command: "Quem está usando wifi?" },
  { label: "Ajuda", command: "Ajuda" },
];

const commandResponses: Record<string, string> = {
  ajuda: "📋 Comandos disponíveis:\n• trocar senha - Altera a senha do WiFi\n• wifi visitante - Ativa rede visitante\n• listar dispositivos - Lista conectados\n• ajuda - Mostra esta mensagem",
};

function getResponse(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("senha")) return "🔐 Senha alterada com sucesso!\nNova senha configurada.\nTodos os dispositivos precisarão reconectar.";
  if (lower.includes("visitante")) return "📶 WiFi Visitante ativado!\nRede: Visitante\nSenha: visit2024\nExpira em: 24 horas";
  if (lower.includes("quem") || lower.includes("listar") || lower.includes("dispositivo")) return "📱 Dispositivos conectados:\n1. iPhone de João - 192.168.1.10\n2. Notebook Ana - 192.168.1.11\n3. Smart TV Sala - 192.168.1.12";
  if (lower.includes("ajuda")) return commandResponses.ajuda;
  return "Comando não reconhecido. Digite \"ajuda\" para ver os comandos disponíveis.";
}

export default function WhatsApp() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (content: string) => {
    await supabase.from("whatsapp_messages").insert({ sender: "user", content, is_command: true });
    const response = getResponse(content);
    await supabase.from("whatsapp_messages").insert({ sender: "system", content: response });
    await supabase.from("activity_log").insert({ user_id: user?.id, action: "Comando WhatsApp", details: content });
    fetchMessages();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Controle via WhatsApp</h2>
        <p className="text-muted-foreground mt-1">Simule comandos e visualize conversas do WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "600px" }}>
        {/* Conversations Panel */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <MessageSquare className="h-5 w-5 text-success" />
              Conversas
            </h3>
          </div>
          <div className="overflow-y-auto" style={{ height: "calc(100% - 52px)" }}>
            <button className="flex w-full items-center gap-3 border-b border-l-4 border-l-primary bg-accent px-4 py-3 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">+55 11 99999-9999</p>
                <p className="text-sm text-muted-foreground">Toque para conversar</p>
              </div>
            </button>
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
              <p className="font-medium text-foreground">+55 11 99999-9999</p>
              <p className="flex items-center gap-1 text-sm text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/50 p-4">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5">
                  <p className="text-sm">👋 Olá! Sou o WIFIControl Pro. Digite "ajuda" para ver os comandos disponíveis.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] whitespace-pre-line px-4 py-2.5 text-sm ${
                  m.sender === "user"
                    ? "rounded-2xl rounded-br-sm bg-success text-white"
                    : "rounded-2xl rounded-bl-sm border bg-card text-foreground"
                }`}>
                  {m.content}
                  <p className={`mt-1 text-[10px] ${m.sender === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Quick commands */}
          <div className="flex items-center gap-2 overflow-x-auto border-t bg-muted/50 px-4 py-2">
            <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            {quickCommands.map((qc) => (
              <button
                key={qc.label}
                onClick={() => sendMessage(qc.command)}
                className="whitespace-nowrap rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {qc.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite um comando..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                className="rounded-lg bg-success px-4 py-2.5 text-white transition-colors hover:bg-success/90"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
