import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Key, Wifi, List, HelpCircle } from "lucide-react";

const quickCommands = [
  { label: "Trocar Senha", icon: Key, command: "TROCAR_SENHA" },
  { label: "WiFi Visitante", icon: Wifi, command: "WIFI_VISITANTE" },
  { label: "Listar Dispositivos", icon: List, command: "LISTAR_DISPOSITIVOS" },
  { label: "Ajuda", icon: HelpCircle, command: "AJUDA" },
];

const commandResponses: Record<string, string> = {
  TROCAR_SENHA: "🔐 Senha alterada com sucesso!\nNova senha: WiFi@2024\nTodos os dispositivos precisarão reconectar.",
  WIFI_VISITANTE: "📶 WiFi Visitante ativado!\nRede: Visitante\nSenha: visit2024\nExpira em: 24 horas",
  LISTAR_DISPOSITIVOS: "📱 Dispositivos conectados:\n1. iPhone de João - 192.168.1.10\n2. Notebook Ana - 192.168.1.11\n3. Smart TV Sala - 192.168.1.12",
  AJUDA: "📋 Comandos disponíveis:\n• TROCAR_SENHA - Altera a senha do WiFi\n• WIFI_VISITANTE - Ativa rede visitante\n• LISTAR_DISPOSITIVOS - Lista conectados\n• AJUDA - Mostra esta mensagem",
};

export default function WhatsApp() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (content: string, isCommand = false, commandType?: string) => {
    // User message
    await supabase.from("whatsapp_messages").insert({
      sender: "user",
      content,
      is_command: isCommand,
      command_type: commandType,
    });

    // Simulated system response
    const response = commandType
      ? commandResponses[commandType] || "Comando não reconhecido."
      : "Mensagem recebida! Use um comando rápido ou digite AJUDA.";

    await supabase.from("whatsapp_messages").insert({
      sender: "system",
      content: response,
    });

    await supabase.from("activity_log").insert({
      user_id: user?.id,
      action: "Comando WhatsApp",
      details: commandType || content,
    });

    fetchMessages();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const cmd = input.trim().toUpperCase();
    const isKnown = Object.keys(commandResponses).includes(cmd);
    sendMessage(input.trim(), isKnown, isKnown ? cmd : undefined);
    setInput("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Controle via WhatsApp</h1>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Quick Commands */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Comandos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickCommands.map((qc) => (
              <Button
                key={qc.command}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => sendMessage(qc.command, true, qc.command)}
              >
                <qc.icon className="h-4 w-4" />
                {qc.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-success" />
              WIFIControl Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 overflow-auto p-4" style={{ maxHeight: "400px" }}>
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Envie um comando para começar
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-3 flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] whitespace-pre-line rounded-xl px-4 py-2.5 text-sm ${
                      m.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {m.content}
                    <p className={`mt-1 text-[10px] ${m.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t p-3">
              <Input
                placeholder="Digite um comando..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
