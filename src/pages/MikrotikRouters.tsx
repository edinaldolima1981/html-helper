import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Router, Plus, Search, Wifi, WifiOff, RefreshCw, Trash2, Edit2,
  Activity, Server, Shield, Eye, EyeOff, Network, CheckCircle2, XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MikrotikRouter = {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  api_type: string;
  status: string;
  last_seen_at: string | null;
  firmware_version: string | null;
  model: string | null;
  serial_number: string | null;
  uptime: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  name: "",
  ip_address: "",
  port: 443,
  username: "admin",
  password: "",
  notes: "",
};

export default function MikrotikRouters() {
  const { toast } = useToast();
  const [routers, setRouters] = useState<MikrotikRouter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [infoDialog, setInfoDialog] = useState<{ open: boolean; routerId: string | null; data: any }>({
    open: false,
    routerId: null,
    data: null,
  });
  const [loadingInfo, setLoadingInfo] = useState(false);

  const fetchRouters = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("mikrotik_routers") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRouters(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRouters();
  }, []);

  const filtered = routers.filter((r) =>
    [r.name, r.ip_address, r.model, r.serial_number]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: MikrotikRouter) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      ip_address: r.ip_address,
      port: r.port,
      username: r.username,
      password: r.password,
      notes: r.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.ip_address) {
      toast({ title: "Erro", description: "IP é obrigatório.", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name || "Router",
      ip_address: form.ip_address,
      port: form.port,
      username: form.username,
      password: form.password,
      notes: form.notes || null,
    };
    if (editingId) {
      await (supabase.from("mikrotik_routers") as any).update(payload).eq("id", editingId);
      toast({ title: "Router atualizado" });
    } else {
      await (supabase.from("mikrotik_routers") as any).insert(payload);
      toast({ title: "Router adicionado" });
    }
    setDialogOpen(false);
    fetchRouters();
  };

  const handleDelete = async (id: string) => {
    await (supabase.from("mikrotik_routers") as any).delete().eq("id", id);
    toast({ title: "Router removido" });
    fetchRouters();
  };

  const handleTestConnection = async (router: MikrotikRouter) => {
    setTesting(router.id);
    setTestResult((prev) => ({ ...prev, [router.id]: null }));
    try {
      const { data, error } = await supabase.functions.invoke("mikrotik-api", {
        body: { action: "test_connection", router_id: router.id },
      });
      if (error) throw error;
      setTestResult((prev) => ({ ...prev, [router.id]: data }));
      if (data?.success) {
        toast({ title: "✅ Conexão OK!", description: `Router ${router.name} respondeu com sucesso.` });
        fetchRouters();
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: data?.error || "Não foi possível conectar.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [router.id]: { success: false, error: err.message } }));
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const handleGetInfo = async (router: MikrotikRouter) => {
    setInfoDialog({ open: true, routerId: router.id, data: null });
    setLoadingInfo(true);
    try {
      const { data, error } = await supabase.functions.invoke("mikrotik-api", {
        body: { action: "get_info", router_id: router.id },
      });
      if (error) throw error;
      setInfoDialog({ open: true, routerId: router.id, data });
      if (data?.success) fetchRouters();
    } catch (err: any) {
      setInfoDialog({ open: true, routerId: router.id, data: { success: false, error: err.message } });
    } finally {
      setLoadingInfo(false);
    }
  };

  const statusColor: Record<string, string> = {
    online: "bg-success text-success-foreground",
    offline: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" />
            MikroTik Routers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e monitore seus roteadores MikroTik via API REST
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Router
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Routers</p>
            <p className="text-2xl font-bold">{routers.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Router className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Online</p>
            <p className="text-2xl font-bold text-success">
              {routers.filter((r) => r.status === "online").length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Wifi className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Offline</p>
            <p className="text-2xl font-bold text-destructive">
              {routers.filter((r) => r.status === "offline").length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <WifiOff className="h-5 w-5 text-destructive" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, IP, modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Router List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Router className="mx-auto mb-3 h-12 w-12 text-border" />
            <p>Nenhum router cadastrado</p>
            <p className="text-xs mt-1">Adicione seu primeiro MikroTik para começar</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col md:flex-row md:items-center justify-between px-5 py-4 gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      r.status === "online" ? "bg-success/10" : "bg-muted"
                    }`}
                  >
                    {r.status === "online" ? (
                      <Wifi className="h-5 w-5 text-success" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {r.ip_address}:{r.port} • {r.username}
                    </p>
                    {r.model && (
                      <p className="text-xs text-muted-foreground">
                        {r.model} {r.firmware_version ? `• v${r.firmware_version}` : ""}
                        {r.uptime ? ` • Up: ${r.uptime}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={statusColor[r.status] || "bg-muted text-muted-foreground"}
                  >
                    {r.status === "online" ? "Online" : "Offline"}
                  </Badge>
                  {r.last_seen_at && (
                    <span className="text-xs text-muted-foreground">
                      Visto: {new Date(r.last_seen_at).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTestConnection(r)}
                    disabled={testing === r.id}
                    title="Testar Conexão"
                  >
                    {testing === r.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    ) : testResult[r.id]?.success === true ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : testResult[r.id]?.success === false ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleGetInfo(r)} title="Info do Sistema">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Editar">
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                    title="Excluir"
                    className="hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              {editingId ? "Editar Router" : "Adicionar Router"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: RB Principal"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>IP / Domínio *</Label>
                <Input
                  value={form.ip_address}
                  onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                  placeholder="Ex: meuip.ddns.net"
                />
              </div>
              <div>
                <Label>Porta</Label>
                <Input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 443 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Usuário</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Local, função, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialog.open} onOpenChange={(open) => setInfoDialog({ ...infoDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Informações do Sistema
            </DialogTitle>
          </DialogHeader>
          {loadingInfo ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Consultando router...</p>
            </div>
          ) : infoDialog.data?.success ? (
            <Tabs defaultValue="identity">
              <TabsList className="w-full">
                <TabsTrigger value="identity" className="flex-1">Identidade</TabsTrigger>
                <TabsTrigger value="resource" className="flex-1">Recursos</TabsTrigger>
                <TabsTrigger value="board" className="flex-1">Hardware</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="mt-4">
                <InfoBlock data={infoDialog.data.identity} />
              </TabsContent>
              <TabsContent value="resource" className="mt-4">
                <InfoBlock data={infoDialog.data.resource} />
              </TabsContent>
              <TabsContent value="board" className="mt-4">
                <InfoBlock data={infoDialog.data.routerboard} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-6 text-center">
              <XCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-medium">Falha ao conectar</p>
              <p className="text-sm text-muted-foreground mt-1">
                {infoDialog.data?.error || "Verifique IP, porta e credenciais."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoBlock({ data }: { data: any }) {
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;
  const items = Array.isArray(data) ? data[0] || {} : data;
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      {Object.entries(items).map(([key, value]) => (
        <div key={key} className="flex justify-between text-sm">
          <span className="text-muted-foreground font-mono">{key}</span>
          <span className="font-medium text-foreground text-right max-w-[60%] truncate">
            {String(value ?? "-")}
          </span>
        </div>
      ))}
    </div>
  );
}
