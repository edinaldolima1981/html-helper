import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Star, Crown } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Básico",
    subtitle: "1 dispositivo",
    price: "19,90",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    popular: false,
    features: [
      "Mudar nome da rede WiFi",
      "Mudar senha WiFi",
      "1 dispositivo MikroTik",
      "Suporte por WhatsApp",
    ],
    subscribers: 1,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "3 dispositivos",
    price: "22,90",
    icon: Star,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    borderColor: "border-cyan-400",
    popular: true,
    features: [
      "Tudo do Básico",
      "Bloquear/desbloquear clientes por MAC",
      "Listar clientes conectados",
      "3 dispositivos MikroTik",
      "Relatórios básicos",
    ],
    subscribers: 0,
  },
  {
    id: "master",
    name: "Master",
    subtitle: "10 dispositivos",
    price: "29,90",
    icon: Crown,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    popular: false,
    features: [
      "Tudo do Pro",
      "Gerar QR Code para WiFi",
      "Criar redes temporárias (guest)",
      "Conexão por tempo limitado",
      "10 dispositivos MikroTik",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    subscribers: 0,
  },
];

export default function Plans() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-muted-foreground">Gerencie os planos de assinatura do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
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
                {/* Price */}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 text-left text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribers count */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Assinantes</span>
                  <span className="text-lg font-bold text-foreground">{plan.subscribers}</span>
                </div>

                {/* Action */}
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full ${
                    plan.popular
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                      : ""
                  }`}
                >
                  Editar Plano
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
