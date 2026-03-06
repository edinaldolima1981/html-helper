import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp, DollarSign, Clock, Users } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function InvestorSimulator() {
  const [investedAmount, setInvestedAmount] = useState(5000);
  const [routers, setRouters] = useState(10);
  const [clientsPerRouter, setClientsPerRouter] = useState(5);
  const [monthlyFee, setMonthlyFee] = useState(21.99);
  const [participation, setParticipation] = useState(30);

  const totalClients = routers * clientsPerRouter;
  const monthlyRevenue = totalClients * monthlyFee;
  const estimatedExpenses = monthlyRevenue * 0.25; // 25% estimated expenses
  const netProfit = monthlyRevenue - estimatedExpenses;
  const investorMonthlyProfit = netProfit * (participation / 100);
  const investorAnnualProfit = investorMonthlyProfit * 12;
  const paybackMonths = investedAmount > 0 && investorMonthlyProfit > 0 
    ? Math.ceil(investedAmount / investorMonthlyProfit) 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Simulador de Retorno</h2>
        <p className="text-muted-foreground">Simule seus ganhos ajustando os parâmetros abaixo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> Parâmetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Valor Investido: <span className="text-primary">R$ {investedAmount.toLocaleString("pt-BR")}</span>
              </label>
              <Slider
                value={[investedAmount]}
                onValueChange={([v]) => setInvestedAmount(v)}
                min={1000}
                max={100000}
                step={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>R$ 1.000</span>
                <span>R$ 100.000</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Roteadores: <span className="text-primary">{routers}</span>
              </label>
              <Slider
                value={[routers]}
                onValueChange={([v]) => setRouters(v)}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Clientes por Roteador: <span className="text-primary">{clientsPerRouter}</span>
              </label>
              <Slider
                value={[clientsPerRouter]}
                onValueChange={([v]) => setClientsPerRouter(v)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor da Mensalidade (R$)</label>
              <Input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Participação: <span className="text-primary">{participation}%</span>
              </label>
              <Slider
                value={[participation]}
                onValueChange={([v]) => setParticipation(v)}
                min={1}
                max={100}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Clientes</p>
                    <p className="text-xl font-bold text-foreground">{totalClients}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita Mensal</p>
                    <p className="text-xl font-bold text-success">
                      R$ {monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-6 text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Seu Lucro Mensal</p>
                <p className="text-3xl font-bold text-success">
                  R$ {investorMonthlyProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Seu Lucro Anual</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {investorAnnualProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo para recuperar investimento</p>
                <p className="text-2xl font-bold text-foreground">
                  {paybackMonths > 0 ? `${paybackMonths} meses` : "—"}
                </p>
                {paybackMonths > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {(paybackMonths / 12).toFixed(1)} anos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p>⚠️ Esta simulação é apenas uma estimativa. Despesas operacionais estimadas em 25% da receita. Valores reais podem variar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
