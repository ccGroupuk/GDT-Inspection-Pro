import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { StatusBadge } from "@/components/status-badge";
import { PortalMessagesDisplay } from "@/components/portal-messages-display";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { ChevronRight, Briefcase, MapPin, Bell, Phone, MessageSquare, Mail, CheckCircle, Clock } from "lucide-react";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface PortalJob {
  id: string;
  jobNumber: string;
  serviceType: string;
  status: string;
  jobAddress: string;
  quotedValue: string | null;
  createdAt: string;
  changeOrdersTotal?: string;
  totalWithChangeOrders?: string;
  hasChangeOrders?: boolean;
}

interface PortalActivity {
  id: string;
  type: string;
  direction: string;
  date: string;
  outcome: string | null;
  hasFollowUp: boolean;
}

const ACTIVITY_LABELS: Record<string, { label: string; icon: typeof Phone }> = {
  phone_call: { label: "Phone Call", icon: Phone },
  text_message: { label: "Text Message", icon: MessageSquare },
  email: { label: "Email", icon: Mail },
  facebook_message: { label: "Facebook Message", icon: MessageSquare },
  website_enquiry: { label: "Website Enquiry", icon: Mail },
  site_visit: { label: "Site Visit", icon: Briefcase },
  quote_sent: { label: "Quote Sent", icon: Mail },
  follow_up: { label: "Follow Up", icon: Clock },
};

export default function PortalJobs() {
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();
  
  useTabNotification({ portalType: "client", accessToken: token });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: jobs, isLoading, error } = useQuery<PortalJob[]>({
    queryKey: ["/api/portal/jobs"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/jobs", token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const { data: activities = [] } = useQuery<PortalActivity[]>({
    queryKey: ["/api/portal/activities"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/activities", token);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!token,
  });

  if (!isAuthenticated) {
    return null;
  }

  const getActivityInfo = (type: string) => {
    return ACTIVITY_LABELS[type] || { label: type, icon: Bell };
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PortalMessagesDisplay portalType="client" accessToken={token || ""} />
        
        {activities.length > 0 && (
          <Card data-testid="card-recent-activity">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {activities.length} update{activities.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => {
                  const info = getActivityInfo(activity.type);
                  const Icon = info.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-2 border-b last:border-0"
                      data-testid={`activity-item-${activity.id}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{info.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.direction === "inbound" ? "From CCC" : "To you"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(activity.date), { addSuffix: true })}</span>
                          {activity.outcome && (
                            <>
                              <span className="mx-1">-</span>
                              <CheckCircle className="h-3 w-3" />
                              <span className="capitalize">{activity.outcome.replace(/_/g, " ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-jobs-title">My Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and track the progress of your projects
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Failed to load jobs. Please try again.</p>
            </CardContent>
          </Card>
        ) : !jobs || jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <Briefcase className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">No jobs yet</h3>
              <p className="text-sm text-muted-foreground">
                Your jobs will appear here once they are created
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/portal/jobs/${job.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`job-card-${job.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground" data-testid={`text-job-number-${job.id}`}>
                            {job.jobNumber}
                          </span>
                          <StatusBadge status={job.status} />
                        </div>
                        <h3 className="font-semibold truncate" data-testid={`text-service-type-${job.id}`}>
                          {job.serviceType}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.jobAddress}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {job.quotedValue && (
                          <div className="text-right">
                            <span className="font-mono font-semibold text-sm" data-testid={`text-quoted-value-${job.id}`}>
                              £{Number(job.hasChangeOrders ? job.totalWithChangeOrders : job.quotedValue).toLocaleString()}
                            </span>
                            {job.hasChangeOrders && (
                              <p className="text-xs text-muted-foreground">inc. changes</p>
                            )}
                          </div>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
