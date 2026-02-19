import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wifi, ShieldAlert, HelpCircle, Lock, Unlock, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [renameDevice, setRenameDevice] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const fetchDevices = async () => {
    const { data } = await supabase.from("devices").select("*").order("name");
    setDevices(data || []);
  };

  useEffect(() => { fetchDevices(); }, []);

  const connected = devices.filter((d) => d.status === "connected").length;
  const blocked = devices.filter((d) => d.status === "blocked").length;
  const unknown = devices.filter((d) => d.status === "unknown").length;

  const toggleBlock = async (device: any) => {
    const newStatus = device.status === "blocked" ? "connected" : "blocked";
    await supabase.from("devices").update({ status: newStatus }).eq("id", device.id);
    await supabase.from("activity_log").insert({
      user_id: user?.id,
      action: newStatus === "blocked" ? "Dispositivo bloqueado" : "Dispositivo desbloqueado",
      details: device.name, device_id: device.id,
    });
    toast({ title: newStatus === "blocked" ? "Bloqueado" : "Desbloqueado", description: device.name });
    fetchDevices();
  };

  const handleRename = async () => {
    if (!renameDevice || !newName.trim()) return;
    await supabase.from("devices").update({ name: newName.trim() }).eq("id", renameDevice.id);
    await supabase.from("activity_log").insert({
      user_id: user?.id, action: "Dispositivo renomeado",
      details: `${renameDevice.name} → ${newName.trim()}`, device_id: renameDevice.id,
    });
    toast({ title: "Renomeado", description: newName.trim() });
    setRenameDevice(null); setNewName(""); fetchDevices();
  };

  const counters = [
    { label: "Conectados", value: connected, icon: Wifi, bg: "bg-success/10", iconColor: "text-success" },
    { label: "Bloqueados", value: blocked, icon: ShieldAlert, bg: "bg-destructive/10", iconColor: "text-destructive" },
    { label: "Desconhecidos", value: unknown, icon: HelpCircle, bg: "bg-warning/10", iconColor: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dispositivos Conectados</h2>
        <p className="text-muted-foreground mt-1">Gerencie os dispositivos conectados à sua rede WiFi</p>
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

      {/* Devices List */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold text-foreground">Lista de Dispositivos</h3>
          <button onClick={fetchDevices} className="text-sm font-medium text-primary hover:text-primary/80">
            Atualizar
          </button>
        </div>
        <div className="divide-y">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  d.status === "connected" ? "bg-success/10" : d.status === "blocked" ? "bg-destructive/10" : "bg-warning/10"
                }`}>
                  <Wifi className={`h-5 w-5 ${
                    d.status === "connected" ? "text-success" : d.status === "blocked" ? "text-destructive" : "text-warning"
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{d.name}</p>
                  <p className="text-sm text-muted-foreground">{d.mac_address} • {d.ip_address || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  d.status === "connected"
                    ? "bg-success/10 text-success"
                    : d.status === "blocked"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"
                }`}>
                  {d.status === "connected" ? "Conectado" : d.status === "blocked" ? "Bloqueado" : "Desconhecido"}
                </span>
                <button
                  onClick={() => toggleBlock(d)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                  title={d.status === "blocked" ? "Desbloquear" : "Bloquear"}
                >
                  {d.status === "blocked" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { setRenameDevice(d); setNewName(d.name); }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                  title="Renomear"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!renameDevice} onOpenChange={() => setRenameDevice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear Dispositivo</DialogTitle></DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Novo nome" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDevice(null)}>Cancelar</Button>
            <Button onClick={handleRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
