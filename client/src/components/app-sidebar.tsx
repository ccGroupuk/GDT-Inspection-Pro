import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Scan,
  Calendar,
  Megaphone,
  HelpCircle,
  UserCog,
  LogOut,
  Siren,
  Package,
  FileText,
  Truck,
  ClipboardCheck,
  Heart,
  MessageSquare,
  Mail,
  Search,
  Phone,
  BarChart3,
  Receipt,
  Banknote,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Inbox,
  LinkIcon,
  GripVertical,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    title: "Team Hub",
    url: "/communications",
    icon: MessageSquare,
  },
  {
    title: "Messages Inbox",
    url: "/communications-inbox",
    icon: Mail,
  },
  {
    title: "Daily Activities",
    url: "/daily-activities",
    icon: Phone,
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
    title: "Payroll",
    url: "/payroll",
    icon: Banknote,
  },
  {
    title: "Partner Invoicing",
    url: "/partner-invoicing",
    icon: Receipt,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: UserCog,
  },
  {
    title: "Timesheets",
    url: "/timesheets",
    icon: Clock,
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
    title: "Suppliers",
    url: "/suppliers",
    icon: Building2,
  },
  {
    title: "Product Finder",
    url: "/product-finder",
    icon: Scan,
  },
  {
    title: "Supplier Lookup",
    url: "/supplier-lookup",
    icon: Search,
  },
  {
    title: "Tools & Vehicles",
    url: "/assets",
    icon: Truck,
  },
  {
    title: "Checklists",
    url: "/checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Checklist Analytics",
    url: "/checklist-analytics",
    icon: BarChart3,
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
    title: "Work-Life Balance",
    url: "/wellbeing",
    icon: Heart,
  },
  {
    title: "AI Assistant",
    url: "/ai-bridge",
    icon: Sparkles,
  },
  {
    title: "Agent Inbox",
    url: "/agent-inbox",
    icon: Inbox,
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

import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useState } from "react";

const SidebarItem = ({
  item,
  isActive,
  unreadCount,
  handleHide
}: {
  item: typeof menuItems[0];
  isActive: boolean;
  unreadCount: number;
  handleHide: (item: typeof menuItems[0]) => void;
}) => {
  const controls = useDragControls();
  const showBadge = item.url === "/communications" && unreadCount > 0;

  return (
    <Reorder.Item
      value={item}
      className="group/menu-item relative list-none flex items-center"
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
    >
      <div
        className="px-2 py-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground touch-none"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="flex-1 transition-all duration-200 pr-8"
      >
        <Link href={item.url}>
          <item.icon className="w-4 h-4" />
          <span className="flex-1 select-none">{item.title}</span>
          {showBadge && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs ml-auto">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleHide(item);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 transition-opacity p-1 hover:bg-sidebar-accent rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground"
        title="Hide from menu"
      >
        <EyeOff className="w-3.5 h-3.5" />
      </button>
    </Reorder.Item>
  );
};

export function AppSidebar() {
  const [location] = useLocation();
  const [items, setItems] = useState(menuItems); // Visible items
  const [hiddenItems, setHiddenItems] = useState<typeof menuItems>([]);
  const [isHiddenOpen, setIsHiddenOpen] = useState(false);

  // Load order and hidden state from local storage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem("sidebar-order");
    const savedHidden = localStorage.getItem("sidebar-hidden");

    let initialItems = [...menuItems];
    let initialHidden: typeof menuItems = [];

    if (savedHidden) {
      try {
        const secretTitles = JSON.parse(savedHidden);
        initialHidden = menuItems.filter(i => secretTitles.includes(i.title));
        // Remove hidden from initialItems
        initialItems = initialItems.filter(i => !secretTitles.includes(i.title));
      } catch (e) {
        console.error("Failed to parse hidden items");
      }
    }

    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Reconstruct visible items in saved order
        const orderedItems = parsedOrder
          .map((title: string) => initialItems.find(i => i.title === title))
          .filter(Boolean);

        // Add any new visible items that weren't in the saved order (appended)
        const newItems = initialItems.filter(i => !parsedOrder.includes(i.title));

        // This effectively sets 'items' to (SavedOrdered + NewVisible)
        initialItems = [...orderedItems, ...newItems];
      } catch (e) {
        console.error("Failed to parse sidebar order");
      }
    }

    setItems(initialItems);
    setHiddenItems(initialHidden);
  }, []);

  const saveState = (newItems: typeof menuItems, newHidden: typeof menuItems) => {
    localStorage.setItem("sidebar-order", JSON.stringify(newItems.map(i => i.title)));
    localStorage.setItem("sidebar-hidden", JSON.stringify(newHidden.map(i => i.title)));
    setItems(newItems);
    setHiddenItems(newHidden);
  };

  const handleReorder = (newOrder: typeof menuItems) => {
    setItems(newOrder);
    localStorage.setItem("sidebar-order", JSON.stringify(newOrder.map(i => i.title)));
  };

  const handleHide = (item: typeof menuItems[0]) => {
    const newItems = items.filter(i => i.title !== item.title);
    const newHidden = [...hiddenItems, item];
    saveState(newItems, newHidden);
  };

  const handleShow = (item: typeof menuItems[0]) => {
    const newHidden = hiddenItems.filter(i => i.title !== item.title);
    const newItems = [...items, item];
    saveState(newItems, newHidden);
  };

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.count || 0;

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
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={handleReorder}
              className="flex w-full min-w-0 flex-col gap-1"
            >
              {items.map((item) => {
                const isActive = location === item.url ||
                  (item.url !== "/" && location.startsWith(item.url));

                return (
                  <SidebarItem
                    key={item.title}
                    item={item}
                    isActive={isActive}
                    unreadCount={unreadCount}
                    handleHide={handleHide}
                  />
                );
              })}
            </Reorder.Group>

            {hiddenItems.length > 0 && (
              <Collapsible
                open={isHiddenOpen}
                onOpenChange={setIsHiddenOpen}
                className="mt-4 mx-2"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground h-8 text-xs font-normal">
                    <span>Hidden Items ({hiddenItems.length})</span>
                    {isHiddenOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {hiddenItems.map((item) => (
                    <div key={item.title} className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground/70 hover:bg-sidebar-accent/50 rounded-md group">
                      <item.icon className="w-4 h-4 opacity-50" />
                      <span className="flex-1 truncate">{item.title}</span>
                      <button
                        onClick={() => handleShow(item)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-opacity"
                        title="Show in menu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="secondary"
          className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
          onClick={() => {
            const url = `${window.location.origin}/enquiry`;
            navigator.clipboard.writeText(url);
            alert("Enquiry link copied to clipboard: " + url);
          }}
        >
          <LinkIcon className="w-4 h-4" />
          Copy Enquiry Link
        </Button>
        <Button
          variant="secondary"
          className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
          onClick={() => {
            const url = `${window.location.origin}/partner-onboarding`;
            navigator.clipboard.writeText(url);
            alert("Partner onboarding link copied to clipboard: " + url);
          }}
        >
          <LinkIcon className="w-4 h-4" />
          Copy Partner Sign-up Link
        </Button>
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
