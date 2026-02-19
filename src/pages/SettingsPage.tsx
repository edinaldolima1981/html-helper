import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, ShieldCheck, Bell, Lock, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [wifi, setWifi] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [wifiRes, sysRes] = await Promise.all([
        supabase.from("wifi_settings").select("*").limit(1).maybeSingle(),
        supabase.from("system_settings").select("*").limit(1).maybeSingle(),
      ]);
      setWifi(wifiRes.data);
      setSystem(sysRes.data);
      setLoading(false);
    })();
  }, []);

  const saveWifi = async () => {
    if (!wifi) return;
    setSaving(true);
    await supabase.from("wifi_settings").update({
      ssid: wifi.ssid, password: wifi.password, channel: wifi.channel,
      band: wifi.band, guest_ssid: wifi.guest_ssid, guest_password: wifi.guest_password, guest_enabled: wifi.guest_enabled,
    }).eq("id", wifi.id);
    await supabase.from("activity_log").insert({ user_id: user?.id, action: "Configurações WiFi atualizadas" });
    toast({ title: "Salvo", description: "Configurações WiFi atualizadas." });
    setSaving(false);
  };

  const saveSystem = async () => {
    if (!system) return;
    setSaving(true);
    await supabase.from("system_settings").update({
      security_pin: system.security_pin, auto_block_unknown: system.auto_block_unknown,
      notifications_enabled: system.notifications_enabled,
    }).eq("id", system.id);
    await supabase.from("activity_log").insert({ user_id: user?.id, action: "Configurações do sistema atualizadas" });
    toast({ title: "Salvo", description: "Configurações do sistema atualizadas." });
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas administradores podem alterar configurações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie as configurações do seu WiFi e do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WiFi Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Wifi className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Configurações do WiFi</h3>
              <p className="text-sm text-muted-foreground">Gerencie sua rede principal</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nome da Rede (SSID)</label>
              <Input value={wifi?.ssid || ""} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nova Senha</label>
              <Input type="password" value={wifi?.password || ""} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} placeholder="••••••••" />
              <p className="mt-1 text-xs text-muted-foreground">Deixe em branco para manter a senha atual</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Canal</label>
                <Select value={String(wifi?.channel || 6)} onValueChange={(v) => setWifi({ ...wifi, channel: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    {[1, 6, 11, 36, 40, 44, 48].map((c) => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Banda</label>
                <Select value={wifi?.band || "2.4GHz"} onValueChange={(v) => setWifi({ ...wifi, band: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.4GHz">2.4 GHz</SelectItem>
                    <SelectItem value="5GHz">5 GHz</SelectItem>
                    <SelectItem value="Dual">Dual Band</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveWifi} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* System Settings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Configurações do Sistema</h3>
              <p className="text-sm text-muted-foreground">Segurança e notificações</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">PIN de Segurança</label>
              <Input type="password" maxLength={4} value={system?.security_pin || ""} onChange={(e) => setSystem({ ...system, security_pin: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">PIN de 4 dígitos para comandos críticos</p>
            </div>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={system?.notifications_enabled || false}
                  onChange={(e) => setSystem({ ...system, notifications_enabled: e.target.checked })}
                  className="h-5 w-5 rounded text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Notificações</p>
                  <p className="text-sm text-muted-foreground">Receber alertas de atividades</p>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={system?.auto_block_unknown || false}
                  onChange={(e) => setSystem({ ...system, auto_block_unknown: e.target.checked })}
                  className="h-5 w-5 rounded text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Bloqueio Automático</p>
                  <p className="text-sm text-muted-foreground">Bloquear dispositivos desconhecidos</p>
                </div>
                <Lock className="h-5 w-5 text-muted-foreground" />
              </label>
            </div>
            <Button onClick={saveSystem} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
