import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Circle } from "lucide-react";

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
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground capitalize">{today}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Circle className="h-2.5 w-2.5 fill-success text-success" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
