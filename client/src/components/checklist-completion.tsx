import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Plus,
  Camera,
  FileText,
  MessageSquare,
  History,
} from "lucide-react";
import type { ChecklistInstance, ChecklistTemplate, ChecklistItem, ChecklistResponse, ChecklistAuditEvent } from "@shared/schema";

type InstanceWithDetails = ChecklistInstance & {
  template?: ChecklistTemplate;
  items?: ChecklistItem[];
  responses?: ChecklistResponse[];
  auditEvents?: ChecklistAuditEvent[];
};

type ChecklistCompletionProps = {
  targetType: string;
  targetId: string;
  compact?: boolean;
};

export function ChecklistCompletion({ targetType, targetId, compact = false }: ChecklistCompletionProps) {
  const [selectedInstance, setSelectedInstance] = useState<InstanceWithDetails | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const { toast } = useToast();

  const { data: instances = [], isLoading } = useQuery<ChecklistInstance[]>({
    queryKey: ["/api/checklist-instances", { targetType, targetId }],
    queryFn: async () => {
      const res = await fetch(`/api/checklist-instances?targetType=${targetType}&targetId=${targetId}`);
      return res.json();
    },
  });

  const { data: templates = [] } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  const { data: instanceDetails, refetch: refetchDetails } = useQuery<InstanceWithDetails>({
    queryKey: ["/api/checklist-instances", selectedInstance?.id],
    queryFn: async () => {
      if (!selectedInstance?.id) return null;
      const res = await fetch(`/api/checklist-instances/${selectedInstance.id}`);
      return res.json();
    },
    enabled: !!selectedInstance?.id,
  });

  const createInstanceMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("POST", "/api/checklist-instances", {
        templateId,
        targetType,
        targetId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-instances", { targetType, targetId }] });
      toast({ title: "Checklist Created", description: "New checklist has been assigned." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checklist.", variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ instanceId, itemId, value, note }: { instanceId: string; itemId: string; value: boolean; note?: string }) => {
      return apiRequest("POST", `/api/checklist-instances/${instanceId}/respond`, {
        itemId,
        value,
        note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-instances", { targetType, targetId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-instances", selectedInstance?.id] });
      refetchDetails();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update checklist item.", variant: "destructive" });
    },
  });

  const pendingInstances = instances.filter(i => i.status !== "completed");
  const completedInstances = instances.filter(i => i.status === "completed");

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case "photo": return <Camera className="w-4 h-4" />;
      case "text": return <FileText className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const applicableTemplates = templates.filter(t => 
    t.isActive && t.targetType === targetType && 
    !instances.some(i => i.templateId === t.id && i.status !== "completed")
  );

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading checklists...</div>;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {pendingInstances.length > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium">{pendingInstances.length} pending checklist(s)</span>
          </div>
        ) : instances.length > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">All checklists completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="w-4 h-4" />
            <span>No checklists assigned</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Mandatory Checklists
            </CardTitle>
            <CardDescription>
              {pendingInstances.length > 0 
                ? `${pendingInstances.length} checklist(s) require completion`
                : "All checklists completed"
              }
            </CardDescription>
          </div>
          {applicableTemplates.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {applicableTemplates.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => createInstanceMutation.mutate(template.id)}
                  disabled={createInstanceMutation.isPending}
                  data-testid={`button-add-checklist-${template.code}`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {instances.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No checklists assigned to this {targetType}.</p>
            {applicableTemplates.length === 0 && (
              <p className="text-xs mt-1">Create checklist templates in the Checklists admin page.</p>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {instances.map((instance) => {
              const template = templates.find(t => t.id === instance.templateId);
              return (
                <AccordionItem key={instance.id} value={instance.id} data-testid={`checklist-instance-${instance.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusBadge(instance.status)}
                      <span className="font-medium">{template?.name || "Unknown Checklist"}</span>
                      {instance.dueDate && (
                        <span className="text-xs text-muted-foreground ml-auto mr-4">
                          Due: {new Date(instance.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ChecklistInstanceDetail
                      instance={instance}
                      onRespond={(itemId, value, note) => 
                        respondMutation.mutate({ instanceId: instance.id, itemId, value, note })
                      }
                      isResponding={respondMutation.isPending}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

type ChecklistInstanceDetailProps = {
  instance: ChecklistInstance;
  onRespond: (itemId: string, value: boolean, note?: string) => void;
  isResponding: boolean;
};

function ChecklistInstanceDetail({ instance, onRespond, isResponding }: ChecklistInstanceDetailProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: details } = useQuery<InstanceWithDetails>({
    queryKey: ["/api/checklist-instances", instance.id],
    queryFn: async () => {
      const res = await fetch(`/api/checklist-instances/${instance.id}`);
      return res.json();
    },
  });

  if (!details) {
    return <div className="text-muted-foreground text-sm">Loading details...</div>;
  }

  const { items = [], responses = [] } = details;
  const responseMap = new Map(responses.map(r => [r.itemId, r]));

  return (
    <div className="space-y-3 pt-2">
      {items.map((item) => {
        const response = responseMap.get(item.id);
        const isCompleted = response?.value === true;

        return (
          <div 
            key={item.id} 
            className={`flex items-start gap-3 p-3 rounded-md border ${isCompleted ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-background"}`}
            data-testid={`checklist-item-${item.id}`}
          >
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => {
                onRespond(item.id, !!checked, notes[item.id]);
              }}
              disabled={isResponding || instance.status === "completed"}
              data-testid={`checkbox-item-${item.id}`}
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {item.label}
                </span>
                {item.isRequired && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
              {item.helpText && (
                <p className="text-xs text-muted-foreground">{item.helpText}</p>
              )}
              {item.itemType === "text" && !isCompleted && (
                <Textarea
                  placeholder="Enter notes..."
                  value={notes[item.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                  className="mt-2 text-sm"
                  disabled={isResponding}
                  data-testid={`textarea-note-${item.id}`}
                />
              )}
              {response?.note && (
                <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3 mt-0.5" />
                  <span>{response.note}</span>
                </div>
              )}
              {response?.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Completed: {new Date(response.completedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {instance.status === "completed" && instance.completedAt && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-800 dark:text-green-200">
          <CheckCircle2 className="w-4 h-4" />
          Checklist completed on {new Date(instance.completedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export function PendingChecklistsWarning({ jobId }: { jobId: string }) {
  const { data: pendingChecklists = [] } = useQuery<ChecklistInstance[]>({
    queryKey: ["/api/jobs", jobId, "pending-checklists"],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/pending-checklists`);
      return res.json();
    },
  });

  if (pendingChecklists.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
      <AlertTriangle className="w-4 h-4" />
      <span>
        <strong>{pendingChecklists.length}</strong> mandatory checklist(s) must be completed before marking this job as complete.
      </span>
    </div>
  );
}
