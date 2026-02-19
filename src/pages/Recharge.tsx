import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CreditCard, QrCode, Loader2, Zap, Star, Crown } from "lucide-react";

const plans = [
  { id: "basic", name: "Básico", price: 10, credits: 10, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", features: ["10 créditos", "Comandos básicos", "Suporte por chat"] },
  { id: "plus", name: "Plus", price: 20, credits: 25, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", features: ["25 créditos", "Todos os comandos", "Suporte prioritário"], popular: true },
  { id: "premium", name: "Premium", price: 30, credits: 45, icon: Crown, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", features: ["45 créditos", "Todos os comandos", "Suporte VIP", "QR Code personalizado"] },
];

type PaymentMethod = "pix" | "credit" | "debit";

export default function Recharge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const clientId = searchParams.get("clientId");
  const clientName = searchParams.get("clientName") || "Cliente";

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod || !clientId) return;
    setProcessing(true);

    const plan = plans.find((p) => p.id === selectedPlan)!;

    try {
      // Record transaction
      const { error: txError } = await supabase.from("credit_transactions").insert({
        client_id: clientId,
        amount: plan.price,
        plan_name: plan.name,
        payment_method: paymentMethod,
        status: "completed",
      });
      if (txError) throw txError;

      // Add credits to client
      const { data: client } = await supabase.from("clients").select("credits").eq("id", clientId).single();
      const currentCredits = (client?.credits as number) || 0;
      const { error: updateError } = await supabase.from("clients").update({ credits: currentCredits + plan.credits }).eq("id", clientId);
      if (updateError) throw updateError;

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        action: "Recarga de créditos",
        details: `${clientName}: Plano ${plan.name} (R$${plan.price}) via ${paymentMethod}`,
      });

      setSuccess(true);
      toast({ title: "Pagamento confirmado!", description: `${plan.credits} créditos adicionados para ${clientName}.` });
    } catch (e: any) {
      toast({ title: "Erro no pagamento", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    const plan = plans.find((p) => p.id === selectedPlan)!;
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground">
              <strong>{plan.credits} créditos</strong> adicionados para <strong>{clientName}</strong>
            </p>
            <p className="text-sm text-muted-foreground">Plano {plan.name} • R$ {plan.price},00 • {paymentMethod === "pix" ? "PIX" : paymentMethod === "credit" ? "Cartão de Crédito" : "Cartão de Débito"}</p>
            <Button onClick={() => navigate("/whatsapp")} className="mt-4">
              Voltar ao WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/whatsapp")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recarga de Créditos</h1>
          <p className="text-muted-foreground">Cliente: {clientName}</p>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Escolha um plano</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <Card
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative cursor-pointer transition-all hover:scale-[1.02] ${
                  isSelected ? `ring-2 ring-primary ${plan.bg}` : "hover:shadow-lg"
                } ${plan.popular ? "border-amber-500/50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white">
                    POPULAR
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${plan.bg}`}>
                    <Icon className={`h-6 w-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <div>
                    <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-muted-foreground">,00</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 justify-center">
                        <Check className={`h-3.5 w-3.5 ${plan.color}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      {selectedPlan && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Forma de pagamento</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              { id: "pix" as PaymentMethod, label: "PIX", icon: QrCode, desc: "Pagamento instantâneo" },
              { id: "credit" as PaymentMethod, label: "Cartão de Crédito", icon: CreditCard, desc: "Até 3x sem juros" },
              { id: "debit" as PaymentMethod, label: "Cartão de Débito", icon: CreditCard, desc: "Débito à vista" },
            ]).map((method) => {
              const MIcon = method.icon;
              return (
                <Card
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    paymentMethod === method.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <MIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm */}
      {selectedPlan && paymentMethod && (
        <div className="flex justify-center pt-2">
          <Button onClick={handlePayment} disabled={processing} size="lg" className="min-w-[200px]">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              `Pagar R$ ${plans.find((p) => p.id === selectedPlan)!.price},00`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
