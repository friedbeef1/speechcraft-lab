import { Home, Mic, BarChart3, Settings, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { AuthButton } from "@/components/AuthButton";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
const navItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Analytics",
  url: "/analytics",
  icon: BarChart3
}, {
  title: "Resources",
  url: "/resources",
  icon: BookOpen
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  return <Sidebar collapsible="icon" className="border-r border-border/50 glass-medium backdrop-blur-xl shadow-glass">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary font-semibold text-base mb-2">Eco Fluent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className="flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth hover:glass-light hover:shadow-glass" activeClassName="glass-light text-sidebar-primary font-medium shadow-glass glow-primary">
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-2">
              <AuthButton />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}