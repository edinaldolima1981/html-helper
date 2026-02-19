import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Monitor, ShieldBan, Wifi, AlertTriangle, Clock, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [wifiSettings, setWifiSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [devRes, actRes, wifiRes] = await Promise.all([
      supabase.from("devices").select("*"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("wifi_settings").select("*").limit(1).maybeSingle(),
    ]);
    setDevices(devRes.data || []);
    setActivities(actRes.data || []);
    setWifiSettings(wifiRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalDevices = devices.length;
  const blocked = devices.filter((d) => d.status === "blocked").length;
  const connected = devices.filter((d) => d.status === "connected").length;

  const handlePanicMode = async () => {
    const { error } = await supabase
      .from("devices")
      .update({ status: "blocked" })
      .neq("status", "blocked");
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: "Modo Pânico ativado",
        details: "Todos os dispositivos foram bloqueados",
      });
      toast({ title: "🚨 Modo Pânico", description: "Todos os dispositivos foram bloqueados." });
      fetchData();
    }
  };

  const handleGuestWifi = async () => {
    if (!wifiSettings) return;
    const { error } = await supabase
      .from("wifi_settings")
      .update({ guest_enabled: !wifiSettings.guest_enabled })
      .eq("id", wifiSettings.id);
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: wifiSettings.guest_enabled ? "WiFi Visitante desativado" : "WiFi Visitante ativado",
      });
      toast({ title: "WiFi Visitante", description: wifiSettings.guest_enabled ? "Desativado" : "Ativado com sucesso" });
      fetchData();
    }
  };

  const stats = [
    { label: "Comandos Totais", value: activities.length.toString(), icon: Terminal, color: "text-primary" },
    { label: "Dispositivos", value: totalDevices.toString(), icon: Monitor, color: "text-success" },
    { label: "Bloqueados", value: blocked.toString(), icon: ShieldBan, color: "text-destructive" },
    { label: "Conectados", value: connected.toString(), icon: Wifi, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] p-6 text-white">
        <h1 className="text-2xl font-bold">Bem-vindo ao WIFIControl Pro</h1>
        <p className="mt-1 text-sm text-white/80">Gerencie sua rede WiFi com controle total.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-accent p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* WiFi Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4 text-primary" />
              Status do WiFi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
              <div>
                <p className="text-sm font-medium">{wifiSettings?.ssid || "..."}</p>
                <p className="text-xs text-muted-foreground">Rede Principal</p>
              </div>
              <Badge variant="default" className="bg-success">Ativa</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
              <div>
                <p className="text-sm font-medium">{wifiSettings?.guest_ssid || "Visitante"}</p>
                <p className="text-xs text-muted-foreground">Rede Visitante</p>
              </div>
              <Badge variant={wifiSettings?.guest_enabled ? "default" : "secondary"}>
                {wifiSettings?.guest_enabled ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handlePanicMode}
            >
              <WifiOff className="h-4 w-4" />
              Modo Pânico — Bloquear Todos
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleGuestWifi}
            >
              <Wifi className="h-4 w-4" />
              {wifiSettings?.guest_enabled ? "Desativar" : "Ativar"} WiFi Visitante
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.action}</p>
                    {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
