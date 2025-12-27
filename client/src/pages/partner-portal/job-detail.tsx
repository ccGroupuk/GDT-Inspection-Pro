import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { 
  Briefcase, MapPin, User, Phone, Mail, LogOut, Loader2, 
  ArrowLeft, CheckCircle2, Circle, FileText, MessageSquare, Image
} from "lucide-react";
import type { Job, Contact, Task, QuoteItem, JobNote, JobNoteAttachment } from "@shared/schema";
import { NOTE_VISIBILITY } from "@shared/schema";

interface JobNoteWithAttachments extends JobNote {
  attachments: JobNoteAttachment[];
}

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

  const { data: quoteItems } = useQuery<QuoteItem[]>({
    queryKey: ["/api/partner-portal/jobs", jobId, "quote-items"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/quote-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load quote items");
      return res.json();
    },
  });

  const { data: jobNotes } = useQuery<JobNoteWithAttachments[]>({
    queryKey: ["/api/partner-portal/jobs", jobId, "notes"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load notes");
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
                    {PIPELINE_STAGES.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      return (
                        <div 
                          key={stage} 
                          className="flex flex-col items-center flex-1"
                          title={stage}
                        >
                          <div className={`
                            w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center
                            ${isCompleted ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-primary text-white' : 
                              'bg-muted text-muted-foreground'}
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              <Circle className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
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
                  <CardTitle className="text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>
            )}

            {quoteItems && quoteItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Quote / Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-right p-3 font-medium w-16">Qty</th>
                          <th className="text-right p-3 font-medium w-24">Price</th>
                          <th className="text-right p-3 font-medium w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quoteItems.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-right font-mono text-muted-foreground">{item.quantity}</td>
                            <td className="p-3 text-right font-mono text-muted-foreground">£{parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-semibold text-lg">
                      Total: £{quoteItems.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {jobNotes && jobNotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes from Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobNotes.map((note) => (
                        <div 
                          key={note.id} 
                          className="p-3 rounded-lg bg-muted/50"
                          data-testid={`partner-note-${note.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          {note.attachments && note.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {note.attachments.map((att) => (
                                <a 
                                  key={att.id}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline p-1 rounded bg-background"
                                  data-testid={`partner-attachment-${att.id}`}
                                >
                                  <Image className="w-3 h-3" />
                                  {att.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {note.createdAt && new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                    ))}
                  </div>
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
