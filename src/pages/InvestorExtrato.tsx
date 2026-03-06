import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Loader2, Calendar, DollarSign } from "lucide-react";

export default function InvestorExtrato() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investor, setInvestor] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("investors")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    setInvestor(inv);

    // Get all paid transactions with client info
    const { data: txs } = await supabase
      .from("credit_transactions")
      .select("*, clients(full_name)")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(100);

    setTransactions(txs || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const participation = investor?.participation_percentage || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Extrato Financeiro</h2>
        <p className="text-muted-foreground">Histórico de pagamentos e sua participação nos lucros</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Pagamentos Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum pagamento registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const investorShare = Number(tx.amount) * (participation / 100);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <DollarSign className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {(tx.clients as any)?.full_name || "Cliente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.plan_name} • {tx.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Mensalidade: R$ {Number(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-semibold text-success">
                        Seu lucro: R$ {investorShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
