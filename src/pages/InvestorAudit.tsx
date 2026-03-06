import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Clock, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InvestorAudit() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  const actionColors: Record<string, string> = {
    "cadastro_cliente": "bg-success/10 text-success",
    "pagamento": "bg-primary/10 text-primary",
    "despesa": "bg-destructive/10 text-destructive",
    "equipamento": "bg-info/10 text-info",
    "alteracao": "bg-warning/10 text-warning",
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Auditoria</h2>
        <p className="text-muted-foreground">Registro de todas as ações realizadas no sistema</p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Shield className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum registro de auditoria encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log) => {
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
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                      )}
                      {log.old_value && log.new_value && (
                        <div className="mt-2 text-xs rounded-lg bg-muted/50 p-2 space-y-1">
                          <p><span className="text-destructive">Antes:</span> {JSON.stringify(log.old_value)}</p>
                          <p><span className="text-success">Depois:</span> {JSON.stringify(log.new_value)}</p>
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
