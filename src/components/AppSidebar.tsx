import { LayoutDashboard, Server, Smartphone, MessageSquare, LogOut, Wifi, UserPlus, Users, ClipboardList, Contact, TrendingUp, UsersRound, Settings } from "lucide-react";
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

// Itens visíveis para todos os membros autenticados
const commonItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Provisionamento", url: "/provisioning", icon: Server },
  { title: "Cadastro de Clientes", url: "/clients", icon: UserPlus },
  { title: "Interessados", url: "/interested", icon: Users },
  { title: "Clientes", url: "/clients-list", icon: Contact },
  { title: "Status da O.S.", url: "/service-orders", icon: ClipboardList },
  { title: "Dispositivos", url: "/devices", icon: Smartphone },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
];

// Itens exclusivos para administradores
const adminItems = [
  { title: "Financeiro", url: "/financial", icon: TrendingUp },
  { title: "Equipe Técnica", url: "/team", icon: UsersRound },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut, isAdmin } = useAuth();
  const navItems = isAdmin ? [...commonItems, ...adminItems] : commonItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-lg">
            <Wifi className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-wide">WIFIControl</h1>
            <p className="text-xs text-sidebar-foreground font-medium">Pro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
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
