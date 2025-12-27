import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { 
  Briefcase, MapPin, User, Phone, Mail, LogOut, Loader2, 
  ArrowLeft, CheckCircle2, Circle
} from "lucide-react";
import type { Job, Contact, Task } from "@shared/schema";

type JobWithDetails = Job & { contact?: Contact; tasks?: Task[] };

const PIPELINE_STAGES = [
  "New Enquiry", "Contacted", "Survey Booked", "Quoting", "Quote Sent",
  "Follow-Up Due", "Quote Accepted", "Deposit Requested", "Deposit Paid",
  "Scheduled", "In Progress", "Completed", "Invoice Sent", "Paid", "Closed", "Lost"
];

function getStageLabel(status: string) {
  const index = PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
  return index >= 0 ? PIPELINE_STAGES[index] : status;
}

function getStageIndex(status: string) {
  return PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
}

function getStageColor(status: string) {
  const stageIndex = getStageIndex(status);
  if (stageIndex < 5) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (stageIndex < 9) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  if (stageIndex < 12) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (stageIndex < 14) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  if (status === "closed") return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

export default function PartnerPortalJobDetail() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { jobId } = useParams<{ jobId: string }>();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

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

  const { data: job, isLoading } = useQuery<JobWithDetails>({
    queryKey: ["/api/partner-portal/jobs", jobId],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load job");
      return res.json();
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const currentStageIndex = job ? getStageIndex(job.status) : 0;

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

      <main className="container mx-auto px-4 py-6">
        <Link href="/partner-portal/jobs">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-jobs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !job ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Job not found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-semibold">{job.jobNumber}</h2>
                <p className="text-muted-foreground">{job.serviceType}</p>
              </div>
              <Badge className={getStageColor(job.status)} data-testid="badge-job-stage">
                {getStageLabel(job.status)}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    {PIPELINE_STAGES.slice(0, 12).map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      return (
                        <div 
                          key={stage} 
                          className="flex flex-col items-center flex-1"
                          title={stage}
                        >
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center
                            ${isCompleted ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-primary text-white' : 
                              'bg-muted text-muted-foreground'}
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentStageIndex / 11) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}: {getStageLabel(job.status)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {job.contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{job.contact.name}</span>
                  </div>
                  {job.contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${job.contact.phone}`} className="text-primary hover:underline">
                        {job.contact.phone}
                      </a>
                    </div>
                  )}
                  {job.contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${job.contact.email}`} className="text-primary hover:underline">
                        {job.contact.email}
                      </a>
                    </div>
                  )}
                  {(job.contact.address || job.jobPostcode) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{job.contact.address}{job.contact.address && job.jobPostcode ? ', ' : ''}{job.jobPostcode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>
            )}

            {job.tasks && job.tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={task.status === "completed" ? "line-through text-muted-foreground" : ""}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
