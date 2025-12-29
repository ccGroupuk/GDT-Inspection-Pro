import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { PortalMessagesDisplay } from "@/components/portal-messages-display";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Briefcase, MapPin, User, LogOut, Loader2, ChevronRight, Calendar, HelpCircle, Settings, ClipboardCheck, FileText, Siren, Phone, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import type { Job, Contact, EmergencyCallout, EmergencyCalloutResponse } from "@shared/schema";
import { EMERGENCY_INCIDENT_TYPES, EMERGENCY_PRIORITIES } from "@shared/schema";

interface EmergencyResponseWithDetails extends EmergencyCalloutResponse {
  callout: EmergencyCallout & {
    job?: Job;
    contact?: Contact | null;
  };
}

async function partnerApiRequest(method: string, url: string, data?: unknown, token?: string | null): Promise<Response> {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

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
  const { toast } = useToast();
  
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyResponseWithDetails | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [proposedMinutes, setProposedMinutes] = useState("");
  const [responseNotes, setResponseNotes] = useState("");
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  
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

  const { data: emergencyCallouts } = useQuery<EmergencyResponseWithDetails[]>({
    queryKey: ["/api/partner-portal/emergency-callouts"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch("/api/partner-portal/emergency-callouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch emergency callouts");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const pendingEmergencies = emergencyCallouts?.filter(r => 
    r.status === "pending" || r.status === "acknowledged"
  ) || [];

  const acknowledgeMutation = useMutation({
    mutationFn: async (responseId: string) => {
      return partnerApiRequest("POST", `/api/partner-portal/emergency-callouts/${responseId}/acknowledge`, {}, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ title: "Callout acknowledged" });
    },
    onError: () => {
      toast({ title: "Error acknowledging callout", variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { responseId: string; proposedArrivalMinutes: number; responseNotes?: string }) => {
      return partnerApiRequest("POST", `/api/partner-portal/emergency-callouts/${data.responseId}/respond`, {
        proposedArrivalMinutes: data.proposedArrivalMinutes,
        responseNotes: data.responseNotes,
      }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ title: "Response submitted" });
      setRespondDialogOpen(false);
      setSelectedEmergency(null);
      setProposedMinutes("");
      setResponseNotes("");
    },
    onError: () => {
      toast({ title: "Error submitting response", variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (data: { responseId: string; declineReason?: string }) => {
      return partnerApiRequest("POST", `/api/partner-portal/emergency-callouts/${data.responseId}/decline`, {
        declineReason: data.declineReason,
      }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ title: "Callout declined" });
      setDeclineDialogOpen(false);
      setSelectedEmergency(null);
      setDeclineReason("");
    },
    onError: () => {
      toast({ title: "Error declining callout", variant: "destructive" });
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
            <Link href="/partner-portal/emergency-callouts">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-emergency"
              >
                <Siren className="w-4 h-4 mr-2" />
                Emergency
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
        {pendingEmergencies.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-lg animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <Siren className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-bold text-red-700 dark:text-red-300">
                URGENT: Emergency Callout{pendingEmergencies.length > 1 ? "s" : ""} Awaiting Response
              </h2>
            </div>
            <div className="space-y-3">
              {pendingEmergencies.map((emergency) => {
                const { callout } = emergency;
                const incidentType = EMERGENCY_INCIDENT_TYPES.find(t => t.value === callout.incidentType);
                const priority = EMERGENCY_PRIORITIES.find(p => p.value === callout.priority);
                return (
                  <Card key={emergency.id} className="border-red-300 dark:border-red-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{incidentType?.label || callout.incidentType}</span>
                            <Badge variant="destructive">{priority?.label || callout.priority}</Badge>
                            <Badge variant="outline">{emergency.status}</Badge>
                          </div>
                          {callout.description && (
                            <p className="text-sm text-muted-foreground">{callout.description}</p>
                          )}
                          {callout.job ? (
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{callout.job.jobAddress || "Address not provided"}</span>
                              </div>
                              {callout.contact && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span>{callout.contact.phone || callout.contact.email}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm space-y-1">
                              {callout.clientName && <span className="font-medium">{callout.clientName}</span>}
                              {callout.clientAddress && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{callout.clientAddress} {callout.clientPostcode || ""}</span>
                                </div>
                              )}
                              {callout.clientPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span>{callout.clientPhone}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {callout.broadcastAt && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Broadcast: {new Date(callout.broadcastAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {emergency.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeMutation.mutate(emergency.id)}
                              disabled={acknowledgeMutation.isPending}
                              data-testid={`button-acknowledge-${emergency.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEmergency(emergency);
                              setRespondDialogOpen(true);
                            }}
                            data-testid={`button-respond-${emergency.id}`}
                          >
                            Respond with ETA
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedEmergency(emergency);
                              setDeclineDialogOpen(true);
                            }}
                            data-testid={`button-decline-${emergency.id}`}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
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

      <Dialog open={respondDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRespondDialogOpen(false);
          setSelectedEmergency(null);
          setProposedMinutes("");
          setResponseNotes("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-destructive" />
              Respond to Emergency Callout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estimated Arrival Time (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g., 30"
                value={proposedMinutes}
                onChange={(e) => setProposedMinutes(e.target.value)}
                min={1}
                data-testid="input-eta-minutes"
              />
              <p className="text-xs text-muted-foreground">
                How quickly can you arrive on site?
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional information..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-response-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!proposedMinutes || parseInt(proposedMinutes) < 1) {
                  toast({ title: "Please enter a valid ETA", variant: "destructive" });
                  return;
                }
                if (selectedEmergency) {
                  respondMutation.mutate({
                    responseId: selectedEmergency.id,
                    proposedArrivalMinutes: parseInt(proposedMinutes),
                    responseNotes: responseNotes || undefined,
                  });
                }
              }}
              disabled={respondMutation.isPending}
              data-testid="button-submit-response"
            >
              {respondMutation.isPending ? "Submitting..." : "Submit Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={declineDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDeclineDialogOpen(false);
          setSelectedEmergency(null);
          setDeclineReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Emergency Callout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="e.g., Currently on another job, too far away..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-decline-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEmergency) {
                  declineMutation.mutate({
                    responseId: selectedEmergency.id,
                    declineReason: declineReason || undefined,
                  });
                }
              }}
              disabled={declineMutation.isPending}
              data-testid="button-confirm-decline"
            >
              {declineMutation.isPending ? "Declining..." : "Decline Callout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
