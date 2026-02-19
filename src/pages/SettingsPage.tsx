import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [wifi, setWifi] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const [wifiRes, sysRes] = await Promise.all([
      supabase.from("wifi_settings").select("*").limit(1).maybeSingle(),
      supabase.from("system_settings").select("*").limit(1).maybeSingle(),
    ]);
    setWifi(wifiRes.data);
    setSystem(sysRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveWifi = async () => {
    if (!wifi) return;
    setSaving(true);
    const { error } = await supabase.from("wifi_settings").update({
      ssid: wifi.ssid,
      password: wifi.password,
      channel: wifi.channel,
      band: wifi.band,
      guest_ssid: wifi.guest_ssid,
      guest_password: wifi.guest_password,
      guest_enabled: wifi.guest_enabled,
    }).eq("id", wifi.id);
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: "Configurações WiFi atualizadas",
      });
      toast({ title: "Salvo", description: "Configurações WiFi atualizadas." });
    }
    setSaving(false);
  };

  const saveSystem = async () => {
    if (!system) return;
    setSaving(true);
    const { error } = await supabase.from("system_settings").update({
      security_pin: system.security_pin,
      auto_block_unknown: system.auto_block_unknown,
      notifications_enabled: system.notifications_enabled,
    }).eq("id", system.id);
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: "Configurações do sistema atualizadas",
      });
      toast({ title: "Salvo", description: "Configurações do sistema atualizadas." });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* WiFi Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4 text-primary" />
              Configurações do WiFi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Rede (SSID)</Label>
              <Input value={wifi?.ssid || ""} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input value={wifi?.password || ""} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={String(wifi?.channel || 6)} onValueChange={(v) => setWifi({ ...wifi, channel: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 6, 11, 36, 40, 44, 48].map((c) => (
                      <SelectItem key={c} value={String(c)}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banda</Label>
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

            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium">Rede Visitante</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Ativar WiFi Visitante</Label>
                  <Switch checked={wifi?.guest_enabled || false} onCheckedChange={(v) => setWifi({ ...wifi, guest_enabled: v })} />
                </div>
                <Input placeholder="SSID Visitante" value={wifi?.guest_ssid || ""} onChange={(e) => setWifi({ ...wifi, guest_ssid: e.target.value })} />
                <Input placeholder="Senha Visitante" value={wifi?.guest_password || ""} onChange={(e) => setWifi({ ...wifi, guest_password: e.target.value })} />
              </div>
            </div>

            <Button onClick={saveWifi} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar WiFi
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Configurações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PIN de Segurança</Label>
              <Input
                type="password"
                value={system?.security_pin || ""}
                onChange={(e) => setSystem({ ...system, security_pin: e.target.value })}
                maxLength={6}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Bloqueio Automático</p>
                <p className="text-xs text-muted-foreground">Bloquear dispositivos desconhecidos automaticamente</p>
              </div>
              <Switch
                checked={system?.auto_block_unknown || false}
                onCheckedChange={(v) => setSystem({ ...system, auto_block_unknown: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Notificações</p>
                <p className="text-xs text-muted-foreground">Receber alertas de novos dispositivos</p>
              </div>
              <Switch
                checked={system?.notifications_enabled || false}
                onCheckedChange={(v) => setSystem({ ...system, notifications_enabled: v })}
              />
            </div>
            <Button onClick={saveSystem} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
