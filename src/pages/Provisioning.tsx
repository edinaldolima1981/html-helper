import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Server, Plus, Search, Wifi, WifiOff, Signal, Edit2, Trash2, RefreshCw,
  Settings2, UserX, FileCode2, Copy, Check, Network, Printer, QrCode,
  ClipboardCheck, Tag, CheckCircle2, Circle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhone } from "@/lib/phone";
import { QRCodeSVG } from "qrcode.react";

type Equipment = {
  id: string; name: string; type: string; model: string; serial_number: string;
  mac_address: string; ip_address: string | null; status: string;
  signal_level: number | null; uptime: string | null; firmware: string | null;
  location: string | null; client_name: string | null; notes: string | null;
  created_at: string; updated_at: string;
};

type Client = {
  id: string; full_name: string; nickname: string | null; phone: string;
  city: string; address: string;
};

type IpInfo = {
  ip: string; gateway: string; subnet: string;
  subnet_index: number; host_index: number; mask: string;
};

type WifiConfig = {
  ssid: string; password: string; band: string; channel: string;
};

const emptyForm = {
  name: "", type: "ONU", model: "", serial_number: "", mac_address: "",
  ip_address: "", status: "offline", firmware: "", location: "", client_name: "", notes: "",
};

const defaultWifi: WifiConfig = {
  ssid: "", password: "", band: "2ghz", channel: "auto",
};

function generateMikrotikScript(client: Client, ipInfo: IpInfo, wifi: WifiConfig): string {
  const hostname = client.full_name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const ssid = wifi.ssid || `WiFi-${hostname}`;
  const wifiPass = wifi.password || "12345678";

  return `# ============================================
# Provisionamento Automático - WIFIControl Pro
# Cliente: ${client.full_name}
# IP: ${ipInfo.ip} | Gateway: ${ipInfo.gateway}
# Data: ${new Date().toLocaleDateString("pt-BR")}
# ============================================

# --- Identidade do Sistema ---
/system identity set name="${hostname}"

# --- Configuração de IP (WAN) ---
/ip address
add address=${ipInfo.ip}/24 interface=ether1 comment="WAN - ${client.full_name}"

# --- Rota Padrão ---
/ip route
add dst-address=0.0.0.0/0 gateway=${ipInfo.gateway} comment="Gateway padrao"

# --- DNS ---
/ip dns set servers=8.8.8.8,8.8.4.4 allow-remote-requests=yes

# --- DHCP Server (rede local do cliente) ---
/ip address add address=10.10.10.1/24 interface=ether2 comment="LAN - Rede local"
/ip pool add name=pool-lan ranges=10.10.10.10-10.10.10.200
/ip dhcp-server add name=dhcp-lan interface=ether2 address-pool=pool-lan disabled=no
/ip dhcp-server network add address=10.10.10.0/24 gateway=10.10.10.1 dns-server=8.8.8.8,8.8.4.4 comment="Rede LAN"

# --- NAT Masquerade ---
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="NAT Internet"

# --- Firewall Básico ---
/ip firewall filter
add chain=input connection-state=established,related action=accept comment="Aceitar conexoes estabelecidas"
add chain=input connection-state=invalid action=drop comment="Dropar invalidas"
add chain=input protocol=icmp action=accept comment="Aceitar ICMP"
add chain=input in-interface=ether2 action=accept comment="Aceitar trafego LAN"
add chain=input action=drop comment="Dropar todo o resto"
add chain=forward connection-state=established,related action=accept comment="Forward estabelecidas"
add chain=forward connection-state=invalid action=drop comment="Forward dropar invalidas"
add chain=forward in-interface=ether2 action=accept comment="Forward LAN para internet"
add chain=forward action=drop comment="Forward dropar resto"

# --- WiFi ---
/interface wireless set wlan1 mode=ap-bridge band=${wifi.band} frequency=auto ssid="${ssid}" disabled=no
/interface wireless security-profiles set default authentication-types=wpa2-psk mode=dynamic-keys wpa2-pre-shared-key="${wifiPass}"

# --- Bridge WiFi + LAN ---
/interface bridge add name=bridge-lan comment="Bridge LAN+WiFi"
/interface bridge port add interface=ether2 bridge=bridge-lan
/interface bridge port add interface=wlan1 bridge=bridge-lan

# Mover IP LAN para a bridge
/ip address remove [find where address="10.10.10.1/24" interface=ether2]
/ip address add address=10.10.10.1/24 interface=bridge-lan comment="LAN - Bridge"
/ip dhcp-server set dhcp-lan interface=bridge-lan

# --- Netwatch (Monitoramento) ---
/tool netwatch add host=${ipInfo.gateway} interval=30s up-script="" down-script=""

:log info "=== Provisionamento OK === ${client.full_name} === IP: ${ipInfo.ip} === SSID: ${ssid} ==="
:beep frequency=1000 length=300ms
:delay 300ms
:beep frequency=1500 length=300ms`;
}

