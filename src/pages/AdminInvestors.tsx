import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PiggyBank, UserPlus, Trash2, Loader2, Eye, EyeOff, ShieldAlert, DollarSign, Percent, Pencil, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvestorRow {
  id: string;
  user_id: string;
  invested_amount: number;
  participation_percentage: number;
  status: string;
  email: string;
  full_name: string;
  initial_password: string | null;
}

export default function AdminInvestors() {
  const { isAdmin, session } = useAuth();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<InvestorRow | null>(null);
  const [editForm, setEditForm] = useState({ invested_amount: "", participation_percentage: "" });
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    invested_amount: "",
    participation_percentage: "",
  });

  const fetchInvestors = async () => {
    setLoading(true);
    const { data: invs } = await supabase.from("investors").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, initial_password");

    if (invs && profiles) {
      const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      setInvestors(
        invs.map((inv) => ({
          ...inv,
          email: profileMap[inv.user_id]?.email ?? "—",
          full_name: profileMap[inv.user_id]?.full_name ?? "—",
          initial_password: profileMap[inv.user_id]?.initial_password ?? null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            role: "investor",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao criar investidor");

      const { error: invError } = await supabase.from("investors").insert({
        user_id: data.user.id,
        invested_amount: Number(form.invested_amount) || 0,
        participation_percentage: Number(form.participation_percentage) || 0,
      });

      if (invError) throw new Error(invError.message);

      toast({ title: "Investidor criado!", description: `${form.full_name} pode acessar o portal agora.` });
      setForm({ full_name: "", email: "", password: "", invested_amount: "", participation_percentage: "" });
      setShowForm(false);
      await fetchInvestors();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDelete = async (inv: InvestorRow) => {
    const { error } = await supabase.from("investors").delete().eq("id", inv.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", inv.user_id);
      toast({ title: "Investidor removido" });
      setInvestors((prev) => prev.filter((i) => i.id !== inv.id));
    }
  };

  const handleEdit = (inv: InvestorRow) => {
    setEditingInvestor(inv);
    setEditForm({
      invested_amount: String(inv.invested_amount),
      participation_percentage: String(inv.participation_percentage),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingInvestor) return;
    setSaving(true);
    const { error } = await supabase.from("investors").update({
      invested_amount: Number(editForm.invested_amount),
      participation_percentage: Number(editForm.participation_percentage),
    }).eq("id", editingInvestor.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investidor atualizado!" });
      setEditingInvestor(null);
      await fetchInvestors();
    }
    setSaving(false);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar investidores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Investidores</h2>
          <p className="mt-1 text-muted-foreground">Cadastre e gerencie os investidores do projeto</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Investidor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Cadastrar Investidor
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nome Completo</label>
                <Input placeholder="Nome do investidor" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" placeholder="investidor@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Valor Investido (R$)</label>
                <Input type="number" placeholder="10000" value={form.invested_amount} onChange={(e) => setForm({ ...form, invested_amount: e.target.value })} required min={0} step={0.01} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Participação (%)</label>
                <Input type="number" placeholder="30" value={form.participation_percentage} onChange={(e) => setForm({ ...form, participation_percentage: e.target.value })} required min={0} max={100} step={0.1} />
              </div>
              <div className="flex items-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Criar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : investors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PiggyBank className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum investidor cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investors.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {inv.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{inv.full_name}</p>
                      <p className="text-sm text-muted-foreground">{inv.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(inv)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(inv)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Investido</span>
                    <span className="font-semibold text-foreground">R$ {Number(inv.invested_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Percent className="h-3.5 w-3.5" /> Participação</span>
                    <span className="font-semibold text-primary">{inv.participation_percentage}%</span>
                  </div>
                  {/* Credenciais */}
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" /> Usuário</span>
                      <span className="text-xs font-mono text-foreground">{inv.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Lock className="h-3 w-3" /> Senha</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-foreground">
                          {visiblePasswords[inv.id] ? (inv.initial_password || "—") : "••••••"}
                        </span>
                        <button onClick={() => togglePasswordVisibility(inv.id)} className="text-muted-foreground hover:text-foreground">
                          {visiblePasswords[inv.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingInvestor} onOpenChange={() => setEditingInvestor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Investidor — {editingInvestor?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Valor Investido (R$)</label>
              <Input type="number" value={editForm.invested_amount} onChange={(e) => setEditForm({ ...editForm, invested_amount: e.target.value })} min={0} step={0.01} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Participação (%)</label>
              <Input type="number" value={editForm.participation_percentage} onChange={(e) => setEditForm({ ...editForm, participation_percentage: e.target.value })} min={0} max={100} step={0.1} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingInvestor(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
