import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, Medal, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvestorRank {
  id: string;
  invested_amount: number;
  participation_percentage: number;
  total_profit: number;
  profile_name: string;
}

export default function InvestorRanking() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<InvestorRank[]>([]);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setLoading(true);

    const { data: investors } = await supabase
      .from("investors").select("id, user_id, invested_amount, participation_percentage")
      .eq("status", "active")
      .order("invested_amount", { ascending: false });

    if (!investors || investors.length === 0) {
      setRanking([]);
      setLoading(false);
      return;
    }

    // Get profiles for names
    const userIds = investors.map(i => i.user_id);
    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name").in("id", userIds);

    // Get total profits per investor
    const { data: profits } = await supabase
      .from("investor_profits").select("investor_id, investor_share");

    const profitMap = new Map<string, number>();
    profits?.forEach(p => {
      profitMap.set(p.investor_id, (profitMap.get(p.investor_id) || 0) + Number(p.investor_share));
    });

    const profileMap = new Map<string, string>();
    profiles?.forEach(p => profileMap.set(p.id, p.full_name));

    const ranked: InvestorRank[] = investors.map(inv => ({
      id: inv.id,
      invested_amount: Number(inv.invested_amount),
      participation_percentage: Number(inv.participation_percentage),
      total_profit: profitMap.get(inv.id) || 0,
      profile_name: profileMap.get(inv.user_id) || "Investidor",
    }));

    setRanking(ranked);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const totalInvested = ranking.reduce((sum, r) => sum + r.invested_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ranking de Investidores</h2>
        <p className="text-muted-foreground">Os maiores investidores do projeto</p>
      </div>

      {/* Total */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investido no Projeto</p>
              <p className="text-2xl font-bold text-foreground">
                R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">{ranking.length} investidores</Badge>
        </CardContent>
      </Card>

      {ranking.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum investidor ativo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ranking.map((inv, i) => (
            <Card key={inv.id} className={`transition-shadow hover:shadow-md ${i < 3 ? "border-primary/20" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      {i < 3 ? (
                        <Medal className={`h-6 w-6 ${medalColors[i]}`} />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{i + 1}º</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{inv.profile_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Participação: {inv.participation_percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground flex items-center gap-1 justify-end">
                      <DollarSign className="h-4 w-4 text-primary" />
                      R$ {inv.invested_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-success flex items-center gap-1 justify-end">
                      <TrendingUp className="h-3 w-3" />
                      Lucro: R$ {inv.total_profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
