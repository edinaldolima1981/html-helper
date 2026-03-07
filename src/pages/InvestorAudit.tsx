import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, User, Search, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvestorAudit() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
    setLogs(data || []);
    setLoading(false);
  };

  const actionColors: Record<string, string> = {
    "cadastro": "bg-success/10 text-success",
    "pagamento": "bg-primary/10 text-primary",
    "despesa": "bg-destructive/10 text-destructive",
    "equipamento": "bg-info/10 text-info",
    "alteracao": "bg-warning/10 text-warning",
    "upload": "bg-accent/50 text-accent-foreground",
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.toLowerCase().includes(key)) return color;
    }
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const actionTypes = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter((log) => {
    const matchSearch =
      (log.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.user_name || "").toLowerCase().includes(search.toLowerCase());
    if (actionFilter === "all") return matchSearch;
    return matchSearch && log.action === actionFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Auditoria e Anti-Fraude</h2>
        <p className="text-muted-foreground">Registro completo de todas as ações do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Registros</p>
              <p className="text-xl font-bold text-foreground">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alterações com Histórico</p>
              <p className="text-xl font-bold text-warning">{logs.filter(l => l.old_value && l.new_value).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <User className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tipos de Ação</p>
              <p className="text-xl font-bold text-success">{actionTypes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ação, detalhe ou usuário..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Shield className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((log) => {
                const date = new Date(log.created_at);
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center text-center min-w-[60px] pt-0.5">
                      <span className="text-sm font-semibold text-foreground">
                        {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        {log.user_name && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> {log.user_name}
                          </span>
                        )}
                        {log.entity_type && (
                          <span className="text-xs text-muted-foreground">
                            • {log.entity_type}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                      )}
                      {log.old_value && log.new_value && (
                        <div className="mt-2 text-xs rounded-lg bg-muted/50 p-3 space-y-1 border">
                          <p className="font-medium text-foreground">Histórico de Alteração:</p>
                          <p><span className="text-destructive font-medium">Valor antigo:</span> {typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : String(log.old_value)}</p>
                          <p><span className="text-success font-medium">Novo valor:</span> {typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : String(log.new_value)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
