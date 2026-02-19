import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Monitor, ShieldBan, HelpCircle, RefreshCw, Lock, Unlock, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDevice, setRenameDevice] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    const { data } = await supabase.from("devices").select("*").order("name");
    setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDevices(); }, []);

  const connected = devices.filter((d) => d.status === "connected").length;
  const blocked = devices.filter((d) => d.status === "blocked").length;
  const unknown = devices.filter((d) => d.status === "unknown").length;

  const toggleBlock = async (device: any) => {
    const newStatus = device.status === "blocked" ? "connected" : "blocked";
    const { error } = await supabase.from("devices").update({ status: newStatus }).eq("id", device.id);
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: newStatus === "blocked" ? "Dispositivo bloqueado" : "Dispositivo desbloqueado",
        details: device.name,
        device_id: device.id,
      });
      toast({ title: newStatus === "blocked" ? "Bloqueado" : "Desbloqueado", description: device.name });
      fetchDevices();
    }
  };

  const handleRename = async () => {
    if (!renameDevice || !newName.trim()) return;
    const { error } = await supabase.from("devices").update({ name: newName.trim() }).eq("id", renameDevice.id);
    if (!error) {
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: "Dispositivo renomeado",
        details: `${renameDevice.name} → ${newName.trim()}`,
        device_id: renameDevice.id,
      });
      toast({ title: "Renomeado", description: newName.trim() });
      setRenameDevice(null);
      setNewName("");
      fetchDevices();
    }
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    connected: { label: "Conectado", variant: "default" },
    blocked: { label: "Bloqueado", variant: "destructive" },
    unknown: { label: "Desconhecido", variant: "secondary" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispositivos</h1>
        <Button variant="outline" size="sm" onClick={fetchDevices}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Monitor className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{connected}</p>
              <p className="text-xs text-muted-foreground">Conectados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldBan className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xl font-bold">{blocked}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <HelpCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xl font-bold">{unknown}</p>
              <p className="text-xs text-muted-foreground">Desconhecidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Dispositivos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => {
                const sc = statusConfig[d.status] || statusConfig.unknown;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.mac_address}</TableCell>
                    <TableCell className="text-sm">{d.ip_address || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleBlock(d)}
                          title={d.status === "blocked" ? "Desbloquear" : "Bloquear"}
                        >
                          {d.status === "blocked" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setRenameDevice(d); setNewName(d.name); }}
                          title="Renomear"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={!!renameDevice} onOpenChange={() => setRenameDevice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Dispositivo</DialogTitle>
          </DialogHeader>
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
