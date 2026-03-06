import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, UserPlus, Trash2, Loader2, Users, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string;
  initial_password: string | null;
}

export default function TeamPage() {
  const { user, isAdmin, session } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });

  const fetchMembers = async () => {
    setLoading(true);
    // Busca roles + profiles juntos
    const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, initial_password");

    if (roles && profiles) {
      const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      const list: TeamMember[] = roles.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        email: profileMap[r.user_id]?.email ?? "—",
        full_name: profileMap[r.user_id]?.full_name ?? "—",
        initial_password: profileMap[r.user_id]?.initial_password ?? null,
      }));
      setMembers(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.full_name) return;
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
            role: "technician",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao criar técnico");
      }
      toast({ title: "Técnico criado!", description: `${form.full_name} pode fazer login agora.` });
      setForm({ full_name: "", email: "", password: "" });
      setShowForm(false);
      await fetchMembers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDelete = async (member: TeamMember) => {
    if (member.user_id === user?.id) {
      toast({ title: "Ação inválida", description: "Você não pode remover seu próprio acesso.", variant: "destructive" });
      return;
    }
    setDeletingId(member.id);
    // Remove role - Supabase cascades auth user deletion from admin
    const { error } = await supabase.from("user_roles").delete().eq("id", member.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Acesso removido", description: `${member.full_name} foi removido da equipe.` });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    }
    setDeletingId(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar a equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe Técnica</h2>
          <p className="mt-1 text-muted-foreground">Gerencie os logins e acessos da sua equipe</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Técnico
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Conta de Técnico
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome Completo</label>
              <Input
                placeholder="João da Silva"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="joao@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha Inicial</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Criar Técnico
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Membros da Equipe</h3>
            <p className="text-sm text-muted-foreground">{members.length} usuário(s) cadastrado(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Users className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum usuário cadastrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground text-sm">
                    {member.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.initial_password && (
                      <p className="text-xs text-muted-foreground/70">Senha: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{member.initial_password}</span></p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    member.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-info/10 text-info"
                  }`}>
                    <Shield className="h-3 w-3" />
                    {member.role === "admin" ? "Administrador" : "Técnico"}
                  </span>
                  {member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(member)}
                      disabled={deletingId === member.id}
                    >
                      {deletingId === member.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access info */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Níveis de Acesso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="font-semibold text-primary mb-2">👑 Administrador</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Acesso total ao sistema</li>
              <li>• Gerenciar equipe técnica</li>
              <li>• Configurações e financeiro</li>
              <li>• Relatórios e dashboard completo</li>
            </ul>
          </div>
          <div className="rounded-lg bg-info/5 border border-info/20 p-4">
            <p className="font-semibold text-info mb-2">🔧 Técnico</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Dashboard operacional</li>
              <li>• Provisionamento e equipamentos</li>
              <li>• Clientes e ordens de serviço</li>
              <li>• WhatsApp e dispositivos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
