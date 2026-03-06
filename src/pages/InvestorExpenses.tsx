import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Download, Eye, Calendar, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InvestorExpenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
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

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Comprovantes e Documentos</h2>
          <p className="text-muted-foreground">Despesas comprovadas do projeto</p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-sm text-muted-foreground">Total em despesas</p>
          <p className="text-xl font-bold text-destructive">
            R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhuma despesa registrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <Card key={exp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Qtd: {exp.quantity} • Categoria: {exp.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        R$ {Number(exp.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {exp.document_url && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewUrl(exp.document_url)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                          title="Baixar"
                        >
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

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" />
            ) : (
              <img src={previewUrl} alt="Comprovante" className="w-full rounded-lg object-contain max-h-[70vh]" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
