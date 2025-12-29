import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Siren, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Phone,
} from "lucide-react";
import type { EmergencyCallout, EmergencyCalloutResponse, Job, Contact } from "@shared/schema";
import { EMERGENCY_INCIDENT_TYPES, EMERGENCY_PRIORITIES } from "@shared/schema";

interface EmergencyResponseWithDetails extends EmergencyCalloutResponse {
  callout: EmergencyCallout & {
    job?: Job;
    contact?: Contact | null;
  };
}

export default function PartnerEmergencyCallouts() {
  const { toast } = useToast();
  const token = localStorage.getItem("partner_portal_token");
  
  const [selectedResponse, setSelectedResponse] = useState<EmergencyResponseWithDetails | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [proposedMinutes, setProposedMinutes] = useState<string>("");
  const [responseNotes, setResponseNotes] = useState("");
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const { data: emergencyCallouts, isLoading } = useQuery<EmergencyResponseWithDetails[]>({
    queryKey: ["/api/partner-portal/emergency-callouts"],
    queryFn: async () => {
      const response = await fetch("/api/partner-portal/emergency-callouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch emergency callouts");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (responseId: string) => {
      return apiRequest("POST", `/api/partner-portal/emergency-callouts/${responseId}/acknowledge`, {}, {
        Authorization: `Bearer ${token}`,
      });
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
      return apiRequest("POST", `/api/partner-portal/emergency-callouts/${data.responseId}/respond`, {
        proposedArrivalMinutes: data.proposedArrivalMinutes,
        responseNotes: data.responseNotes,
      }, {
        Authorization: `Bearer ${token}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ title: "Response submitted" });
      setRespondDialogOpen(false);
      setSelectedResponse(null);
      setProposedMinutes("");
      setResponseNotes("");
    },
    onError: () => {
      toast({ title: "Error submitting response", variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (data: { responseId: string; declineReason?: string }) => {
      return apiRequest("POST", `/api/partner-portal/emergency-callouts/${data.responseId}/decline`, {
        declineReason: data.declineReason,
      }, {
        Authorization: `Bearer ${token}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ title: "Callout declined" });
      setDeclineDialogOpen(false);
      setSelectedResponse(null);
      setDeclineReason("");
    },
    onError: () => {
      toast({ title: "Error declining callout", variant: "destructive" });
    },
  });

  const pendingCallouts = emergencyCallouts?.filter(r => 
    r.status === "pending" || r.status === "acknowledged"
  ) || [];
  
  const respondedCallouts = emergencyCallouts?.filter(r => 
    r.status === "responded" || r.status === "selected" || r.status === "not_selected"
  ) || [];
  
  const declinedCallouts = emergencyCallouts?.filter(r => r.status === "declined") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">Loading emergency callouts...</div>
      </div>
    );
  }

  const renderCalloutCard = (response: EmergencyResponseWithDetails) => {
    const { callout } = response;
    const incidentType = EMERGENCY_INCIDENT_TYPES.find(t => t.value === callout.incidentType);
    const priority = EMERGENCY_PRIORITIES.find(p => p.value === callout.priority);
    
    return (
      <Card 
        key={response.id} 
        className={`${
          response.status === "pending" ? "border-red-500 border-2" : 
          response.status === "selected" ? "border-green-500 border-2" :
          ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Siren className="w-4 h-4 text-destructive" />
              {incidentType?.label || callout.incidentType}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={
                callout.priority === "critical" || callout.priority === "high" ? "destructive" : "secondary"
              }>
                {priority?.label || callout.priority}
              </Badge>
              <Badge variant={
                response.status === "selected" ? "default" :
                response.status === "responded" ? "secondary" :
                response.status === "declined" || response.status === "not_selected" ? "destructive" :
                "outline"
              }>
                {response.status === "not_selected" ? "Not Selected" : 
                 response.status.charAt(0).toUpperCase() + response.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {callout.description && (
            <p className="text-sm text-muted-foreground">{callout.description}</p>
          )}
          
          {callout.job && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{callout.job.address || "Address not provided"}</span>
              </div>
              {callout.contact && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{callout.contact.phone || callout.contact.email}</span>
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
          
          {response.proposedArrivalMinutes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Your ETA: </span>
              <span className="font-medium">{response.proposedArrivalMinutes} minutes</span>
            </div>
          )}
          
          {response.status === "selected" && (
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
              You have been selected for this emergency callout.
            </div>
          )}
          
          {response.status === "not_selected" && (
            <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
              Another partner was selected for this callout.
            </div>
          )}
          
          {(response.status === "pending" || response.status === "acknowledged") && callout.status === "open" && (
            <div className="flex items-center gap-2 pt-2">
              {response.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeMutation.mutate(response.id)}
                  disabled={acknowledgeMutation.isPending}
                  data-testid={`button-acknowledge-${response.id}`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Acknowledge
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setSelectedResponse(response);
                  setRespondDialogOpen(true);
                }}
                data-testid={`button-respond-${response.id}`}
              >
                Respond with ETA
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  setSelectedResponse(response);
                  setDeclineDialogOpen(true);
                }}
                data-testid={`button-decline-${response.id}`}
              >
                <X className="w-3 h-3 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Siren className="w-6 h-6 text-destructive" />
        <h1 className="text-2xl font-bold">Emergency Callouts</h1>
      </div>
      
      {pendingCallouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Urgent - Awaiting Your Response ({pendingCallouts.length})
          </h2>
          <div className="grid gap-4">
            {pendingCallouts.map(renderCalloutCard)}
          </div>
        </div>
      )}
      
      {respondedCallouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Responded ({respondedCallouts.length})</h2>
          <div className="grid gap-4">
            {respondedCallouts.map(renderCalloutCard)}
          </div>
        </div>
      )}
      
      {declinedCallouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Declined ({declinedCallouts.length})</h2>
          <div className="grid gap-4">
            {declinedCallouts.map(renderCalloutCard)}
          </div>
        </div>
      )}
      
      {(!emergencyCallouts || emergencyCallouts.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No emergency callouts at this time.
          </CardContent>
        </Card>
      )}

      <Dialog open={respondDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRespondDialogOpen(false);
          setSelectedResponse(null);
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
                if (selectedResponse) {
                  respondMutation.mutate({
                    responseId: selectedResponse.id,
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
          setSelectedResponse(null);
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
                if (selectedResponse) {
                  declineMutation.mutate({
                    responseId: selectedResponse.id,
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
