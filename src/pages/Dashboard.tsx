import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Smartphone, ShieldAlert, Wifi, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [wifiSettings, setWifiSettings] = useState<any>(null);

  const fetchData = async () => {
    const [devRes, actRes, wifiRes] = await Promise.all([
      supabase.from("devices").select("*"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("wifi_settings").select("*").limit(1).maybeSingle(),
    ]);
    setDevices(devRes.data || []);
    setActivities(actRes.data || []);
    setWifiSettings(wifiRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalDevices = devices.length;
  const blocked = devices.filter((d) => d.status === "blocked").length;

  const handlePanicMode = async () => {
    await supabase.from("devices").update({ status: "blocked" }).neq("status", "blocked");
    await supabase.from("activity_log").insert({
      user_id: user?.id, action: "Modo Pânico ativado", details: "Todos os dispositivos foram bloqueados",
    });
    toast({ title: "🚨 Modo Pânico", description: "Todos os dispositivos foram bloqueados." });
    fetchData();
  };

  const handleGuestWifi = async () => {
    if (!wifiSettings) return;
    await supabase.from("wifi_settings").update({ guest_enabled: !wifiSettings.guest_enabled }).eq("id", wifiSettings.id);
    await supabase.from("activity_log").insert({
      user_id: user?.id, action: wifiSettings.guest_enabled ? "WiFi Visitante desativado" : "WiFi Visitante ativado",
    });
    toast({ title: "WiFi Visitante", description: wifiSettings.guest_enabled ? "Desativado" : "Ativado com sucesso" });
    fetchData();
  };

  const stats = [
    { label: "Comandos Totais", value: activities.length.toString(), icon: MessageSquare, bg: "bg-info/10", iconColor: "text-info" },
    { label: "Dispositivos", value: totalDevices.toString(), icon: Smartphone, bg: "bg-purple-50", iconColor: "text-purple-600" },
    { label: "Bloqueados", value: blocked.toString(), icon: ShieldAlert, bg: "bg-destructive/10", iconColor: "text-destructive" },
    { label: "Status WiFi", value: "Online", icon: Wifi, bg: "bg-success/10", iconColor: "text-success", valueColor: "text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="gradient-bg rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao WIFIControl Pro!</h2>
        <p className="text-white/80">Controle sua rede WiFi de forma simples e rápida através do WhatsApp.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.valueColor || "text-foreground"}`}>{s.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WiFi Status */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Status do WiFi</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="font-medium text-foreground">Online</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rede Principal</span>
              <span className="font-medium">{wifiSettings?.ssid || "..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rede Visitante</span>
              <span className={wifiSettings?.guest_enabled ? "font-medium" : "text-muted-foreground"}>
                {wifiSettings?.guest_enabled ? wifiSettings?.guest_ssid : "Inativa"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Ações Rápidas</h3>
          <button
            onClick={handlePanicMode}
            className="mb-2 flex w-full items-center gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-destructive transition-colors hover:bg-destructive/20"
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Ativar Modo Pânico</span>
          </button>
          <button
            onClick={handleGuestWifi}
            className="flex w-full items-center gap-3 rounded-lg bg-info/10 px-4 py-3 text-info transition-colors hover:bg-info/20"
          >
            <Wifi className="h-5 w-5" />
            <span>{wifiSettings?.guest_enabled ? "Desativar" : "Criar"} WiFi Visitante</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h3 className="font-semibold text-foreground">Atividade Recente</h3>
        </div>
        {activities.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            <Clock className="mx-auto mb-3 h-12 w-12 text-border" />
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
