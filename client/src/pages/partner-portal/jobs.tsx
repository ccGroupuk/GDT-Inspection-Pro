import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { PortalMessagesDisplay } from "@/components/portal-messages-display";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { Briefcase, MapPin, User, LogOut, Loader2, ChevronRight, Calendar, HelpCircle, Settings, ClipboardCheck, FileText } from "lucide-react";
import type { Job, Contact } from "@shared/schema";

type JobWithContact = Job & { contact?: Contact };

const PIPELINE_STAGES = [
  "New Enquiry", "Contacted", "Survey Booked", "Quoting", "Quote Sent",
  "Follow-Up Due", "Quote Accepted", "Deposit Requested", "Deposit Paid",
  "Scheduled", "In Progress", "Completed", "Invoice Sent", "Paid", "Closed", "Lost"
];

function getStageLabel(status: string) {
  const index = PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
  return index >= 0 ? PIPELINE_STAGES[index] : status;
}

function getStageColor(status: string) {
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
  if (stageIndex < 5) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (stageIndex < 9) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  if (stageIndex < 12) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (stageIndex < 14) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  if (status === "closed") return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

export default function PartnerPortalJobs() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  
  useTabNotification({ portalType: "partner", accessToken: token });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: jobs, isLoading } = useQuery<JobWithContact[]>({
    queryKey: ["/api/partner-portal/jobs"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/partner-portal/profile"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Partner Portal</h1>
              {profile && (
                <p className="text-sm text-muted-foreground">{profile.businessName}</p>
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
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-foreground"
              data-testid="nav-jobs"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Jobs
            </Button>
            <Link href="/partner-portal/surveys">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-surveys"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Surveys
              </Button>
            </Link>
            <Link href="/partner-portal/quotes">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-quotes"
              >
                <FileText className="w-4 h-4 mr-2" />
                Quotes
              </Button>
            </Link>
            <Link href="/partner-portal/calendar">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-calendar"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/partner-portal/help">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-help"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </Link>
            <Link href="/partner-portal/profile">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-profile"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <PortalMessagesDisplay portalType="partner" accessToken={token || ""} />
        
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">Your Assigned Jobs</h2>
          <p className="text-muted-foreground">
            View and track the jobs assigned to you
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Jobs Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any jobs assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/partner-portal/jobs/${job.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-partner-job-${job.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{job.jobNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.serviceType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStageColor(job.status)}>
                          {getStageLabel(job.status)}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {job.contact && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{job.contact.name}</span>
                        </div>
                      )}
                      {job.jobPostcode && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.jobPostcode}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
