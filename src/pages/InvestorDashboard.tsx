import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Users, BarChart3, ArrowUpRight, ArrowDownRight, Percent, PiggyBank } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investor, setInvestor] = useState<any>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    investorProfit: 0,
    roi: 0,
    totalProfit: 0,
  });
  const [profitHistory, setProfitHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Get investor data
    const { data: inv } = await supabase
      .from("investors")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    setInvestor(inv);

    // Get clients count
    const { count: totalClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    // Monthly revenue from credit_transactions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("amount")
      .gte("created_at", startOfMonth.toISOString())
      .eq("status", "paid");

    const monthlyRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Total expenses this month
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("total")
      .gte("date", startOfMonth.toISOString().split("T")[0]);

    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.total), 0) || 0;

    const netProfit = monthlyRevenue - totalExpenses;
    const participation = inv?.participation_percentage || 0;
    const investorProfit = netProfit * (participation / 100);

    // Profit history
    const { data: profits } = await supabase
      .from("investor_profits")
      .select("*")
      .eq("investor_id", inv?.id || "")
      .order("month", { ascending: true })
      .limit(12);

    const totalProfitReceived = profits?.reduce((sum, p) => sum + Number(p.investor_share), 0) || 0;
    const roi = inv?.invested_amount > 0 ? (totalProfitReceived / Number(inv.invested_amount)) * 100 : 0;

    setProfitHistory(
      profits?.map((p) => ({
        month: new Date(p.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receita: Number(p.total_revenue),
        despesas: Number(p.total_expenses),
        lucro: Number(p.investor_share),
      })) || []
    );

    setStats({
      totalClients: totalClients || 0,
      activeClients: totalClients || 0,
      monthlyRevenue,
      totalExpenses,
      netProfit,
      investorProfit,
      roi,
      totalProfit: totalProfitReceived,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Valor Investido",
      value: `R$ ${Number(investor?.invested_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: PiggyBank,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Lucro Total Recebido",
      value: `R$ ${stats.totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Lucro Mensal Atual",
      value: `R$ ${stats.investorProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "ROI",
      value: `${stats.roi.toFixed(1)}%`,
      icon: Percent,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  const pieData = [
    { name: "Receita", value: stats.monthlyRevenue, color: "hsl(var(--success))" },
    { name: "Despesas", value: stats.totalExpenses, color: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard do Investidor</h2>
        <p className="text-muted-foreground">
          Participação: <span className="font-semibold text-primary">{investor?.participation_percentage || 0}%</span> do projeto
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Estatísticas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Clientes Ativos</span>
              <span className="font-semibold text-foreground">{stats.activeClients}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Receita Mensal</span>
              <span className="font-semibold text-success">R$ {stats.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="font-semibold text-destructive">R$ {stats.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3">
              <span className="text-sm font-medium text-foreground">Lucro Líquido</span>
              <span className="font-bold text-primary">R$ {stats.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-success/5 border border-success/20 p-3">
              <span className="text-sm font-medium text-foreground">Seu Lucro ({investor?.participation_percentage || 0}%)</span>
              <span className="font-bold text-success">R$ {stats.investorProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Receita vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue > 0 || stats.totalExpenses > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
                Sem dados financeiros este mês
              </div>
            )}
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Receita</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Despesas</span>
            </div>
          </CardContent>
        </Card>

        {/* Profit History Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Histórico de Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profitHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={profitHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  <Bar dataKey="lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
                Nenhum lucro distribuído ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
