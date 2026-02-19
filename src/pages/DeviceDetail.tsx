import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Wifi, WifiOff, Server, MapPin, Clock, Cpu, Hash } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  serial_number: string;
  mac_address: string;
  ip_address: string | null;
  status: string;
  signal_level: number | null;
  client_name: string | null;
  location: string | null;
  firmware: string | null;
  uptime: string | null;
  notes: string | null;
  created_at: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  created_at: string;
  is_command: boolean;
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch equipment
      const { data: eq } = await supabase.from("equipment").select("*").eq("id", id!).single();
      setEquipment(eq as Equipment | null);

      // Fetch messages - get all messages (in a real scenario we'd filter by client)
      if (eq?.client_name) {
        // Get all whatsapp messages ordered by date
        const { data: msgs } = await supabase
          .from("whatsapp_messages")
          .select("*")
          .order("created_at", { ascending: true });
        setMessages((msgs as Message[]) || []);
      }

      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/devices")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-center text-muted-foreground">Equipamento não encontrado</p>
      </div>
    );
  }

  const infoItems = [
    { icon: Server, label: "Tipo / Modelo", value: `${equipment.type} • ${equipment.model}` },
    { icon: Hash, label: "Serial", value: equipment.serial_number },
    { icon: Wifi, label: "IP / MAC", value: `${equipment.ip_address || "N/A"} • ${equipment.mac_address}` },
    { icon: Cpu, label: "Firmware", value: equipment.firmware || "N/A" },
    { icon: Clock, label: "Uptime", value: equipment.uptime || "N/A" },
    { icon: MapPin, label: "Localização", value: equipment.location || "N/A" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/devices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            equipment.status === "online" ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {equipment.status === "online" ? (
              <Wifi className="h-6 w-6 text-success" />
            ) : (
              <WifiOff className="h-6 w-6 text-destructive" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{equipment.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                equipment.status === "online" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {equipment.status === "online" ? "Online" : "Offline"}
              </span>
              {equipment.client_name && (
                <span className="text-sm text-muted-foreground">• Cliente: {equipment.client_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Equipment Info */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="font-semibold text-foreground">Informações do Equipamento</h3>
          </div>
          <div className="divide-y">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-5 py-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
            {equipment.signal_level != null && (
              <div className="flex items-center gap-3 px-5 py-3">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Nível de Sinal</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{equipment.signal_level} dBm</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          equipment.signal_level > -60 ? "bg-success" : equipment.signal_level > -75 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (100 + equipment.signal_level) * 1.5))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {equipment.notes && (
            <div className="border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm text-foreground mt-1">{equipment.notes}</p>
            </div>
          )}
        </div>

        {/* Conversation History */}
        <div className="rounded-xl border bg-card flex flex-col" style={{ maxHeight: "70vh" }}>
          <div className="border-b px-5 py-4">
            <h3 className="font-semibold text-foreground">
              Histórico de Conversas com IA
            </h3>
            {equipment.client_name && (
              <p className="text-xs text-muted-foreground mt-0.5">Cliente: {equipment.client_name}</p>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground text-sm">
              Nenhuma conversa registrada para este cliente
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.content}
                      <p className={`mt-1 text-[10px] ${
                        m.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}>
                        {new Date(m.created_at).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
