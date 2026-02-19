import { LayoutDashboard, Monitor, MessageSquare, Settings, LogOut, Shield, Wifi } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Dispositivos", url: "/devices", icon: Monitor },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, role, signOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Wifi className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">WIFIControl</span>
            <span className="text-xs text-sidebar-foreground/60">Pro v2.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
            <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-medium text-sidebar-foreground">{user?.email}</span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              {role === "admin" ? "Administrador" : "Equipe Técnica"}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
