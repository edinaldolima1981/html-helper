import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, Star, Loader2, Plus, Trash2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  features: string[];
  subscribers: number;
  popular: boolean;
  sort_order: number;
}

export default function Plans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formName, setFormName] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPopular, setFormPopular] = useState(false);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (plan: Partial<Plan> & { id: string }) => {
      const { error } = await supabase
        .from("plans")
        .update({
          name: plan.name,
          subtitle: plan.subtitle,
          price: plan.price,
          features: plan.features,
          popular: plan.popular,
        })
        .eq("id", plan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setEditingPlan(null);
      toast({ title: "Plano atualizado com sucesso!" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormSubtitle(plan.subtitle);
    setFormPrice(String(plan.price));
    setFormPopular(plan.popular);
    setFormFeatures([...plan.features]);
    setNewFeature("");
  };

  const handleSave = () => {
    if (!editingPlan) return;
    updateMutation.mutate({
      id: editingPlan.id,
      name: formName,
      subtitle: formSubtitle,
      price: parseFloat(formPrice),
      features: formFeatures,
      popular: formPopular,
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormFeatures([...formFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-muted-foreground">Gerencie os planos de assinatura do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col transition-all hover:shadow-xl ${
              plan.popular ? "border-2 border-cyan-400 shadow-lg shadow-cyan-500/10" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                  <Star className="h-3 w-3 fill-white" /> Mais Popular
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col text-center space-y-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-4xl font-extrabold text-foreground">
                  {Number(plan.price).toFixed(2).replace(".", ",")}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>

              <ul className="flex-1 space-y-3 text-left text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Assinantes</span>
                <span className="text-lg font-bold text-foreground">{plan.subscribers}</span>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className={plan.popular ? "bg-cyan-500 hover:bg-cyan-600 text-white" : ""}
                onClick={() => openEdit(plan)}
              >
                Editar Plano
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input value={formSubtitle} onChange={(e) => setFormSubtitle(e.target.value)} placeholder="Ex: 3 dispositivos" />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formPopular} onCheckedChange={setFormPopular} />
              <Label>Marcar como popular</Label>
            </div>
            <div className="space-y-2">
              <Label>Funcionalidades</Label>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {formFeatures.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
                    <span>{f}</span>
                    <button onClick={() => removeFeature(i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Nova funcionalidade"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" size="icon" variant="outline" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
