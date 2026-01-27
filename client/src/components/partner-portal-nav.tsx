import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, Calendar, HelpCircle, Settings, 
  ClipboardCheck, FileText, Siren, LogOut, CreditCard 
} from "lucide-react";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";

interface NotificationCounts {
  surveys: number;
  jobs: number;
  messages: number;
  emergency: number;
  total: number;
}

interface PartnerPortalNavProps {
  activeTab?: "jobs" | "surveys" | "quotes" | "calendar" | "emergency" | "help" | "profile" | "billing";
}

export function PartnerPortalNav({ activeTab = "jobs" }: PartnerPortalNavProps) {
  const { token, logout } = usePartnerPortalAuth();
  const [location] = useLocation();

  const { data: counts } = useQuery<NotificationCounts>({
    queryKey: ["/api/partner-portal/notification-counts"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/notification-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { surveys: 0, jobs: 0, messages: 0, emergency: 0, total: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/partner-portal/profile"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const tabs = [
    { id: "jobs", label: "Jobs", icon: Briefcase, href: "/partner-portal/jobs", count: counts?.jobs },
    { id: "surveys", label: "Surveys", icon: ClipboardCheck, href: "/partner-portal/surveys", count: counts?.surveys },
    { id: "quotes", label: "Quotes", icon: FileText, href: "/partner-portal/quotes", count: 0 },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/partner-portal/calendar", count: 0 },
    { id: "emergency", label: "Emergency", icon: Siren, href: "/partner-portal/emergency-callouts", count: counts?.emergency },
    { id: "billing", label: "Billing", icon: CreditCard, href: "/partner-portal/billing", count: 0 },
    { id: "help", label: "Help", icon: HelpCircle, href: "/partner-portal/help", count: 0 },
    { id: "profile", label: "Settings", icon: Settings, href: "/partner-portal/profile", count: 0 },
  ];

  return (
    <>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Partner Portal</h1>
              {profile && (
                <p className="text-sm text-muted-foreground">{profile.businessName || profile.companyName}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} data-testid="button-partner-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <nav className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id || 
                location === tab.href ||
                (tab.id === "jobs" && location.startsWith("/partner-portal/jobs"));
              
              return (
                <Link key={tab.id} href={tab.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-none border-b-2 relative ${
                      isActive 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground"
                    }`}
                    data-testid={`nav-${tab.id}`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.count && tab.count > 0 ? (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 h-5 min-w-5 px-1 text-xs"
                        data-testid={`badge-${tab.id}-count`}
                      >
                        {tab.count}
                      </Badge>
                    ) : null}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
