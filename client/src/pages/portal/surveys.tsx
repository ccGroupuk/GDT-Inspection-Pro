import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Check, X, User, ClipboardList, ArrowRight } from "lucide-react";

interface SurveyWithDetails {
  id: string;
  jobId: string;
  status: string;
  bookingStatus: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  partnerNotes: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  job: {
    jobNumber: string;
    serviceType: string;
    jobAddress: string;
    jobPostcode: string;
  } | null;
  partner: {
    companyName: string;
  } | null;
}

function getBookingStatusColor(status: string | null) {
  switch (status) {
    case "pending_client":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "client_accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "client_declined":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "client_counter":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

function getBookingStatusLabel(status: string | null) {
  switch (status) {
    case "pending_client":
      return "Awaiting Your Response";
    case "client_accepted":
      return "You Accepted";
    case "client_declined":
      return "You Declined";
    case "client_counter":
      return "You Proposed Alternative";
    case "confirmed":
      return "Appointment Confirmed";
    default:
      return null;
  }
}

export default function PortalSurveys() {
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithDetails | null>(null);
  const [responseType, setResponseType] = useState<"accept" | "decline" | "counter">("accept");
  const [counterDate, setCounterDate] = useState("");
  const [counterTime, setCounterTime] = useState("");
  const [responseNotes, setResponseNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: surveys, isLoading, error } = useQuery<SurveyWithDetails[]>({
    queryKey: ["/api/portal/surveys"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/surveys", token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch surveys");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { 
      surveyId: string; 
      response: string; 
      counterDate?: string; 
      counterTime?: string; 
      notes?: string 
    }) => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest(
        "POST",
        `/api/portal/surveys/${data.surveyId}/respond`,
        token,
        {
          response: data.response,
          counterDate: data.counterDate,
          counterTime: data.counterTime,
          notes: data.notes,
        }
      );
      if (!response.ok) throw new Error("Failed to respond");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/surveys"] });
      const message = responseType === "accept" 
        ? "You accepted the proposed date" 
        : responseType === "decline"
        ? "You declined the proposed date"
        : "Your alternative date has been sent";
      toast({ title: message });
      setResponseDialogOpen(false);
      setSelectedSurvey(null);
      setCounterDate("");
      setCounterTime("");
      setResponseNotes("");
    },
    onError: () => {
      toast({ title: "Error responding to survey", variant: "destructive" });
    },
  });

  const openResponseDialog = (survey: SurveyWithDetails, type: "accept" | "decline" | "counter") => {
    setSelectedSurvey(survey);
    setResponseType(type);
    setCounterDate("");
    setCounterTime("");
    setResponseNotes("");
    setResponseDialogOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  const pendingSurveys = surveys?.filter(s => s.bookingStatus === "pending_client") || [];
  const respondedSurveys = surveys?.filter(s => s.bookingStatus && s.bookingStatus !== "pending_client") || [];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-surveys-title">Survey Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your upcoming site survey appointments
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Failed to load surveys. Please try again.</p>
            </CardContent>
          </Card>
        ) : !surveys || surveys.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">No survey appointments</h3>
              <p className="text-sm text-muted-foreground">
                Survey appointment requests will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {pendingSurveys.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Your Response ({pendingSurveys.length})
                </h3>
                <div className="space-y-4">
                  {pendingSurveys.map((survey) => (
                    <Card key={survey.id} className="border-yellow-200 dark:border-yellow-800" data-testid={`card-survey-${survey.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{survey.job?.jobNumber || "Survey"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {survey.job?.serviceType}
                            </p>
                          </div>
                          <Badge className={getBookingStatusColor(survey.bookingStatus)}>
                            {getBookingStatusLabel(survey.bookingStatus)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {survey.partner && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{survey.partner.companyName}</span>
                            </div>
                          )}
                          {survey.job?.jobAddress && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{survey.job.jobAddress}</span>
                            </div>
                          )}
                        </div>

                        {survey.proposedDate && (
                          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md mb-4">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Proposed Survey Date:
                            </p>
                            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                              {new Date(survey.proposedDate).toLocaleDateString("en-GB", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                              {survey.proposedTime && ` at ${survey.proposedTime}`}
                            </p>
                            {survey.partnerNotes && (
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                {survey.partnerNotes}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openResponseDialog(survey, "accept")}
                            data-testid={`button-accept-survey-${survey.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept Date
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResponseDialog(survey, "counter")}
                            data-testid={`button-counter-survey-${survey.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Suggest Alternative
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResponseDialog(survey, "decline")}
                            data-testid={`button-decline-survey-${survey.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {respondedSurveys.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-muted-foreground" />
                  Survey History ({respondedSurveys.length})
                </h3>
                <div className="space-y-4">
                  {respondedSurveys.map((survey) => (
                    <Card key={survey.id} className="opacity-80" data-testid={`card-survey-${survey.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{survey.job?.jobNumber || "Survey"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {survey.job?.serviceType}
                            </p>
                          </div>
                          <Badge className={getBookingStatusColor(survey.bookingStatus)}>
                            {getBookingStatusLabel(survey.bookingStatus)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {survey.partner && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{survey.partner.companyName}</span>
                            </div>
                          )}
                          {survey.scheduledDate && survey.bookingStatus === "confirmed" && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-700 dark:text-green-400">
                                Confirmed: {new Date(survey.scheduledDate).toLocaleDateString()}
                                {survey.scheduledTime && ` at ${survey.scheduledTime}`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <Link href={`/portal/jobs/${survey.jobId}`}>
                            <Button size="sm" variant="outline" data-testid={`button-view-job-${survey.id}`}>
                              View Job Details
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === "accept" && "Accept Survey Date"}
              {responseType === "decline" && "Decline Survey Date"}
              {responseType === "counter" && "Propose Alternative Date"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {responseType === "accept" && (
              <p className="text-sm text-muted-foreground">
                Confirm you will be available on{" "}
                <strong>
                  {selectedSurvey?.proposedDate && new Date(selectedSurvey.proposedDate).toLocaleDateString()}
                  {selectedSurvey?.proposedTime && ` at ${selectedSurvey.proposedTime}`}
                </strong>
              </p>
            )}

            {responseType === "decline" && (
              <p className="text-sm text-muted-foreground">
                Let us know why this date doesn't work for you.
              </p>
            )}

            {responseType === "counter" && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Suggest an alternative date that works better for you.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Your Preferred Date</Label>
                    <Input
                      type="date"
                      value={counterDate}
                      onChange={(e) => setCounterDate(e.target.value)}
                      data-testid="input-counter-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Time (Optional)</Label>
                    <Input
                      type="time"
                      value={counterTime}
                      onChange={(e) => setCounterTime(e.target.value)}
                      data-testid="input-counter-time"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{responseType === "counter" ? "Additional Notes (Optional)" : "Notes (Optional)"}</Label>
              <Textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder={
                  responseType === "accept" 
                    ? "Any notes or instructions for the surveyor..."
                    : responseType === "decline"
                    ? "Please let us know why this date doesn't work..."
                    : "Any additional notes about your preferred time..."
                }
                className="min-h-[80px]"
                data-testid="textarea-response-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={responseType === "decline" ? "destructive" : "default"}
              onClick={() => {
                if (responseType === "counter" && !counterDate) {
                  toast({ title: "Please select a date", variant: "destructive" });
                  return;
                }
                if (selectedSurvey) {
                  respondMutation.mutate({
                    surveyId: selectedSurvey.id,
                    response: responseType,
                    counterDate: counterDate || undefined,
                    counterTime: counterTime || undefined,
                    notes: responseNotes || undefined,
                  });
                }
              }}
              disabled={respondMutation.isPending}
              data-testid="button-confirm-response"
            >
              {respondMutation.isPending 
                ? "Sending..." 
                : responseType === "accept"
                ? "Confirm Date"
                : responseType === "decline"
                ? "Decline Date"
                : "Send Alternative"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