function generateWifiQRString(ssid: string, password: string): string {
  return `WIFI:T:WPA;S:${ssid};P:${password};;`;
}

export default function Provisioning() {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [unprovisionedClients, setUnprovisionedClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [scriptClient, setScriptClient] = useState<Client | null>(null);
  const [scriptContent, setScriptContent] = useState("");
  const [scriptIpInfo, setScriptIpInfo] = useState<IpInfo | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>(defaultWifi);
  const [checklist, setChecklist] = useState({
    scriptApplied: false,
    wifiTested: false,
    natWorking: false,
    dhcpWorking: false,
    cableLabeled: false,
  });
  const labelRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: equipData }, { data: clientsData }, { data: ordersData }] = await Promise.all([
      supabase.from("equipment").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name, nickname, phone, city, address").order("full_name"),
      supabase.from("service_orders").select("client_id").neq("status", "concluido"),
    ]);
    const equip = (equipData as Equipment[]) || [];
    setEquipment(equip);
    const clientsWithOS = new Set((ordersData || []).map((o: any) => o.client_id));
    const provisionedNames = new Set(
      equip.map((e) => e.client_name?.toLowerCase().trim()).filter(Boolean)
    );
    const unprovisioned = (clientsData as Client[] || []).filter(
      (c) => clientsWithOS.has(c.id) && !provisionedNames.has(c.full_name.toLowerCase().trim())
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
    const payload = {
      ...form,
      ip_address: form.ip_address || null, firmware: form.firmware || null,
      location: form.location || null, client_name: form.client_name || null, notes: form.notes || null,
    };
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

  const handleGenerateScript = async (client: Client) => {
    setGeneratingScript(true);
    setScriptClient(client);
    setScriptDialogOpen(true);
    setCopied(false);
    setChecklist({ scriptApplied: false, wifiTested: false, natWorking: false, dhcpWorking: false, cableLabeled: false });

    const hostname = client.full_name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    setWifiConfig({ ...defaultWifi, ssid: `WiFi-${hostname}`, password: generateRandomPassword() });

    try {
      const { data, error } = await supabase.rpc("get_next_provisioning_ip");
      if (error) throw error;
      const ipInfo = data as IpInfo;
      await supabase.from("provisioning_ips" as any).insert({
        client_name: client.full_name, ip_address: ipInfo.ip, gateway: ipInfo.gateway,
        subnet: ipInfo.subnet, subnet_index: ipInfo.subnet_index, host_index: ipInfo.host_index,
      });
      setScriptIpInfo(ipInfo);
      setScriptContent(generateMikrotikScript(client, ipInfo, { ...defaultWifi, ssid: `WiFi-${hostname}`, password: generateRandomPassword() }));
    } catch (err: any) {
      toast({ title: "Erro ao gerar script", description: err.message, variant: "destructive" });
      setScriptDialogOpen(false);
    } finally {
      setGeneratingScript(false);
    }
  };

  const regenerateScript = () => {
    if (scriptClient && scriptIpInfo) {
      setScriptContent(generateMikrotikScript(scriptClient, scriptIpInfo, wifiConfig));
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: "Script copiado!", description: "Cole no terminal da RB." });
  };

  const handlePrintLabel = () => {
    if (!labelRef.current) return;
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Etiqueta</title>
      <style>
        body { margin: 0; padding: 10px; font-family: monospace; font-size: 11px; }
        .label { border: 2px dashed #333; padding: 10px; width: 350px; }
        .title { font-weight: bold; font-size: 14px; margin-bottom: 6px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 4px; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .key { font-weight: bold; }
        .qr { text-align: center; margin-top: 8px; }
      </style></head><body>
      ${labelRef.current.innerHTML}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const allChecked = Object.values(checklist).every(Boolean);

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
              <p className="font-semibold text-foreground">Clientes com O.S. pendente</p>
              <p className="text-xs text-muted-foreground">{unprovisionedClients.length} cliente(s) aguardando provisionamento</p>
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
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleGenerateScript(c)} className="flex items-center gap-2 rounded-lg bg-secondary/80 border border-border px-3 py-1.5 text-sm text-foreground font-medium hover:bg-secondary transition-colors">
                    <FileCode2 className="h-3.5 w-3.5 text-primary" /> Gerar Script
                  </button>
                  <button onClick={() => openAdd(c.full_name)} className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Provisionar
                  </button>
                </div>
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
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Signal className="h-3 w-3" /> {e.signal_level} dBm</span>
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

      {/* ── Script Dialog ──────────────────────────────────────────── */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-primary" />
              Provisionamento de Bancada
            </DialogTitle>
          </DialogHeader>

          {generatingScript ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p>Gerando script e reservando IP...</p>
            </div>
          ) : scriptIpInfo && scriptClient ? (
            <Tabs defaultValue="script" className="space-y-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="script" className="gap-1.5 text-xs"><FileCode2 className="h-3.5 w-3.5" /> Script</TabsTrigger>
                <TabsTrigger value="wifi" className="gap-1.5 text-xs"><QrCode className="h-3.5 w-3.5" /> WiFi</TabsTrigger>
                <TabsTrigger value="checklist" className="gap-1.5 text-xs"><ClipboardCheck className="h-3.5 w-3.5" /> Checklist</TabsTrigger>
                <TabsTrigger value="label" className="gap-1.5 text-xs"><Tag className="h-3.5 w-3.5" /> Etiqueta</TabsTrigger>
              </TabsList>

              {/* ── Tab Script ── */}
              <TabsContent value="script" className="space-y-4">
                {/* Resumo IP */}
                <div className="rounded-lg border bg-muted/40 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">IP Atribuído</p>
                    <p className="font-mono font-semibold text-primary">{scriptIpInfo.ip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Gateway</p>
                    <p className="font-mono font-medium">{scriptIpInfo.gateway}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Máscara</p>
                    <p className="font-mono font-medium">{scriptIpInfo.mask}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Faixa</p>
                    <p className="font-mono font-medium">{scriptIpInfo.subnet}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Network className="h-4 w-4" />
                  <span>Cliente: <strong className="text-foreground">{scriptClient.full_name}</strong> — {scriptClient.city}</span>
                </div>

                {/* WiFi config inline */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Configuração WiFi</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">SSID</Label>
                      <Input value={wifiConfig.ssid} onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Senha WiFi</Label>
                      <Input value={wifiConfig.password} onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Banda</Label>
                      <Select value={wifiConfig.band} onValueChange={(v) => setWifiConfig({ ...wifiConfig, band: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2ghz">2.4 GHz</SelectItem>
                          <SelectItem value="5ghz">5 GHz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" variant="secondary" onClick={regenerateScript} className="w-full h-8 text-xs gap-1">
                        <RefreshCw className="h-3 w-3" /> Atualizar Script
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Script */}
                <div className="relative">
                  <pre className="rounded-lg bg-muted border text-xs font-mono p-4 overflow-x-auto whitespace-pre leading-relaxed max-h-72 overflow-y-auto">
                    {scriptContent}
                  </pre>
                  <button onClick={handleCopyScript} className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${copied ? "bg-success/20 text-success" : "bg-background border hover:bg-muted text-muted-foreground"}`}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground bg-warning/10 rounded-lg px-3 py-2 border border-warning/20">
                  ⚡ Cole no terminal da RB via WinBox → Terminal. Inclui: IP, DNS, DHCP, NAT, Firewall, WiFi.
                </p>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>Fechar</Button>
                  <Button onClick={handleCopyScript} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar Script"}
                  </Button>
                </div>
              </TabsContent>

              {/* ── Tab WiFi QR Code ── */}
              <TabsContent value="wifi" className="space-y-4">
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card p-8 flex flex-col items-center gap-4">
                    <QRCodeSVG
                      value={generateWifiQRString(wifiConfig.ssid, wifiConfig.password)}
                      size={200}
                      level="M"
                      includeMargin
                    />
                    <div className="text-center">
                      <p className="font-bold text-lg text-foreground">{wifiConfig.ssid}</p>
                      <p className="text-sm text-muted-foreground">Senha: <span className="font-mono font-medium text-foreground">{wifiConfig.password}</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    📱 O cliente pode escanear este QR Code com a câmera do celular para conectar automaticamente ao WiFi.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div>
                      <Label className="text-xs">SSID</Label>
                      <Input value={wifiConfig.ssid} onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })} className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Senha</Label>
                      <Input value={wifiConfig.password} onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })} className="h-9" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab Checklist ── */}
              <TabsContent value="checklist" className="space-y-4">
                <div className="rounded-xl border bg-card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Checklist de Bancada
                    </h3>
                    {allChecked && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                        <CheckCircle2 className="h-4 w-4" /> Tudo OK!
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: "scriptApplied" as const, label: "Script aplicado no terminal", desc: "Colou e executou o script no WinBox → Terminal" },
                      { key: "wifiTested" as const, label: "WiFi funcionando", desc: "Conectou um dispositivo na rede WiFi e navegou" },
                      { key: "natWorking" as const, label: "NAT / Internet OK", desc: "Cliente consegue acessar a internet normalmente" },
                      { key: "dhcpWorking" as const, label: "DHCP distribuindo IPs", desc: "Dispositivos recebem IP automaticamente (10.10.10.x)" },
                      { key: "cableLabeled" as const, label: "Cabo / equipamento etiquetado", desc: "Etiqueta com dados do cliente colada na RB" },
                    ].map((item) => (
                      <label key={item.key} className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${checklist[item.key] ? "bg-success/5 border-success/30" : "hover:bg-muted/30"}`}>
                        <Checkbox
                          checked={checklist[item.key]}
                          onCheckedChange={(v) => setChecklist({ ...checklist, [item.key]: !!v })}
                          className="mt-0.5"
                        />
                        <div>
                          <p className={`font-medium text-sm ${checklist[item.key] ? "text-success line-through" : "text-foreground"}`}>{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(Object.values(checklist).filter(Boolean).length / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{Object.values(checklist).filter(Boolean).length}/5</span>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab Etiqueta ── */}
              <TabsContent value="label" className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Preview da etiqueta */}
                  <div ref={labelRef} className="w-full max-w-sm">
                    <div className="border-2 border-dashed border-foreground/30 rounded-lg p-4 bg-card space-y-2 font-mono text-xs">
                      <div className="text-center font-bold text-sm border-b border-foreground/20 pb-2">
                        🌐 WIFIControl Pro
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Cliente:</span>
                        <span>{scriptClient.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">IP WAN:</span>
                        <span>{scriptIpInfo.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Gateway:</span>
                        <span>{scriptIpInfo.gateway}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">IP LAN:</span>
                        <span>10.10.10.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">SSID:</span>
                        <span>{wifiConfig.ssid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Senha WiFi:</span>
                        <span>{wifiConfig.password}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Faixa:</span>
                        <span>{scriptIpInfo.subnet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Data:</span>
                        <span>{new Date().toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="text-center pt-2 border-t border-foreground/20">
                        <QRCodeSVG value={generateWifiQRString(wifiConfig.ssid, wifiConfig.password)} size={80} level="L" />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handlePrintLabel} className="gap-2">
                    <Printer className="h-4 w-4" /> Imprimir Etiqueta
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    🏷️ Cole essa etiqueta na parte de baixo da RB para identificação rápida em campo.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

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

function generateRandomPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}
