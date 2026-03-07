import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Loader2, MapPin, User, Calendar, Wifi, Search, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InvestorEquipments() {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("equipment").select("*").order("created_at", { ascending: false });
    setEquipments(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = equipments.filter((eq) => {
    const matchSearch =
      (eq.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (eq.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (eq.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (eq.serial_number || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "all") return matchSearch;
    return matchSearch && eq.status === statusFilter;
  });

  const onlineCount = equipments.filter(e => e.status === "online").length;
  const offlineCount = equipments.filter(e => e.status !== "online").length;

  const statusBadge = (status: string) => {
    if (status === "online") return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
    if (status === "offline") return <Badge variant="destructive">Offline</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipamentos</h2>
          <p className="text-muted-foreground">Roteadores MikroTik e equipamentos instalados</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">{onlineCount} ativos</span>
          </Card>
          <Card className="px-4 py-2 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{offlineCount} offline</span>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar equipamento, cliente, local..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="online">Ativos</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="table">Tabela</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Server className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum equipamento encontrado.</p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((eq, i) => (
            <Card key={eq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />{String(i + 1).padStart(3, "0")}
                      </p>
                      <p className="text-sm text-muted-foreground">{eq.model || "MikroTik"}</p>
                    </div>
                  </div>
                  {statusBadge(eq.status)}
                </div>
                <div className="space-y-2 text-sm">
                  {eq.client_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5" /><span>{eq.client_name}</span>
                    </div>
                  )}
                  {eq.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /><span>{eq.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Instalado: {new Date(eq.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                  <p>SN: {eq.serial_number || "—"}</p>
                  <p>MAC: {eq.mac_address || "—"}</p>
                  {eq.ip_address && <p>IP: {eq.ip_address}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Instalação</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((eq, i) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-mono">{String(i + 1).padStart(3, "0")}</TableCell>
                    <TableCell className="font-medium">{eq.model || "MikroTik"}</TableCell>
                    <TableCell>{eq.client_name || "—"}</TableCell>
                    <TableCell>{eq.location || "—"}</TableCell>
                    <TableCell>{new Date(eq.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs font-mono">{eq.serial_number || "—"}</TableCell>
                    <TableCell>{statusBadge(eq.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
