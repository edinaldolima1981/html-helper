import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Download, Eye, Calendar, Store, Package, Search, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function InvestorExpenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses").select("*").order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = [...new Set(expenses.map(e => e.category))];

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.product.toLowerCase().includes(search.toLowerCase()) ||
      e.supplier.toLowerCase().includes(search.toLowerCase());
    if (categoryFilter === "all") return matchSearch;
    return matchSearch && e.category === categoryFilter;
  });

  const totalExpenses = filtered.reduce((sum, e) => sum + Number(e.total), 0);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Comprovantes e Documentos</h2>
          <p className="text-muted-foreground">Despesas comprovadas do projeto com notas fiscais</p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Total em despesas</p>
          <p className="text-xl font-bold text-destructive">
            R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhuma despesa encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <Card key={exp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                      <Package className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{exp.product}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Store className="h-3.5 w-3.5" /> {exp.supplier}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(exp.date).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{exp.category}</Badge>
                        <span className="text-xs text-muted-foreground">Qtd: {exp.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-foreground">
                      R$ {Number(exp.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
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
                  </div>
                </div>
                {exp.notes && (
                  <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{exp.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Preview with Zoom */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Comprovante</DialogTitle>
              {previewUrl && !previewUrl.endsWith(".pdf") && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>-</Button>
                  <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>+</Button>
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
