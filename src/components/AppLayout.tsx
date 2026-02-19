import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Painel de Controle</h2>
                  <p className="text-sm capitalize text-muted-foreground">{today}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Sistema Online badge */}
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                    <div className="absolute inset-0 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-success" />
                  </div>
                  <span className="text-sm font-medium text-success">Sistema Online</span>
                </div>
                {/* User info */}
                <div className="flex items-center gap-3 border-l pl-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Admin</p>
                    <p className="text-xs text-muted-foreground">
                      {role === "admin" ? "Administrador" : "Equipe Técnica"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
