import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Interested() {
  const [search, setSearch] = useState("");
  const [osDialog, setOsDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [osDescription, setOsDescription] = useState("Instalação");
  const [osScheduledDate, setOsScheduledDate] = useState("");
  const [osAssignedTo, setOsAssignedTo] = useState("");
  const [osNotes, setOsNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-unprovisioned"],
    queryFn: async () => {
      const [{ data: clientsData, error }, { data: equipData }] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("equipment").select("client_name"),
      ]);
      if (error) throw error;
      const provisionedNames = new Set(
        (equipData || []).map((e: any) => e.client_name?.toLowerCase().trim()).filter(Boolean)
      );
      return (clientsData || []).filter(
        (c: any) => !provisionedNames.has(c.full_name.toLowerCase().trim())
      );
    },
  });

  const createOS = useMutation({
    mutationFn: async () => {
      if (!selectedClient) return;
      const { error } = await supabase.from("service_orders").insert({
        client_id: selectedClient.id,
        description: osDescription,
        assigned_to: osAssignedTo || null,
        scheduled_date: osScheduledDate || null,
        notes: osNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      setOsDialog(false);
      setOsDescription("Instalação");
      setOsScheduledDate("");
      setOsAssignedTo("");
      setOsNotes("");
      toast({ title: "Ordem de Serviço gerada com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao gerar O.S.", description: err.message, variant: "destructive" });
    },
  });

  const filtered = clients?.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search)
  ) ?? [];

  const openOsDialog = (client: any) => {
    setSelectedClient(client);
    setOsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interessados</h1>
          <p className="text-muted-foreground">Clientes cadastrados — gere ordens de serviço</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Interessados ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(client => (
                <div key={client.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{client.full_name}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{client.cpf}</span>
                      <span>•</span>
                      <span>{client.phone}</span>
                      {client.nickname && <Badge variant="secondary">{client.nickname}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{client.address}, {client.city}/{client.state}</p>
                  </div>
                  <Button onClick={() => openOsDialog(client)} size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Gerar O.S.
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={osDialog} onOpenChange={setOsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Cliente: <strong className="text-foreground">{selectedClient.full_name}</strong></p>
              <div className="space-y-2">
                <Label>Descrição do Serviço</Label>
                <Input value={osDescription} onChange={e => setOsDescription(e.target.value)} placeholder="Ex: Instalação, Manutenção..." />
              </div>
              <div className="space-y-2">
                <Label>Técnico Responsável</Label>
                <Input value={osAssignedTo} onChange={e => setOsAssignedTo(e.target.value)} placeholder="Nome do técnico" />
              </div>
              <div className="space-y-2">
                <Label>Data Agendada</Label>
                <Input type="date" value={osScheduledDate} onChange={e => setOsScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={osNotes} onChange={e => setOsNotes(e.target.value)} placeholder="Detalhes adicionais..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOsDialog(false)}>Cancelar</Button>
            <Button onClick={() => createOS.mutate()} disabled={createOS.isPending}>
              {createOS.isPending ? "Gerando..." : "Gerar O.S."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
