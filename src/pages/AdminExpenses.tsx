import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Loader2, ShieldAlert, Upload, Package, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminExpenses() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    product: "",
    quantity: "1",
    total: "",
    category: "geral",
    notes: "",
    document_url: "",
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("expense-documents").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("expense-documents").getPublicUrl(path);
      setForm({ ...form, document_url: urlData.publicUrl });
      toast({ title: "Documento enviado!" });
    }
    setUploading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.from("expenses").insert({
      date: form.date,
      supplier: form.supplier,
      product: form.product,
      quantity: Number(form.quantity),
      total: Number(form.total),
      category: form.category,
      notes: form.notes || null,
      document_url: form.document_url || null,
      registered_by: user?.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Despesa registrada!" });
      setForm({ date: new Date().toISOString().split("T")[0], supplier: "", product: "", quantity: "1", total: "", category: "geral", notes: "", document_url: "" });
      setShowForm(false);
      await fetchExpenses();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Despesa removida" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso Restrito</h2>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Despesas</h2>
          <p className="mt-1 text-muted-foreground">
            Total: <span className="font-semibold text-destructive">R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Registrar Despesa
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Data</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Fornecedor</label>
                <Input placeholder="Nome do fornecedor" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Produto</label>
                <Input placeholder="Descrição do produto" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Quantidade</label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min={1} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Valor Total (R$)</label>
                <Input type="number" placeholder="0.00" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} required min={0} step={0.01} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Observações</label>
                <Textarea placeholder="Notas adicionais..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Comprovante</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Enviando..." : form.document_url ? "✓ Enviado" : "Anexar"}
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="lg:col-span-3 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Registrar
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
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhuma despesa registrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <Card key={exp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                    <Package className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{exp.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.supplier} • {new Date(exp.date).toLocaleDateString("pt-BR")} • {exp.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    R$ {Number(exp.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  {exp.document_url && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setPreviewUrl(exp.document_url); }} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild title="Baixar">
                        <a href={exp.document_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Comprovante</DialogTitle>
              {previewUrl && !previewUrl.endsWith(".pdf") && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}>-</Button>
                  <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}>+</Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1" /> Baixar
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {previewUrl && (
            previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" />
            ) : (
              <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Comprovante"
                  className="rounded-lg transition-transform duration-200"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                />
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
