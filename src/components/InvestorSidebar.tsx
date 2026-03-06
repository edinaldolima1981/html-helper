import { LayoutDashboard, Receipt, Server, FileText, Calculator, Shield, LogOut, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const investorItems = [
  { title: "Dashboard", url: "/investor", icon: LayoutDashboard },
  { title: "Extrato", url: "/investor/extrato", icon: Receipt },
  { title: "Equipamentos", url: "/investor/equipments", icon: Server },
  { title: "Despesas", url: "/investor/expenses", icon: FileText },
  { title: "Simulador", url: "/investor/simulator", icon: Calculator },
  { title: "Auditoria", url: "/investor/audit", icon: Shield },
];

export function InvestorSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-wide">WIFIControl</h1>
            <p className="text-xs text-sidebar-foreground font-medium">Investidor</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {investorItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/investor"}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-l-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground/60 transition-all hover:bg-destructive/20 hover:text-destructive-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
