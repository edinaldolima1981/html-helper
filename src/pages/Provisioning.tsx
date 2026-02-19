import { Server } from "lucide-react";

export default function Provisioning() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Server className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Provisionamento</h2>
      </div>
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <Server className="mx-auto mb-3 h-12 w-12 text-border" />
        <p>Página de provisionamento em construção.</p>
      </div>
    </div>
  );
}
