import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Loader2, MapPin, User, Calendar } from "lucide-react";

export default function InvestorEquipments() {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<any[]>([]);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });
    setEquipments(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Equipamentos</h2>
        <p className="text-muted-foreground">Roteadores e equipamentos instalados no projeto</p>
      </div>

      {equipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Server className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum equipamento cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipments.map((eq, i) => (
            <Card key={eq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Equipamento {String(i + 1).padStart(3, "0")}</p>
                      <p className="text-sm text-muted-foreground">{eq.model || "MikroTik"}</p>
                    </div>
                  </div>
                  <Badge variant={eq.status === "online" ? "default" : "secondary"} className={eq.status === "online" ? "bg-success text-success-foreground" : ""}>
                    {eq.status === "online" ? "Ativo" : eq.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {eq.client_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{eq.client_name}</span>
                    </div>
                  )}
                  {eq.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{eq.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(eq.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  SN: {eq.serial_number || "—"} • MAC: {eq.mac_address || "—"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
