import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ServiceOrderStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["service_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(full_name, phone, address, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "concluída") updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from("service_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const pendentes = orders?.filter(o => o.status === "pendente") ?? [];
  const concluidas = orders?.filter(o => o.status === "concluída") ?? [];

  const statusBadge = (status: string) => {
    if (status === "concluída") return <Badge className="bg-green-600 text-white">Concluída</Badge>;
    if (status === "pendente") return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Pendente</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const renderOrder = (order: any) => (
    <div key={order.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{order.clients?.full_name ?? "Cliente"}</p>
          {statusBadge(order.status)}
        </div>
        <p className="text-sm text-muted-foreground">{order.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {order.assigned_to && <span>Técnico: {order.assigned_to}</span>}
          {order.scheduled_date && <span>• Agendado: {format(new Date(order.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}</span>}
          <span>• Criado: {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </div>
        {order.clients?.address && (
          <p className="text-xs text-muted-foreground">{order.clients.address}, {order.clients.city}</p>
        )}
      </div>
      <div className="flex gap-2">
        {order.status === "pendente" && (
          <Button size="sm" onClick={() => updateStatus.mutate({ id: order.id, status: "concluída" })} className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Concluir
          </Button>
        )}
        {order.status === "concluída" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: order.id, status: "pendente" })}>
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Status da O.S.</h1>
          <p className="text-muted-foreground">Acompanhe as ordens de serviço</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendentes.length}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{concluidas.length}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {pendentes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" /> Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendentes.map(renderOrder)}
              </CardContent>
            </Card>
          )}

          {concluidas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" /> Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {concluidas.map(renderOrder)}
              </CardContent>
            </Card>
          )}

          {(orders?.length ?? 0) === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma ordem de serviço encontrada.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
