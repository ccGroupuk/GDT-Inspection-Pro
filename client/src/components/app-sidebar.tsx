import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Handshake,
  CheckSquare,
  Plus,
  Building2,
  Settings,
  PoundSterling,
  Calendar,
  Megaphone,
  HelpCircle,
  UserCog,
  LogOut,
  Siren,
  Package,
  FileText,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs Pipeline",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: Users,
  },
  {
    title: "Trade Partners",
    url: "/partners",
    icon: Handshake,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Finance",
    url: "/finance",
    icon: PoundSterling,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: UserCog,
  },
  {
    title: "Emergency Callouts",
    url: "/emergency-callouts",
    icon: Siren,
  },
  {
    title: "Product Catalog",
    url: "/catalog",
    icon: Package,
  },
  {
    title: "Quote Templates",
    url: "/templates",
    icon: FileText,
  },
  {
    title: "SEO Power House",
    url: "/seo",
    icon: Megaphone,
  },
  {
    title: "Help Center",
    url: "/help-center",
    icon: HelpCircle,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">CCC Group</span>
              <span className="text-xs text-muted-foreground">CRM System</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="mx-2"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <Link href="/jobs/new">
          <Button className="w-full gap-2" data-testid="button-new-job">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
        <Button 
          variant="outline" 
          className="w-full gap-2" 
          data-testid="button-logout"
          onClick={() => {
            localStorage.removeItem("employeeToken");
            localStorage.removeItem("employeeData");
            window.location.href = "/landing";
          }}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
