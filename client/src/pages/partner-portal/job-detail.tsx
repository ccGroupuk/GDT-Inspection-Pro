import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Briefcase, MapPin, User, Phone, Mail, LogOut, Loader2,
  ArrowLeft, CheckCircle2, Circle, FileText, MessageSquare, Image,
  Siren, AlertTriangle, CheckCircle, XCircle, Clock, Calendar, Banknote
} from "lucide-react";
import type { Job, Contact, Task, QuoteItem, JobNote, JobNoteAttachment, EmergencyCallout, JobScheduleProposal } from "@shared/schema";
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

async function partnerApiRequest(method: string, url: string, body: Record<string, unknown>, token: string | null) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export default function PartnerPortalJobDetail() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeJobDialogOpen, setCompleteJobDialogOpen] = useState(false);
  const [jobCompletionNotes, setJobCompletionNotes] = useState("");
  const [totalCollected, setTotalCollected] = useState<string>("");
  const [completionNotes, setCompletionNotes] = useState("");

  // Accept/Decline job state
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Survey request state
  const [requestSurveyDialogOpen, setRequestSurveyDialogOpen] = useState(false);
  const [surveyPreferredDate, setSurveyPreferredDate] = useState("");
  const [surveyPreferredTime, setSurveyPreferredTime] = useState("");
  const [surveyNotes, setSurveyNotes] = useState("");

  // Start date request state
  const [requestStartDateDialogOpen, setRequestStartDateDialogOpen] = useState(false);
  const [proposedStartDate, setProposedStartDate] = useState("");
  const [proposedEndDate, setProposedEndDate] = useState("");
  const [startDateNotes, setStartDateNotes] = useState("");

  // Payment request state
  const [requestPaymentDialogOpen, setRequestPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentType, setPaymentType] = useState<"partner_deposit" | "partner_balance" | "partner_commission">("partner_balance");
  const [isPartnerPayingCCC, setIsPartnerPayingCCC] = useState(false); // For partner-led jobs

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

  // Query emergency callout linked to this job where partner is assigned
  const { data: emergencyCallout } = useQuery<EmergencyCallout | null>({
    queryKey: ["/api/partner-portal/jobs", jobId, "emergency-callout"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/emergency-callout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Query schedule proposal for this job
  const { data: scheduleProposal } = useQuery<JobScheduleProposal | null>({
    queryKey: ["/api/partner-portal/jobs", jobId, "schedule-proposal"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/schedule-proposal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Query payment requests for this job (partner payout requests)
  interface PaymentRequest {
    id: string;
    jobId: string;
    type: string;
    amount: string;
    description: string | null;
    status: string;
    approvalStatus: string | null;
    confirmedAt: string | null;
    createdAt: string | null;
  }

  const { data: paymentRequests } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/partner-portal/jobs", jobId, "payment-requests"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/payment-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Request payment mutation
  const requestPaymentMutation = useMutation({
    mutationFn: async (data: { amount: string; description?: string; type: "partner_deposit" | "partner_balance" | "partner_commission" }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/request-payment`, data, token);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to request payment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId, "payment-requests"] });
      toast({ title: "Payment Request Sent", description: "Your payment request has been submitted to the admin." });
      setRequestPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentDescription("");
      setPaymentType("partner_balance");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Request start date mutation
  const requestStartDateMutation = useMutation({
    mutationFn: async (data: { proposedStartDate: string; proposedEndDate?: string; notes?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/request-start-date`, data, token);
      if (!res.ok) throw new Error("Failed to request start date");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId, "schedule-proposal"] });
      toast({ title: "Start Date Requested", description: "Your preferred start date has been sent to the admin." });
      setRequestStartDateDialogOpen(false);
      setProposedStartDate("");
      setProposedEndDate("");
      setStartDateNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error requesting start date", description: error.message, variant: "destructive" });
    },
  });

  // Respond to admin's schedule proposal
  const respondToProposalMutation = useMutation({
    mutationFn: async (data: { response: "accepted" | "declined" | "countered"; counterDate?: string; reason?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/respond-schedule-proposal`, data, token);
      if (!res.ok) throw new Error("Failed to respond to proposal");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId, "schedule-proposal"] });
      if (variables.response === "accepted") {
        toast({ title: "Date Accepted", description: "You have confirmed the proposed start date." });
      } else if (variables.response === "countered") {
        toast({ title: "Alternative Date Sent", description: "Your preferred date has been sent to the admin." });
      } else {
        toast({ title: "Date Declined", description: "You have declined the proposed start date." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error responding to proposal", description: error.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { calloutId: string; totalCollected: string; completionNotes?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/emergency-callouts/${data.calloutId}/complete`, {
        totalCollected: data.totalCollected,
        completionNotes: data.completionNotes,
      }, token);
      if (!res.ok) throw new Error("Failed to complete callout");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId, "emergency-callout"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({
        title: "Emergency Completed",
        description: data.message || `You owe CCC £${data.feeAmount} (${data.feePercent}% callout fee).`
      });
      setCompleteDialogOpen(false);
      setTotalCollected("");
      setCompletionNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error completing callout", description: error.message, variant: "destructive" });
    },
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/accept`, {}, token);
      if (!res.ok) throw new Error("Failed to accept job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs"] });
      toast({ title: "Job Accepted", description: "You have accepted this job assignment." });
    },
    onError: (error: Error) => {
      toast({ title: "Error accepting job", description: error.message, variant: "destructive" });
    },
  });

  // Request survey mutation
  const requestSurveyMutation = useMutation({
    mutationFn: async (data: { preferredDate?: string; preferredTime?: string; notes?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/request-survey`, data, token);
      if (!res.ok) throw new Error("Failed to request survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey Requested", description: "Your survey request has been submitted to the admin." });
      setRequestSurveyDialogOpen(false);
      setSurveyPreferredDate("");
      setSurveyPreferredTime("");
      setSurveyNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error requesting survey", description: error.message, variant: "destructive" });
    },
  });

  // Decline job mutation
  const declineJobMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/decline`, { reason }, token);
      if (!res.ok) throw new Error("Failed to decline job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs"] });
      toast({ title: "Job Declined", description: "You have declined this job assignment." });
      setDeclineDialogOpen(false);
      setDeclineReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error declining job", description: error.message, variant: "destructive" });
    },
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/complete`, { completionNotes: notes }, token);
      if (!res.ok) throw new Error("Failed to complete job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs"] });
      toast({ title: "Job Completed", description: "You have marked this job as complete. It is now ready for payment processing." });
      setCompleteJobDialogOpen(false);
      setJobCompletionNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error completing job", description: error.message, variant: "destructive" });
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

            {/* Partner Acceptance Section */}
            {job.partnerStatus === "offered" || !job.partnerStatus ? (
              <Card className="border-primary border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have been assigned to this job. Please accept or decline the assignment.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => acceptJobMutation.mutate()}
                      disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
                      className="flex-1"
                      data-testid="button-accept-job"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Job
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeclineDialogOpen(true)}
                      disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
                      className="flex-1"
                      data-testid="button-decline-job"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : job.partnerStatus === "accepted" ? (
              <>
                <Card className="border-green-500 border-2">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">You have accepted this job</span>
                      {job.partnerRespondedAt && (
                        <span className="text-sm text-muted-foreground ml-auto">
                          {new Date(job.partnerRespondedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Job Completion Section */}
                {job.partnerStatus === "in_progress" || job.partnerStatus === "accepted" ? (
                  <Card className="border-green-500 border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Complete Job
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Is this job 100% complete and ready for sign off? Marking it as complete will notify CCC to process your payment.
                      </p>
                      <Button
                        onClick={() => setCompleteJobDialogOpen(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-complete-job"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sign Off & Complete Job
                      </Button>
                    </CardContent>
                  </Card>
                ) : job.partnerStatus === "completed" ? (
                  <Card className="border-green-500 border-2 bg-green-50 dark:bg-green-900/10">
                    <CardContent className="py-6">
                      <div className="flex flex-col items-center justify-center text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-500">Job Completed</h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          You have signed off on this job. It is now ready for payment processing.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <Link href={`/partner-portal/quotes/new?jobId=${job.id}`}>
                        <Button variant="outline" className="w-full" data-testid="button-create-quote">
                          <FileText className="w-4 h-4 mr-2" />
                          Create Quote
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setRequestSurveyDialogOpen(true)}
                        data-testid="button-request-survey"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Survey
                      </Button>
                      {!scheduleProposal && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setRequestStartDateDialogOpen(true)}
                          data-testid="button-request-start-date"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Request Start Date
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Create a quote, book a survey, or request your preferred start date.
                    </p>
                  </CardContent>
                </Card>

                {/* Schedule Proposal Status */}
                {scheduleProposal && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date Scheduling
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="text-sm font-medium">
                            {scheduleProposal.proposedByRole === "partner" ? "Your Requested Date" :
                              scheduleProposal.proposedByRole === "client" ? "Client Requested Date" :
                                "Admin Proposed Date"}
                          </span>
                          <Badge variant={
                            scheduleProposal.status === "scheduled" ? "default" :
                              scheduleProposal.status === "pending_partner" ? "secondary" :
                                scheduleProposal.status === "pending_admin" ? "outline" :
                                  scheduleProposal.status === "pending_client" ? "outline" :
                                    scheduleProposal.status === "partner_declined" || scheduleProposal.status === "admin_declined" ? "destructive" :
                                      "outline"
                          }>
                            {scheduleProposal.status === "pending_partner" && "Your Response Needed"}
                            {scheduleProposal.status === "pending_admin" && (scheduleProposal.proposedByRole === "partner" ? "Awaiting Admin Response" : "Being Reviewed by Admin")}
                            {scheduleProposal.status === "pending_client" && "Awaiting Client Response"}
                            {scheduleProposal.status === "partner_accepted" && "You Accepted"}
                            {scheduleProposal.status === "partner_countered" && "Alternative Sent"}
                            {scheduleProposal.status === "partner_declined" && "You Declined"}
                            {scheduleProposal.status === "admin_declined" && "Declined by Admin"}
                            {scheduleProposal.status === "client_accepted" && "Client Accepted"}
                            {scheduleProposal.status === "client_countered" && "Client Countered"}
                            {scheduleProposal.status === "client_declined" && "Client Declined"}
                            {scheduleProposal.status === "scheduled" && "Confirmed"}
                          </Badge>
                        </div>

                        {/* Info message when a client proposed and partner can also respond */}
                        {(scheduleProposal.status === "pending_admin" && scheduleProposal.proposedByRole === "client") && (
                          <p className="text-sm text-muted-foreground mb-3">
                            The client has requested this start date. You can accept, suggest a different date, or wait for the admin to respond.
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              {scheduleProposal.proposedByRole === "partner" ? "Your Requested Date" :
                                scheduleProposal.proposedByRole === "client" ? "Client's Requested Date" :
                                  "Proposed Date"}
                            </p>
                            <p className="font-medium">{new Date(scheduleProposal.proposedStartDate).toLocaleDateString()}</p>
                            {scheduleProposal.proposedEndDate && (
                              <p className="text-xs text-muted-foreground">
                                to {new Date(scheduleProposal.proposedEndDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {scheduleProposal.counterProposedDate && (
                            <div>
                              <p className="text-muted-foreground">Counter Date</p>
                              <p className="font-medium">{new Date(scheduleProposal.counterProposedDate).toLocaleDateString()}</p>
                              {scheduleProposal.counterReason && (
                                <p className="text-xs text-muted-foreground mt-1">{scheduleProposal.counterReason}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {scheduleProposal.adminNotes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">Admin Notes: {scheduleProposal.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Response buttons when admin proposes OR when client proposes (partner can also respond) */}
                      {(scheduleProposal.status === "pending_partner" ||
                        (scheduleProposal.status === "pending_admin" && scheduleProposal.proposedByRole === "client")) && (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => respondToProposalMutation.mutate({ response: "accepted" })}
                              disabled={respondToProposalMutation.isPending}
                              data-testid="button-accept-proposed-date"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accept Date
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRequestStartDateDialogOpen(true)}
                              data-testid="button-counter-proposed-date"
                            >
                              Suggest Different Date
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToProposalMutation.mutate({ response: "declined" })}
                              disabled={respondToProposalMutation.isPending}
                              data-testid="button-decline-proposed-date"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                      {/* Show request new date button for declined/countered states */}
                      {(scheduleProposal.status === "partner_declined" || scheduleProposal.status === "admin_declined") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRequestStartDateDialogOpen(true)}
                          data-testid="button-request-new-date"
                        >
                          Request New Date
                        </Button>
                      )}

                      {scheduleProposal.status === "scheduled" && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Start date confirmed - check the calendar for details
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Payment Request Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Payment Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentRequests && paymentRequests.length > 0 ? (
                      <div className="space-y-3">
                        {paymentRequests.map((req) => (
                          <div key={req.id} className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">£{parseFloat(req.amount).toFixed(2)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {req.type === "partner_deposit" ? "Deposit" : "Balance"}
                                </Badge>
                              </div>
                              <Badge variant={
                                req.approvalStatus === "confirmed" ? "default" :
                                  req.approvalStatus === "marked_paid" ? "secondary" :
                                    req.approvalStatus === "rejected" ? "destructive" :
                                      "outline"
                              }>
                                {req.approvalStatus === "confirmed" && "Paid"}
                                {req.approvalStatus === "marked_paid" && "Processing"}
                                {(req.approvalStatus === "pending" || !req.approvalStatus) && "Pending Review"}
                                {req.approvalStatus === "rejected" && "Rejected"}
                              </Badge>
                            </div>
                            {req.description && (
                              <p className="text-sm text-muted-foreground">{req.description}</p>
                            )}
                            {req.createdAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested: {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            )}
                            {req.confirmedAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Paid: {new Date(req.confirmedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No payment requests yet.</p>
                    )}

                    {/* Financial summary and payment request buttons */}
                    {(() => {
                      // Calculate financial summary
                      const partnerTotal = parseFloat(job.partnerCharge || "0");

                      // Determine payment flow based on team type FIRST
                      // partner = Partner collects from client, owes CCC commission
                      // hybrid/in_house = CCC collects, pays partner
                      const teamType = (job as Job & { teamType?: string }).teamType || "hybrid";
                      const isPartnerLed = teamType === "partner";
                      const isHybrid = teamType === "hybrid";

                      // For partner-led jobs: Sum commission payments (partner paying CCC)
                      // For CCC-led jobs: Sum payments TO partner (deposit/balance/payout)
                      const paidToDate = paymentRequests
                        ?.filter(r => r.approvalStatus === "confirmed")
                        .filter(r => isPartnerLed
                          ? r.type === "partner_commission"
                          : (r.type === "partner_deposit" || r.type === "partner_balance" || r.type === "partner_payout"))
                        .reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0;
                      const remainingBalance = Math.max(partnerTotal - paidToDate, 0);

                      // Check if there's a pending request
                      const hasPendingRequest = paymentRequests?.some(r =>
                        r.approvalStatus === "pending" || r.approvalStatus === "marked_paid"
                      );

                      // Check if deposit has already been paid or requested (only for CCC-led jobs)
                      const hasDepositRequest = paymentRequests?.some(r => r.type === "partner_deposit");
                      const depositPaid = paymentRequests?.some(r =>
                        r.type === "partner_deposit" && r.approvalStatus === "confirmed"
                      );

                      // For hybrid jobs, show if client deposit was received
                      const clientDepositReceived = job.depositReceived;

                      return (
                        <>
                          {/* Financial Summary Card */}
                          {job.partnerCharge && (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                              {/* Team type indicator */}
                              <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-xs text-muted-foreground">Payment Flow:</span>
                                <Badge variant="outline" className="text-xs">
                                  {isPartnerLed ? "You collect from client" :
                                    isHybrid ? "Shared (CCC collects)" : "CCC collects"}
                                </Badge>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  {isPartnerLed ? "Job Value:" : "Agreed Rate:"}
                                </span>
                                <span className="font-medium">£{partnerTotal.toFixed(2)}</span>
                              </div>

                              {/* Show client deposit status for hybrid jobs */}
                              {isHybrid && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Client Deposit:</span>
                                  <span className={`text-sm ${clientDepositReceived ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                                    {clientDepositReceived ? "Received" : "Pending"}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  {isPartnerLed ? "Commission Paid to CCC:" : "Paid to You:"}
                                </span>
                                <span className={`font-medium ${paidToDate > 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                                  £{paidToDate.toFixed(2)}
                                </span>
                              </div>

                              <div className="border-t pt-2 flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  {isPartnerLed ? "Commission Due to CCC:" : "CCC Owes You:"}
                                </span>
                                <span className={`font-bold text-lg ${isPartnerLed ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                  £{remainingBalance.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Payment Request Buttons - Different based on team type */}
                          {!hasPendingRequest && remainingBalance > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {isPartnerLed ? (
                                /* Partner-led: Partner pays CCC commission */
                                <Button
                                  className="flex-1"
                                  onClick={() => {
                                    setPaymentAmount(remainingBalance.toFixed(2));
                                    setPaymentType("partner_commission");
                                    setIsPartnerPayingCCC(true);
                                    setRequestPaymentDialogOpen(true);
                                  }}
                                  data-testid="button-pay-commission"
                                >
                                  <Banknote className="w-4 h-4 mr-2" />
                                  Pay CCC Commission
                                </Button>
                              ) : (
                                /* CCC collects: Partner requests payment from CCC */
                                <>
                                  {/* Request Deposit - only show if no deposit has been requested yet */}
                                  {!hasDepositRequest && (
                                    <Button
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => {
                                        // Default deposit to 50% of remaining or total
                                        const depositAmt = (partnerTotal * 0.5).toFixed(2);
                                        setPaymentAmount(depositAmt);
                                        setPaymentType("partner_deposit");
                                        setIsPartnerPayingCCC(false);
                                        setRequestPaymentDialogOpen(true);
                                      }}
                                      data-testid="button-request-deposit"
                                    >
                                      <Banknote className="w-4 h-4 mr-2" />
                                      Request Deposit
                                    </Button>
                                  )}

                                  {/* Request Final Balance */}
                                  <Button
                                    className="flex-1"
                                    onClick={() => {
                                      setPaymentAmount(remainingBalance.toFixed(2));
                                      setPaymentType("partner_balance");
                                      setIsPartnerPayingCCC(false);
                                      setRequestPaymentDialogOpen(true);
                                    }}
                                    data-testid="button-request-balance"
                                  >
                                    <Banknote className="w-4 h-4 mr-2" />
                                    Request Final Balance
                                  </Button>
                                </>
                              )}
                            </div>
                          )}

                          {hasPendingRequest && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                              {(() => {
                                const processingRequest = paymentRequests?.find(r => r.approvalStatus === "marked_paid");
                                if (processingRequest) {
                                  return isPartnerLed
                                    ? "Your commission payment is being processed."
                                    : "Your payment request is being processed. Please wait for final confirmation.";
                                }
                                return isPartnerLed
                                  ? "Your commission payment is pending review."
                                  : "You have a pending payment request. Please wait for admin approval.";
                              })()}
                            </p>
                          )}

                          {remainingBalance === 0 && paidToDate > 0 && (
                            <p className="text-sm text-green-600 dark:text-green-400 text-center">
                              {isPartnerLed
                                ? "Commission fully paid. Thank you!"
                                : "All payments received. Thank you!"}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : job.partnerStatus === "declined" ? (
              <Card className="border-red-500 border-2">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">You declined this job</span>
                    {job.partnerRespondedAt && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(job.partnerRespondedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {job.partnerDeclineReason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Reason: {job.partnerDeclineReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

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

            {/* Emergency Callout Section - Show if assigned to this partner and not resolved */}
            {emergencyCallout && (emergencyCallout.status === "assigned" || emergencyCallout.status === "in_progress") && (
              <Card className="border-red-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <Siren className="w-5 h-5" />
                    Emergency Callout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                    You have been assigned to this emergency callout.
                  </div>
                  <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Reminder:</strong> Collect full payment from client. You will owe CCC a 20% callout fee surcharge upon completion.
                    </span>
                  </div>
                  <Button
                    onClick={() => setCompleteDialogOpen(true)}
                    className="w-full"
                    data-testid="button-complete-emergency"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete & Submit Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Show completed emergency info */}
            {emergencyCallout && emergencyCallout.status === "resolved" && (
              <Card className="border-green-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Emergency Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                    This emergency callout has been completed.
                    {emergencyCallout.totalCollected && (
                      <div className="mt-2">
                        <strong>Payment collected:</strong> £{parseFloat(emergencyCallout.totalCollected).toFixed(2)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Show notice when limited info is displayed (before acceptance) */}
                  {job.partnerStatus !== "accepted" && (
                    <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm mb-4 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Limited information:</strong> Full client details (phone, email, address) will be available after you accept this job.
                      </span>
                    </div>
                  )}
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
                  {(job.contact.address || job.contact.postcode) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {job.contact.address && <>{job.contact.address}, </>}
                        {job.contact.postcode}
                      </span>
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

        {/* Emergency Complete Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setCompleteDialogOpen(false);
            setTotalCollected("");
            setCompletionNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Emergency Callout
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm">
                <strong>Payment Reminder:</strong> You should have collected the full payment from the client before completing this callout.
              </div>

              <div className="space-y-2">
                <Label>Total Amount Collected from Client (£)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="e.g., 250.00"
                  value={totalCollected}
                  onChange={(e) => setTotalCollected(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-testid="input-total-collected"
                />
              </div>

              {totalCollected && parseFloat(totalCollected) > 0 && (
                <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total collected:</span>
                    <span className="font-medium">£{parseFloat(totalCollected).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>20% Callout Fee (owed to CCC):</span>
                    <span className="font-bold">£{(parseFloat(totalCollected) * 0.20).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-300 dark:border-amber-700 pt-1 mt-1">
                    <span>Your Earnings:</span>
                    <span className="font-medium">£{(parseFloat(totalCollected) * 0.80).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Completion Notes (Optional)</Label>
                <Textarea
                  placeholder="Any notes about the job..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="min-h-[80px]"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-testid="textarea-completion-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!totalCollected || parseFloat(totalCollected) <= 0) {
                    toast({ title: "Please enter the total amount collected", variant: "destructive" });
                    return;
                  }
                  if (emergencyCallout) {
                    completeMutation.mutate({
                      calloutId: emergencyCallout.id,
                      totalCollected: totalCollected,
                      completionNotes: completionNotes || undefined,
                    });
                  }
                }}
                disabled={completeMutation.isPending}
                data-testid="button-confirm-complete"
              >
                {completeMutation.isPending ? "Completing..." : "Complete & Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Job Dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setDeclineDialogOpen(false);
            setDeclineReason("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Decline Job Assignment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to decline this job? Please provide a reason to help the admin understand why.
              </p>
              <div className="space-y-2">
                <Label>Reason for Declining (Optional)</Label>
                <Textarea
                  placeholder="e.g., Schedule conflict, outside my area, not my trade..."
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
                onClick={() => declineJobMutation.mutate(declineReason)}
                disabled={declineJobMutation.isPending}
                data-testid="button-confirm-decline"
              >
                {declineJobMutation.isPending ? "Declining..." : "Decline Job"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Survey Dialog */}
        <Dialog open={requestSurveyDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setRequestSurveyDialogOpen(false);
            setSurveyPreferredDate("");
            setSurveyPreferredTime("");
            setSurveyNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Book Survey Visit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Request a survey visit with the client to assess the job requirements.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={surveyPreferredDate}
                    onChange={(e) => setSurveyPreferredDate(e.target.value)}
                    data-testid="input-survey-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={surveyPreferredTime}
                    onChange={(e) => setSurveyPreferredTime(e.target.value)}
                    data-testid="input-survey-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any specific requirements or access instructions..."
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-survey-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestSurveyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => requestSurveyMutation.mutate({
                  preferredDate: surveyPreferredDate || undefined,
                  preferredTime: surveyPreferredTime || undefined,
                  notes: surveyNotes || undefined,
                })}
                disabled={requestSurveyMutation.isPending}
                data-testid="button-confirm-survey"
              >
                {requestSurveyMutation.isPending ? "Requesting..." : "Request Survey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Start Date Dialog */}
        <Dialog open={requestStartDateDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setRequestStartDateDialogOpen(false);
            setProposedStartDate("");
            setProposedEndDate("");
            setStartDateNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {scheduleProposal?.status === "pending_partner" ? "Suggest Alternative Date" : "Request Start Date"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {scheduleProposal?.status === "pending_partner"
                  ? "Propose an alternative start date that works better for your schedule."
                  : "Request your preferred start date for this job. The admin will review and confirm."
                }
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Start Date *</Label>
                  <Input
                    type="date"
                    value={proposedStartDate}
                    onChange={(e) => setProposedStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated End Date</Label>
                  <Input
                    type="date"
                    value={proposedEndDate}
                    onChange={(e) => setProposedEndDate(e.target.value)}
                    min={proposedStartDate || new Date().toISOString().split('T')[0]}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any scheduling constraints or preferences..."
                  value={startDateNotes}
                  onChange={(e) => setStartDateNotes(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-start-date-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestStartDateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!proposedStartDate) {
                    toast({ title: "Please select a start date", variant: "destructive" });
                    return;
                  }
                  if (scheduleProposal?.status === "pending_partner") {
                    // Counter-propose the admin's date
                    respondToProposalMutation.mutate({
                      response: "countered",
                      counterDate: proposedStartDate,
                      reason: startDateNotes || undefined,
                    });
                    setRequestStartDateDialogOpen(false);
                    setProposedStartDate("");
                    setProposedEndDate("");
                    setStartDateNotes("");
                  } else {
                    // Create new request
                    requestStartDateMutation.mutate({
                      proposedStartDate,
                      proposedEndDate: proposedEndDate || undefined,
                      notes: startDateNotes || undefined,
                    });
                  }
                }}
                disabled={requestStartDateMutation.isPending || respondToProposalMutation.isPending}
                data-testid="button-confirm-start-date"
              >
                {(requestStartDateMutation.isPending || respondToProposalMutation.isPending)
                  ? "Sending..."
                  : scheduleProposal?.status === "pending_partner"
                    ? "Send Alternative Date"
                    : "Request Start Date"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Payment Dialog */}
        <Dialog open={requestPaymentDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setRequestPaymentDialogOpen(false);
            setPaymentAmount("");
            setPaymentDescription("");
            setPaymentType("partner_balance");
            setIsPartnerPayingCCC(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                {isPartnerPayingCCC
                  ? "Pay CCC Commission"
                  : paymentType === "partner_deposit"
                    ? "Request Deposit"
                    : "Request Final Balance"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {isPartnerPayingCCC
                  ? "Submit your commission payment to CCC for this job. You collected payment directly from the client."
                  : paymentType === "partner_deposit"
                    ? "Request an upfront deposit payment before starting work on this job."
                    : "Request the remaining balance for your completed work on this job."
                }
              </p>
              <div className="space-y-2">
                <Label>Amount (£)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="e.g., 500.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  data-testid="input-payment-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder={isPartnerPayingCCC
                    ? "Any notes about this commission payment..."
                    : paymentType === "partner_deposit"
                      ? "Any notes about the deposit request..."
                      : "Brief description of completed work..."
                  }
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-payment-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRequestPaymentDialogOpen(false)}
                data-testid="button-cancel-payment-request"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(paymentAmount);
                  if (!paymentAmount || isNaN(amount) || amount <= 0) {
                    toast({ title: "Please enter a valid amount", variant: "destructive" });
                    return;
                  }
                  requestPaymentMutation.mutate({
                    amount: paymentAmount,
                    description: paymentDescription || undefined,
                    type: paymentType,
                  });
                }}
                disabled={requestPaymentMutation.isPending}
                data-testid="button-confirm-payment-request"
              >
                {requestPaymentMutation.isPending
                  ? "Submitting..."
                  : isPartnerPayingCCC
                    ? "Submit Commission"
                    : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Job Dialog */}
        <Dialog open={completeJobDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setCompleteJobDialogOpen(false);
            setJobCompletionNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Sign Off & Complete Job
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                <strong>Confirm Completion:</strong> You are marking this job as 100% complete. This will update the job status and signal that you are ready for payment.
              </div>

              <div className="space-y-2">
                <Label>Completion Notes (Optional)</Label>
                <Textarea
                  placeholder="Any final notes about the job..."
                  value={jobCompletionNotes}
                  onChange={(e) => setJobCompletionNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-job-completion-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteJobDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => completeJobMutation.mutate(jobCompletionNotes)}
                disabled={completeJobMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-complete-job"
              >
                {completeJobMutation.isPending ? "Completing..." : "Complete Job"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
