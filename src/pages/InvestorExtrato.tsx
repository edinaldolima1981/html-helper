import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Loader2, Calendar, DollarSign, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InvestorExtrato() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investor, setInvestor] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [profits, setProfits] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("investors").select("*").eq("user_id", user!.id).maybeSingle();
    setInvestor(inv);

    const { data: txs } = await supabase
      .from("credit_transactions")
      .select("*, clients(full_name, city)")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(500);
    setTransactions(txs || []);

    // Profit distributions
    if (inv?.id) {
      const { data: profitData } = await supabase
        .from("investor_profits").select("*")
        .eq("investor_id", inv.id)
        .order("month", { ascending: false });
      setProfits(profitData || []);
    }

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

  const filtered = transactions.filter((tx) => {
    const clientName = (tx.clients as any)?.full_name || "";
    const matchSearch = clientName.toLowerCase().includes(search.toLowerCase());
    if (monthFilter === "all") return matchSearch;
    const txMonth = new Date(tx.created_at).toISOString().slice(0, 7);
    return matchSearch && txMonth === monthFilter;
  });

  const totalRevenue = filtered.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalInvestorShare = totalRevenue * (participation / 100);

  // Get unique months for filter
  const months = [...new Set(transactions.map(tx => new Date(tx.created_at).toISOString().slice(0, 7)))].sort().reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Extrato Financeiro</h2>
        <p className="text-muted-foreground">Histórico detalhado de pagamentos e sua participação nos lucros</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Transações</p>
              <p className="text-lg font-bold text-foreground">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-lg font-bold text-success">R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sua Participação ({participation}%)</p>
              <p className="text-lg font-bold text-warning">R$ {totalInvestorShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Distributions */}
      {profits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lucros Distribuídos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Receita Total</TableHead>
                  <TableHead>Despesas</TableHead>
                  <TableHead>Lucro Líquido</TableHead>
                  <TableHead>Seu Lucro</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profits.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {new Date(p.month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </TableCell>
                    <TableCell>R$ {Number(p.total_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-destructive">R$ {Number(p.total_expenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {Number(p.net_profit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold text-success">R$ {Number(p.investor_share).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={p.paid ? "default" : "secondary"} className={p.paid ? "bg-success text-success-foreground" : ""}>
                        {p.paid ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Pagamentos Recebidos
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {new Date(m + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum pagamento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Seu Lucro ({participation}%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => {
                    const investorShare = Number(tx.amount) * (participation / 100);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {(tx.clients as any)?.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.plan_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{tx.payment_method}</Badge>
                        </TableCell>
                        <TableCell>R$ {Number(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-semibold text-success">
                          R$ {investorShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
