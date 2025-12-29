import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmptyState } from "@/components/empty-state";
import { 
  Siren, 
  Plus, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import type { EmergencyCallout, TradePartner } from "@shared/schema";
import { EMERGENCY_INCIDENT_TYPES, EMERGENCY_PRIORITIES } from "@shared/schema";

const emergencyFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().min(1, "Phone number is required"),
  clientAddress: z.string().min(1, "Address is required"),
  clientPostcode: z.string().optional(),
  incidentType: z.string().min(1, "Incident type is required"),
  priority: z.string().min(1, "Priority is required"),
  description: z.string().optional(),
  partnerIds: z.array(z.string()).min(1, "Select at least one partner to broadcast to"),
});

type EmergencyFormValues = z.infer<typeof emergencyFormSchema>;

type EmergencyCalloutWithDetails = EmergencyCallout & {
  responses?: Array<{
    id: string;
    partnerId: string;
    status: string;
    proposedArrivalMinutes?: number | null;
    responseNotes?: string | null;
    partner?: TradePartner | null;
  }>;
  job?: { id: string; jobNumber: string } | null;
};

export default function EmergencyCallouts() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCallout, setSelectedCallout] = useState<EmergencyCalloutWithDetails | null>(null);
  const { toast } = useToast();

  const form = useForm<EmergencyFormValues>({
    resolver: zodResolver(emergencyFormSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientAddress: "",
      clientPostcode: "",
      incidentType: "leak",
      priority: "high",
      description: "",
      partnerIds: [],
    },
  });

  const { data: callouts = [], isLoading } = useQuery<EmergencyCallout[]>({
    queryKey: ["/api/emergency-callouts"],
  });

  const { data: emergencyPartners = [] } = useQuery<TradePartner[]>({
    queryKey: ["/api/emergency-ready-partners"],
  });

  const { data: calloutDetail } = useQuery<EmergencyCalloutWithDetails>({
    queryKey: ["/api/emergency-callouts", selectedCallout?.id],
    queryFn: async () => {
      const response = await fetch(`/api/emergency-callouts/${selectedCallout?.id}`);
      if (!response.ok) throw new Error("Failed to fetch callout");
      return response.json();
    },
    enabled: Boolean(selectedCallout?.id && viewDialogOpen),
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmergencyFormValues) => {
      return apiRequest("POST", "/api/emergency-callouts", {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress,
        clientPostcode: data.clientPostcode || "",
        incidentType: data.incidentType,
        priority: data.priority,
        description: data.description || "",
        partnerIds: data.partnerIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-callouts"] });
      toast({ title: "Emergency Created", description: "Emergency callout has been broadcast to selected partners." });
      form.reset();
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ calloutId, responseId }: { calloutId: string; responseId: string }) => {
      return apiRequest("POST", `/api/emergency-callouts/${calloutId}/assign`, { responseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-callouts"] });
      toast({ title: "Partner Assigned", description: "Partner has been assigned and job created." });
      setViewDialogOpen(false);
      setSelectedCallout(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (calloutId: string) => {
      return apiRequest("POST", `/api/emergency-callouts/${calloutId}/resolve`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-callouts"] });
      toast({ title: "Callout Cancelled" });
      setViewDialogOpen(false);
      setSelectedCallout(null);
    },
  });

  const togglePartner = (partnerId: string) => {
    const currentPartners = form.getValues("partnerIds");
    const newPartners = currentPartners.includes(partnerId)
      ? currentPartners.filter(id => id !== partnerId)
      : [...currentPartners, partnerId];
    form.setValue("partnerIds", newPartners, { shouldValidate: true });
  };

  const selectAllPartners = () => {
    form.setValue("partnerIds", emergencyPartners.map(p => p.id), { shouldValidate: true });
  };

  const onSubmit = (data: EmergencyFormValues) => {
    createMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    form.reset();
    setCreateDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500";
      case "assigned": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "resolved": return "bg-muted-foreground";
      case "cancelled": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  const activeCallouts = callouts.filter(c => c.status === "open" || c.status === "assigned" || c.status === "in_progress");
  const pastCallouts = callouts.filter(c => c.status === "resolved" || c.status === "cancelled");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <Siren className="w-6 h-6 text-destructive" />
          <h1 className="text-2xl font-semibold">Emergency Callouts</h1>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" data-testid="button-create-emergency">
          <Plus className="w-4 h-4" />
          New Emergency
        </Button>
      </div>

      {callouts.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="No Emergency Callouts"
          description="When you create an emergency callout, it will appear here."
          action={{
            label: "Create Emergency Callout",
            onClick: () => setCreateDialogOpen(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {activeCallouts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Active Emergencies ({activeCallouts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeCallouts.map((callout) => (
                  <Card key={callout.id} className="cursor-pointer hover-elevate" onClick={() => { setSelectedCallout(callout); setViewDialogOpen(true); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Siren className="w-4 h-4 text-destructive" />
                          {EMERGENCY_INCIDENT_TYPES.find(t => t.value === callout.incidentType)?.label || callout.incidentType}
                        </CardTitle>
                        <Badge className={getStatusColor(callout.status)}>
                          {callout.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {callout.clientName && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-3 h-3" />
                            {callout.clientName}
                          </div>
                        )}
                        {callout.clientAddress && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {callout.clientAddress}
                          </div>
                        )}
                        {callout.clientPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {callout.clientPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {callout.createdAt ? new Date(callout.createdAt).toLocaleString() : "N/A"}
                        </div>
                        <Badge variant={callout.priority === "critical" ? "destructive" : "secondary"}>
                          {EMERGENCY_PRIORITIES.find(p => p.value === callout.priority)?.label || callout.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastCallouts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3 text-muted-foreground">
                Past Emergencies ({pastCallouts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastCallouts.slice(0, 6).map((callout) => (
                  <Card key={callout.id} className="opacity-75 cursor-pointer hover-elevate" onClick={() => { setSelectedCallout(callout); setViewDialogOpen(true); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">
                          {EMERGENCY_INCIDENT_TYPES.find(t => t.value === callout.incidentType)?.label || callout.incidentType}
                        </CardTitle>
                        <Badge variant="outline">
                          {callout.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {callout.clientName} - {callout.createdAt ? new Date(callout.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Emergency Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setCreateDialogOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-destructive" />
              Create Emergency Callout
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Customer name"
                          data-testid="input-emergency-client-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Phone *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Phone number"
                          data-testid="input-emergency-client-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Full address"
                          data-testid="input-emergency-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientPostcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="e.g. CF10 1AA"
                          data-testid="input-emergency-postcode"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-incident-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMERGENCY_INCIDENT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMERGENCY_PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Describe the emergency situation..."
                        data-testid="textarea-emergency-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partnerIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Broadcast to Partners *</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={selectAllPartners}>
                        Select All
                      </Button>
                    </div>
                    {emergencyPartners.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No partners are marked as available for emergency callouts.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {emergencyPartners.map(partner => (
                          <div 
                            key={partner.id} 
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                              field.value.includes(partner.id) ? "border-primary bg-primary/5" : "border-muted"
                            }`}
                            onClick={() => togglePartner(partner.id)}
                          >
                            <Checkbox 
                              checked={field.value.includes(partner.id)}
                              onCheckedChange={() => togglePartner(partner.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{partner.businessName}</div>
                              <div className="text-xs text-muted-foreground">{partner.tradeCategory}</div>
                              {partner.emergencyCalloutFee && (
                                <div className="text-xs text-muted-foreground">
                                  £{parseFloat(String(partner.emergencyCalloutFee)).toFixed(2)}/hr
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                  className="gap-2"
                  data-testid="button-broadcast-emergency"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Siren className="w-4 h-4" />
                  )}
                  Broadcast Emergency
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Emergency Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setSelectedCallout(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-destructive" />
              Emergency Response Board
            </DialogTitle>
          </DialogHeader>
          {calloutDetail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">
                    {EMERGENCY_INCIDENT_TYPES.find(t => t.value === calloutDetail.incidentType)?.label || calloutDetail.incidentType}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority: </span>
                  <Badge variant={calloutDetail.priority === "critical" || calloutDetail.priority === "high" ? "destructive" : "secondary"}>
                    {EMERGENCY_PRIORITIES.find(p => p.value === calloutDetail.priority)?.label || calloutDetail.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Client: </span>
                  <span>{calloutDetail.clientName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span>{calloutDetail.clientPhone || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address: </span>
                  <span>{calloutDetail.clientAddress || "N/A"} {calloutDetail.clientPostcode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge>{calloutDetail.status}</Badge>
                </div>
                {calloutDetail.job && (
                  <div>
                    <span className="text-muted-foreground">Job: </span>
                    <span>{calloutDetail.job.jobNumber}</span>
                  </div>
                )}
              </div>

              {calloutDetail.description && (
                <div className="text-sm bg-muted p-2 rounded">
                  {calloutDetail.description}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-base">Partner Responses</Label>
                {(!calloutDetail.responses || calloutDetail.responses.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No responses yet. Waiting for partners...</p>
                ) : (
                  <div className="space-y-2">
                    {calloutDetail.responses.map((response) => (
                      <div 
                        key={response.id} 
                        className={`p-3 rounded-md border ${
                          response.status === "selected" ? "border-green-500 bg-green-50 dark:bg-green-950" :
                          response.status === "responded" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" :
                          response.status === "declined" ? "border-red-300 bg-red-50 dark:bg-red-950" :
                          "border-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium">
                            {response.partner?.businessName || "Unknown Partner"}
                          </span>
                          <div className="flex items-center gap-2">
                            {response.partner?.emergencyCalloutFee != null && !isNaN(parseFloat(String(response.partner.emergencyCalloutFee))) && (
                              <Badge variant="outline" className="text-xs">
                                £{parseFloat(String(response.partner.emergencyCalloutFee)).toFixed(2)}/hr
                              </Badge>
                            )}
                            {response.proposedArrivalMinutes && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                ETA: {response.proposedArrivalMinutes} min
                              </Badge>
                            )}
                            <Badge variant={
                              response.status === "selected" ? "default" :
                              response.status === "responded" ? "secondary" :
                              response.status === "declined" ? "destructive" :
                              "outline"
                            }>
                              {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        {response.responseNotes && (
                          <p className="text-xs text-muted-foreground mt-1">{response.responseNotes}</p>
                        )}
                        
                        {response.status === "responded" && calloutDetail.status === "open" && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => assignMutation.mutate({
                              calloutId: calloutDetail.id,
                              responseId: response.id,
                            })}
                            disabled={assignMutation.isPending}
                            data-testid={`button-select-partner-${response.id}`}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Select This Partner
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {calloutDetail.status === "open" && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => cancelMutation.mutate(calloutDetail.id)}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-callout"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel Callout
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
