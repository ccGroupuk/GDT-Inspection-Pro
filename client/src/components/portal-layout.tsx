import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { LogOut, Briefcase, User, Star, Building2, HelpCircle, Calendar } from "lucide-react";

interface PortalLayoutProps {
  children: React.ReactNode;
}

interface NotificationCounts {
  pendingSurveys: number;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { logout, token } = usePortalAuth();
  const [location] = useLocation();

  // Fetch notification counts for nav badges
  const { data: notificationCounts } = useQuery<NotificationCounts>({
    queryKey: ["/api/portal/notification-counts"],
    queryFn: async () => {
      if (!token) return { pendingSurveys: 0 };
      const response = await portalApiRequest("GET", "/api/portal/notification-counts", token);
      if (!response.ok) return { pendingSurveys: 0 };
      return response.json();
    },
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const navItems = [
    { href: "/portal/jobs", label: "My Jobs", icon: Briefcase, badge: 0 },
    { href: "/portal/surveys", label: "Surveys", icon: Calendar, badge: notificationCounts?.pendingSurveys || 0 },
    { href: "/portal/profile", label: "My Profile", icon: User, badge: 0 },
    { href: "/portal/reviews", label: "Leave a Review", icon: Star, badge: 0 },
    { href: "/portal/help", label: "Help", icon: HelpCircle, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary" />
              <div>
                <span className="font-semibold text-sm" data-testid="text-portal-title">Client Portal</span>
                <span className="text-xs text-muted-foreground ml-2">CCC Group</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative rounded-none border-b-2 ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
