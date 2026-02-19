import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Wifi, WifiOff, Radio, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
}

export default function Devices() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("equipment").select("*").order("name");
      setEquipment((data as Equipment[]) || []);
    };
    fetch();
  }, []);

  const online = equipment.filter((e) => e.status === "online").length;
  const offline = equipment.filter((e) => e.status === "offline").length;
  const total = equipment.length;

  const filtered = equipment.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.ip_address?.includes(search) ||
      e.mac_address.toLowerCase().includes(search.toLowerCase())
  );

  const counters = [
    { label: "Total RBs", value: total, icon: Radio, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Online", value: online, icon: Wifi, bg: "bg-success/10", iconColor: "text-success" },
    { label: "Offline", value: offline, icon: WifiOff, bg: "bg-destructive/10", iconColor: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Estações Radio Base</h2>
        <p className="text-muted-foreground mt-1">Monitore suas RBs e acesse o histórico de atendimento dos clientes</p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-4">
        {counters.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cliente, IP ou MAC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Equipment Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((eq) => (
          <button
            key={eq.id}
            onClick={() => navigate(`/devices/${eq.id}`)}
            className="group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  eq.status === "online" ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  {eq.status === "online" ? (
                    <Wifi className="h-5 w-5 text-success" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{eq.type} • {eq.model}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                eq.status === "online" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {eq.status === "online" ? "Online" : "Offline"}
              </span>
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              {eq.client_name && (
                <p>👤 {eq.client_name}</p>
              )}
              <p>📡 {eq.ip_address || "Sem IP"} • {eq.mac_address}</p>
              {eq.signal_level != null && (
                <div className="flex items-center gap-2">
                  <span>📶 {eq.signal_level} dBm</span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        eq.signal_level > -60 ? "bg-success" : eq.signal_level > -75 ? "bg-warning" : "bg-destructive"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (100 + eq.signal_level) * 1.5))}%` }}
                    />
                  </div>
                </div>
              )}
              {eq.location && <p>📍 {eq.location}</p>}
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhuma RB encontrada
          </div>
        )}
      </div>
    </div>
  );
}
