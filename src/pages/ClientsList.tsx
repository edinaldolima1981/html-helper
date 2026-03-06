import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Users, Wifi, WifiOff, CreditCard, Pencil, Loader2 } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editPlanId, setEditPlanId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-list-provisioned"],
    queryFn: async () => {
      const [{ data: clientsData, error }, { data: equipData }] = await Promise.all([
        supabase.from("clients").select("*").order("full_name"),
        supabase.from("equipment").select("client_name"),
      ]);
      if (error) throw error;
      const provisionedNames = new Set(
        (equipData || []).map((e: any) => e.client_name?.toLowerCase().trim()).filter(Boolean)
      );
      return (clientsData || []).filter(
        (c: any) => provisionedNames.has(c.full_name.toLowerCase().trim())
      );
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingClient) return;
      const { error } = await supabase.from("clients").update({
        full_name: editName,
        nickname: editNickname || null,
        phone: editPhone,
        address: editAddress,
        city: editCity,
        state: editState,
        plan_id: editPlanId || null,
      }).eq("id", editingClient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list-provisioned"] });
      setEditingClient(null);
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });

  const openEdit = (client: any) => {
    setEditingClient(client);
    setEditName(client.full_name);
    setEditNickname(client.nickname || "");
    setEditPhone(client.phone);
    setEditAddress(client.address);
    setEditCity(client.city);
    setEditState(client.state);
    setEditPlanId(client.plan_id || "");
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return null;
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.name : null;
  };

  const clientsWithStatus = (clients || []).map((c) => ({
    ...c,
    isOnline: (c.credits as number) > 0,
  }));

  const filtered = clientsWithStatus.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase()));
    if (filter === "online") return matchesSearch && c.isOnline;
    if (filter === "offline") return matchesSearch && !c.isOnline;
    return matchesSearch;
  });

  const onlineCount = clientsWithStatus.filter((c) => c.isOnline).length;
  const offlineCount = clientsWithStatus.filter((c) => !c.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Visualize o status de todos os clientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`cursor-pointer transition-all ${filter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`} onClick={() => setFilter("all")}>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{clientsWithStatus.length}</p>
              <p className="text-xs text-muted-foreground">Total de clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filter === "online" ? "ring-2 ring-primary" : "hover:shadow-md"}`} onClick={() => setFilter("online")}>
          <CardContent className="flex items-center gap-3 p-4">
            <Wifi className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online (com créditos)</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${filter === "offline" ? "ring-2 ring-primary" : "hover:shadow-md"}`} onClick={() => setFilter("offline")}>
          <CardContent className="flex items-center gap-3 p-4">
            <WifiOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
              <p className="text-xs text-muted-foreground">Offline (sem créditos)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou apelido..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Client list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "Todos os Clientes" : filter === "online" ? "Clientes Online" : "Clientes Offline"} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((client) => {
                const planName = getPlanName(client.plan_id);
                return (
                  <div key={client.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${client.isOnline ? "bg-green-500/10" : "bg-destructive/10"}`}>
                        {client.isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{client.full_name}</p>
                          {client.nickname && <Badge variant="secondary" className="text-xs">{client.nickname}</Badge>}
                          {planName && <Badge variant="outline" className="text-xs">{planName}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatPhone(client.phone)}</span>
                          <span>•</span>
                          <span>{client.city}/{client.state}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-semibold ${(client.credits as number) > 0 ? "text-green-500" : "text-destructive"}`}>
                          {client.credits as number} créditos
                        </span>
                      </div>
                      <Badge variant={client.isOnline ? "default" : "destructive"} className="text-xs">
                        {client.isOnline ? "Online" : "Offline"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="Editar cliente">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Apelido</Label>
              <Input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={formatPhone(editPhone)} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={editState} onChange={(e) => setEditState(e.target.value)} maxLength={2} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editPlanId} onValueChange={setEditPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
