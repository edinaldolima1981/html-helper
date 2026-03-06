import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users } from "lucide-react";
import { formatPhone, normalizePhone } from "@/lib/phone";

interface ClientForm {
  full_name: string;
  nickname: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  latitude: string;
  longitude: string;
  notes: string;
  plan_id: string;
}

const emptyForm = (): ClientForm => ({
  full_name: "", nickname: "", cpf: "", phone: "", email: "", address: "",
  neighborhood: "", city: "", state: "SP", cep: "", latitude: "", longitude: "", notes: "", plan_id: "",
});

export default function Clients() {
  const [form, setForm] = useState<ClientForm>(emptyForm());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

  const createClient = useMutation({
    mutationFn: async (data: ClientForm) => {
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };
      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setForm(emptyForm());
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.cpf || !form.phone || !form.address || !form.city) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    // Salva o telefone normalizado (formato internacional)
    createClient.mutate({ ...form, phone: normalizePhone(form.phone) });
  };

  const update = (field: keyof ClientForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Clientes</h1>
          <p className="text-muted-foreground">Registre novos clientes no sistema</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Novo Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-2">
                  <Label>Apelido</Label>
                  <Input value={form.nickname} onChange={e => update("nickname", e.target.value)} placeholder="Apelido" />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ *</Label>
                  <Input value={form.cpf} onChange={e => update("cpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input value={formatPhone(form.phone)} onChange={e => update("phone", e.target.value)} placeholder="(11) 99999-9999" maxLength={16} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Endereço *</Label>
                  <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Rua, número" />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.neighborhood} onChange={e => update("neighborhood", e.target.value)} placeholder="Bairro" />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Input value={form.state} onChange={e => update("state", e.target.value)} placeholder="UF" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input value={form.latitude} onChange={e => update("latitude", e.target.value)} placeholder="-23.5505" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input value={form.longitude} onChange={e => update("longitude", e.target.value)} placeholder="-46.6333" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Informações adicionais..." />
                </div>
              </div>
              <Button type="submit" disabled={createClient.isPending} className="w-full sm:w-auto">
                {createClient.isPending ? "Cadastrando..." : "Cadastrar Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{clients?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Clientes cadastrados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
