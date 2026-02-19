import { LayoutDashboard, Server, Smartphone, MessageSquare, Settings, LogOut, Wifi, UserPlus, Users, ClipboardList } from "lucide-react";
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

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Provisionamento", url: "/provisioning", icon: Server },
  { title: "Cadastro de Clientes", url: "/clients", icon: UserPlus },
  { title: "Interessados", url: "/interested", icon: Users },
  { title: "Status da O.S.", url: "/service-orders", icon: ClipboardList },
  { title: "Dispositivos", url: "/devices", icon: Smartphone },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
            <Wifi className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">WIFIControl</h1>
            <p className="text-xs text-muted-foreground">Pro</p>
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
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-muted"
                      activeClassName="bg-accent text-accent-foreground border-l-4 border-l-primary font-medium"
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
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
