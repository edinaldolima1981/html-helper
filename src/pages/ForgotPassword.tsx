import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wifi, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="items-center space-y-4 pb-2 pt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Wifi className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Esqueci a Senha</h1>
            <p className="text-sm text-muted-foreground">Enviaremos um link de recuperação</p>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Email enviado! Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <Link to="/login" className="mt-2 text-sm text-primary hover:underline">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar Link
              </Button>
            </form>
          )}
          <Link to="/login" className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
