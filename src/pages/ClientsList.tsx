import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Wifi, WifiOff, CreditCard } from "lucide-react";
import { formatPhone } from "@/lib/phone";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Simulate online/offline based on credits > 0 as a proxy (or random for demo)
  // In a real system this would come from device/session data
  const clientsWithStatus = (clients || []).map((c) => ({
    ...c,
    isOnline: (c.credits as number) > 0,
  }));

  const filtered = clientsWithStatus.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase()));
    if (filter === "online") return matchesSearch && c.isOnline;
    if (filter === "offline") return matchesSearch && !c.isOnline;
    return matchesSearch;
  });

  const onlineCount = clientsWithStatus.filter((c) => c.isOnline).length;
  const offlineCount = clientsWithStatus.filter((c) => !c.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Visualize o status de todos os clientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className={`cursor-pointer transition-all ${filter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{clientsWithStatus.length}</p>
              <p className="text-xs text-muted-foreground">Total de clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === "online" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setFilter("online")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <Wifi className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online (com créditos)</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === "offline" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setFilter("offline")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <WifiOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
              <p className="text-xs text-muted-foreground">Offline (sem créditos)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou apelido..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Client list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "Todos os Clientes" : filter === "online" ? "Clientes Online" : "Clientes Offline"} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((client) => (
                <div key={client.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${client.isOnline ? "bg-green-500/10" : "bg-destructive/10"}`}>
                      {client.isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{client.full_name}</p>
                        {client.nickname && <Badge variant="secondary" className="text-xs">{client.nickname}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatPhone(client.phone)}</span>
                        <span>•</span>
                        <span>{client.city}/{client.state}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-semibold ${(client.credits as number) > 0 ? "text-green-500" : "text-destructive"}`}>
                        {client.credits as number} créditos
                      </span>
                    </div>
                    <Badge variant={client.isOnline ? "default" : "destructive"} className="text-xs">
                      {client.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
