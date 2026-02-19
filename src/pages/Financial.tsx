import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  AlertTriangle,
  CreditCard,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CREDITS_ALERT_THRESHOLD = 20; // alerta quando créditos do sistema < 20
const SYSTEM_CREDITS_TOTAL = 100; // créditos totais do plano do sistema (ajustável)

export default function Financial() {
  // Transações de recargas de clientes (receita)
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["credit_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*, clients(full_name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Total de clientes ativos (com crédito > 0)
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-financial"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name, credits, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  // Ordens de serviço para despesas estimadas
  const { data: serviceOrders = [] } = useQuery({
    queryKey: ["service-orders-financial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, status, created_at, description")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ─── Métricas calculadas ─────────────────────────────────────────────────────

  const totalRevenue = transactions
    .filter((t: any) => t.status === "completed")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const currentMonthRevenue = transactions
    .filter((t: any) => {
      const d = parseISO(t.created_at);
      return t.status === "completed" && d >= startOfMonth(new Date()) && d <= endOfMonth(new Date());
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const lastMonthRevenue = transactions
    .filter((t: any) => {
      const d = parseISO(t.created_at);
      const last = subMonths(new Date(), 1);
      return t.status === "completed" && d >= startOfMonth(last) && d <= endOfMonth(last);
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const revenueGrowth =
    lastMonthRevenue > 0
      ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : currentMonthRevenue > 0
      ? "100"
      : "0";

  const totalCreditsDistributed = transactions
    .filter((t: any) => t.status === "completed")
    .reduce((sum: number, t: any) => {
      const plans: Record<string, number> = { Básico: 10, Plus: 25, Premium: 45 };
      return sum + (plans[t.plan_name] || 0);
    }, 0);

  const totalClientCredits = clients.reduce((sum: number, c: any) => sum + Number(c.credits), 0);
  const activeClients = clients.filter((c: any) => Number(c.credits) > 0).length;

  // Créditos do sistema (simulado — baseado em mensagens WhatsApp usadas)
  // Em produção isso viria de uma tabela system_credits
  const systemCreditsUsed = 34; // placeholder
  const systemCreditsLeft = SYSTEM_CREDITS_TOTAL - systemCreditsUsed;
  const systemCreditsPercent = Math.round((systemCreditsLeft / SYSTEM_CREDITS_TOTAL) * 100);
  const needsRecharge = systemCreditsLeft <= CREDITS_ALERT_THRESHOLD;

  // ─── Gráfico de receita mensal (últimos 6 meses) ──────────────────────────
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const label = format(d, "MMM", { locale: ptBR });
    const revenue = transactions
      .filter((t: any) => {
        const td = parseISO(t.created_at);
        return t.status === "completed" && td >= startOfMonth(d) && td <= endOfMonth(d);
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    return { month: label, receita: revenue };
  });

  // ─── Pizza por método de pagamento ────────────────────────────────────────
  const paymentMethodData = Object.entries(
    transactions
      .filter((t: any) => t.status === "completed")
      .reduce((acc: Record<string, number>, t: any) => {
        const label =
          t.payment_method === "pix"
            ? "PIX"
            : t.payment_method === "credit"
            ? "Crédito"
            : t.payment_method === "debit"
            ? "Débito"
            : t.payment_method;
        acc[label] = (acc[label] || 0) + Number(t.amount);
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  const PIE_COLORS = ["hsl(239,84%,67%)", "hsl(160,84%,39%)", "hsl(45,93%,47%)", "hsl(280,60%,55%)"];

  const paymentMethodIcons: Record<string, string> = { PIX: "🔑", Crédito: "💳", Débito: "🏦" };

  if (loadingTx) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle completo de receitas, despesas e créditos</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          {format(new Date(), "MMMM yyyy", { locale: ptBR })}
        </Button>
      </div>

      {/* Alerta de créditos baixos */}
      {needsRecharge && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Créditos do sistema baixos!</p>
            <p className="text-sm text-muted-foreground">
              Restam apenas <strong>{systemCreditsLeft}</strong> créditos. Recarregue para manter o serviço de IA ativo.
            </p>
          </div>
          <Button size="sm" className="ml-auto shrink-0">
            Recarregar agora
          </Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Receita do Mês */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  R$ {currentMonthRevenue.toFixed(2).replace(".", ",")}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {Number(revenueGrowth) >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className={Number(revenueGrowth) >= 0 ? "text-success" : "text-destructive"}>
                    {revenueGrowth}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receita Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  R$ {totalRevenue.toFixed(2).replace(".", ",")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {transactions.filter((t: any) => t.status === "completed").length} transações
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Ativos */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{activeClients}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalClientCredits} créditos distribuídos
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Users className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Créditos do Sistema */}
        <Card className={needsRecharge ? "border-warning/50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm text-muted-foreground">Créditos do Sistema</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {systemCreditsLeft}
                  <span className="text-sm font-normal text-muted-foreground"> / {SYSTEM_CREDITS_TOTAL}</span>
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      systemCreditsPercent > 40
                        ? "bg-success"
                        : systemCreditsPercent > 20
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${systemCreditsPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{systemCreditsPercent}% disponível</p>
              </div>
              <div className={`ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${needsRecharge ? "bg-warning/10" : "bg-accent"}`}>
                <Zap className={`h-6 w-6 ${needsRecharge ? "text-warning" : "text-primary"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Receita mensal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Receita nos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.every((d) => d.receita === 0) ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhuma receita registrada ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239,84%,67%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(239,84%,67%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]} />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(239,84%,67%)"
                    strokeWidth={2}
                    fill="url(#colorReceita)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pizza por método */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <CreditCard className="h-8 w-8 opacity-30" />
                <p className="text-sm">Sem dados ainda</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                      {paymentMethodData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {paymentMethodData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{paymentMethodIcons[item.name] || ""} {item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">R$ {item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Abas de histórico */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="clients">Créditos por Cliente</TabsTrigger>
        </TabsList>

        {/* Histórico de transações */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Transações</CardTitle>
              <CardDescription>Todas as recargas realizadas pelos clientes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <DollarSign className="h-10 w-10 opacity-20" />
                  <p>Nenhuma transação registrada ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{(t.clients as any)?.full_name || "—"}</TableCell>
                        <TableCell>{t.plan_name}</TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {t.payment_method === "pix"
                              ? "PIX"
                              : t.payment_method === "credit"
                              ? "Crédito"
                              : "Débito"}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-success">
                          + R$ {Number(t.amount).toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={t.status === "completed" ? "default" : t.status === "pending" ? "secondary" : "destructive"}
                            className={t.status === "completed" ? "bg-success/10 text-success hover:bg-success/20 border-success/20" : ""}
                          >
                            {t.status === "completed" ? "Pago" : t.status === "pending" ? "Pendente" : "Cancelado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(parseISO(t.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Créditos por cliente */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Créditos por Cliente</CardTitle>
              <CardDescription>Saldo de créditos de cada cliente cadastrado</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Users className="h-10 w-10 opacity-20" />
                  <p>Nenhum cliente encontrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cliente desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...clients]
                      .sort((a: any, b: any) => Number(b.credits) - Number(a.credits))
                      .map((c: any) => {
                        const credits = Number(c.credits);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.full_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full ${credits > 20 ? "bg-success" : credits > 5 ? "bg-warning" : "bg-destructive"}`}
                                    style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className={`font-semibold ${credits > 20 ? "text-success" : credits > 5 ? "text-warning" : "text-destructive"}`}>
                                  {credits}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  credits > 20
                                    ? "bg-success/10 text-success border-success/20"
                                    : credits > 5
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                                }
                              >
                                {credits > 20 ? "OK" : credits > 5 ? "Baixo" : credits === 0 ? "Sem créditos" : "Crítico"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(parseISO(c.created_at), "dd/MM/yyyy")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rodapé — placeholder Stripe */}
      <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Integração com pagamentos online</p>
            <p className="text-sm text-muted-foreground">
              Em breve: aceite pagamentos via Stripe diretamente pelo sistema — PIX, cartão de crédito e débito com confirmação automática.
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">Em breve</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
