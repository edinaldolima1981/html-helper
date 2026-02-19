import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Server, Plus, Search, Wifi, WifiOff, Signal, Edit2, Trash2, RefreshCw, Settings2, UserX,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhone } from "@/lib/phone";

type Equipment = {
  id: string;
  name: string;
  type: string;
  model: string;
  serial_number: string;
  mac_address: string;
  ip_address: string | null;
  status: string;
  signal_level: number | null;
  uptime: string | null;
  firmware: string | null;
  location: string | null;
  client_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Client = {
  id: string;
  full_name: string;
  nickname: string | null;
  phone: string;
  city: string;
  address: string;
};

const emptyForm = {
  name: "", type: "ONU", model: "", serial_number: "", mac_address: "",
  ip_address: "", status: "offline", firmware: "", location: "", client_name: "", notes: "",
};

export default function Provisioning() {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [unprovisionedClients, setUnprovisionedClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: equipData }, { data: clientsData }] = await Promise.all([
      supabase.from("equipment").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name, nickname, phone, city, address").order("full_name"),
    ]);

    const equip = (equipData as Equipment[]) || [];
    setEquipment(equip);

    // Clientes cujo nome não aparece em nenhum equipamento
    const provisionedNames = new Set(
      equip.map((e) => e.client_name?.toLowerCase().trim()).filter(Boolean)
    );
    const unprovisioned = (clientsData as Client[] || []).filter(
      (c) => !provisionedNames.has(c.full_name.toLowerCase().trim())
    );
    setUnprovisionedClients(unprovisioned);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = equipment.filter((e) => {
    const matchSearch = [e.name, e.serial_number, e.mac_address, e.client_name, e.model]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = (clientName?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, client_name: clientName || "" });
    setDialogOpen(true);
  };
  const openEdit = (e: Equipment) => {
    setEditingId(e.id);
    setForm({
      name: e.name, type: e.type, model: e.model, serial_number: e.serial_number,
      mac_address: e.mac_address, ip_address: e.ip_address || "", status: e.status,
      firmware: e.firmware || "", location: e.location || "", client_name: e.client_name || "", notes: e.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.mac_address) {
      toast({ title: "Erro", description: "Nome e MAC são obrigatórios.", variant: "destructive" });
      return;
    }
    const payload = { ...form, ip_address: form.ip_address || null, firmware: form.firmware || null, location: form.location || null, client_name: form.client_name || null, notes: form.notes || null };
    if (editingId) {
      await supabase.from("equipment").update(payload).eq("id", editingId);
      toast({ title: "Equipamento atualizado" });
    } else {
      await supabase.from("equipment").insert(payload);
      toast({ title: "Equipamento cadastrado" });
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("equipment").delete().eq("id", id);
    toast({ title: "Equipamento removido" });
    fetchData();
  };

  const handleReboot = async (e: Equipment) => {
    toast({ title: "Comando enviado", description: `Reboot solicitado para ${e.name}` });
    await supabase.from("activity_log").insert({ action: `Reboot: ${e.name}`, details: `Serial: ${e.serial_number}` });
  };

  const statusColor: Record<string, string> = {
    online: "bg-success text-success-foreground",
    offline: "bg-destructive/10 text-destructive",
    provisioning: "bg-warning/10 text-warning",
  };
  const statusLabel: Record<string, string> = { online: "Online", offline: "Offline", provisioning: "Provisionando" };

  const online = equipment.filter((e) => e.status === "online").length;
  const offline = equipment.filter((e) => e.status === "offline").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground mb-1">Total Equipamentos</p><p className="text-2xl font-bold">{equipment.length}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground mb-1">Online</p><p className="text-2xl font-bold text-success">{online}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Wifi className="h-5 w-5 text-success" /></div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground mb-1">Offline</p><p className="text-2xl font-bold text-destructive">{offline}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><WifiOff className="h-5 w-5 text-destructive" /></div>
        </div>
      </div>

      {/* Clientes não provisionados */}
      {!loading && unprovisionedClients.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-warning/5">
            <UserX className="h-5 w-5 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Clientes sem provisionamento</p>
              <p className="text-xs text-muted-foreground">{unprovisionedClients.length} cliente(s) aguardando instalação de equipamento</p>
            </div>
          </div>
          <div className="divide-y">
            {unprovisionedClients.map((c) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3 gap-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10">
                    <UserX className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(c.phone)} • {c.city}</p>
                  </div>
                </div>
                <button
                  onClick={() => openAdd(c.full_name)}
                  className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary font-medium hover:bg-primary/20 transition-colors shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Provisionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, serial, MAC, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="provisioning">Provisionando</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={() => openAdd()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Novo Equipamento
        </button>
      </div>

      {/* Equipment List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Server className="mx-auto mb-3 h-12 w-12 text-border" />
            <p>Nenhum equipamento encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((e) => (
              <div key={e.id} className="flex flex-col md:flex-row md:items-center justify-between px-5 py-4 gap-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${e.status === "online" ? "bg-success/10" : "bg-muted"}`}>
                    {e.status === "online" ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.type} • {e.model || "Sem modelo"} • {e.serial_number || "Sem serial"}</p>
                    {e.client_name && <p className="text-xs text-muted-foreground">Cliente: {e.client_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[e.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabel[e.status] || e.status}
                  </span>
                  {e.signal_level != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Signal className="h-3 w-3" /> {e.signal_level} dBm
                    </span>
                  )}
                  {e.ip_address && <span className="text-xs text-muted-foreground">{e.ip_address}</span>}
                  <span className="text-xs text-muted-foreground">{e.mac_address}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setSelectedEquip(e); setConfigDialogOpen(true); }} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Configurar">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleReboot(e)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Reboot">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => openEdit(e)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONU">ONU</SelectItem>
                  <SelectItem value="Roteador">Roteador</SelectItem>
                  <SelectItem value="Switch">Switch</SelectItem>
                  <SelectItem value="AP">Access Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>Serial</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
            <div><Label>MAC *</Label><Input value={form.mac_address} onChange={(e) => setForm({ ...form, mac_address: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" /></div>
            <div><Label>IP</Label><Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="provisioning">Provisionando</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Firmware</Label><Input value={form.firmware} onChange={(e) => setForm({ ...form, firmware: e.target.value })} /></div>
            <div><Label>Localização</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Cliente</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">Salvar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar: {selectedEquip?.name}</DialogTitle>
          </DialogHeader>
          {selectedEquip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{selectedEquip.type}</span></div>
                <div><span className="text-muted-foreground">Modelo:</span> <span className="font-medium">{selectedEquip.model || "—"}</span></div>
                <div><span className="text-muted-foreground">Serial:</span> <span className="font-medium">{selectedEquip.serial_number || "—"}</span></div>
                <div><span className="text-muted-foreground">MAC:</span> <span className="font-medium">{selectedEquip.mac_address}</span></div>
                <div><span className="text-muted-foreground">IP:</span> <span className="font-medium">{selectedEquip.ip_address || "—"}</span></div>
                <div><span className="text-muted-foreground">Firmware:</span> <span className="font-medium">{selectedEquip.firmware || "—"}</span></div>
                <div><span className="text-muted-foreground">Sinal:</span> <span className="font-medium">{selectedEquip.signal_level != null ? `${selectedEquip.signal_level} dBm` : "—"}</span></div>
                <div><span className="text-muted-foreground">Uptime:</span> <span className="font-medium">{selectedEquip.uptime || "—"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Localização:</span> <span className="font-medium">{selectedEquip.location || "—"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{selectedEquip.client_name || "—"}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { handleReboot(selectedEquip); setConfigDialogOpen(false); }} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-warning font-medium hover:bg-warning/20 transition-colors">
                  <RefreshCw className="h-4 w-4" /> Reboot
                </button>
                <button onClick={() => { setConfigDialogOpen(false); openEdit(selectedEquip); }} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-primary font-medium hover:bg-primary/20 transition-colors">
                  <Edit2 className="h-4 w-4" /> Editar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
