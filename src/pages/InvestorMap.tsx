import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, Users, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CityData {
  city: string;
  state: string;
  clientCount: number;
  equipmentCount: number;
}

export default function InvestorMap() {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [cityClients, setCityClients] = useState<any[]>([]);
  const [cityEquipments, setCityEquipments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: clients } = await supabase
      .from("clients").select("city, state");
    const { data: equipments } = await supabase
      .from("equipment").select("location, status");

    // Group by city
    const cityMap = new Map<string, CityData>();
    clients?.forEach((c) => {
      const key = `${c.city}-${c.state}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, { city: c.city, state: c.state, clientCount: 0, equipmentCount: 0 });
      }
      cityMap.get(key)!.clientCount++;
    });

    // Count equipment by location (using city match)
    equipments?.forEach((eq) => {
      if (eq.location) {
        for (const [key, data] of cityMap.entries()) {
          if (eq.location.toLowerCase().includes(data.city.toLowerCase())) {
            data.equipmentCount++;
            break;
          }
        }
      }
    });

    const sorted = [...cityMap.values()].sort((a, b) => b.clientCount - a.clientCount);
    setCities(sorted);
    setLoading(false);
  };

  const handleCityClick = async (city: CityData) => {
    setSelectedCity(city);

    const [{ data: clients }, { data: equipments }] = await Promise.all([
      supabase.from("clients").select("full_name, address, phone, created_at").eq("city", city.city).limit(50),
      supabase.from("equipment").select("*").ilike("location", `%${city.city}%`).limit(50),
    ]);

    setCityClients(clients || []);
    setCityEquipments(equipments || []);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalClients = cities.reduce((sum, c) => sum + c.clientCount, 0);
  const totalEquipments = cities.reduce((sum, c) => sum + c.equipmentCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mapa de Expansão</h2>
        <p className="text-muted-foreground">Cidades atendidas pelo projeto Wi-Fi</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cidades Atendidas</p>
              <p className="text-xl font-bold text-foreground">{cities.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
              <p className="text-xl font-bold text-success">{totalClients}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Server className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Equipamentos</p>
              <p className="text-xl font-bold text-warning">{totalEquipments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cities List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma cidade cadastrada</p>
            ) : (
              cities.map((city) => (
                <button
                  key={`${city.city}-${city.state}`}
                  onClick={() => handleCityClick(city)}
                  className={`w-full flex items-center justify-between rounded-lg p-4 transition-colors text-left
                    ${selectedCity?.city === city.city ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{city.city}</p>
                      <p className="text-xs text-muted-foreground">{city.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />{city.clientCount} clientes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Server className="h-3 w-3 mr-1" />{city.equipmentCount} equip.
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* City Details */}
        <div className="space-y-4">
          {selectedCity ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Clientes em {selectedCity.city}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cityClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {cityClients.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.address}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {cityEquipments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" /> Equipamentos em {selectedCity.city}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {cityEquipments.map((eq) => (
                        <div key={eq.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{eq.model || "MikroTik"}</p>
                            <p className="text-xs text-muted-foreground">{eq.client_name || "—"} • {eq.location}</p>
                          </div>
                          <Badge className={eq.status === "online" ? "bg-success text-success-foreground" : ""} variant={eq.status === "online" ? "default" : "secondary"}>
                            {eq.status === "online" ? "Ativo" : eq.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <MapPin className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">Selecione uma cidade para ver detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
