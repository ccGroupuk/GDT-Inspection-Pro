import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { FormSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Handshake,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
  Send,
  Plus,
  Eye,
  Receipt,
  MessageSquare,
  Image,
  X,
  Share2,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Job, Contact, TradePartner, Task, QuoteItem, Invoice, JobNote, JobNoteAttachment, JobScheduleProposal } from "@shared/schema";
import { PIPELINE_STAGES, DELIVERY_TYPES, PARTNER_STATUSES, INVOICE_STATUSES, NOTE_VISIBILITY } from "@shared/schema";

interface JobNoteWithAttachments extends JobNote {
  attachments: JobNoteAttachment[];
}

interface JobDetailData {
  job: Job;
  contact: Contact;
  partner?: TradePartner;
  tasks: Task[];
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<JobDetailData>({
    queryKey: ["/api/jobs", id],
    enabled: Boolean(id),
  });

  // Fetch quote items
  const { data: quoteItems } = useQuery<QuoteItem[]>({
    queryKey: ["/api/jobs", id, "quote-items"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/quote-items`);
      if (!response.ok) throw new Error("Failed to fetch quote items");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch invoices for this job
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/jobs", id, "invoices"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/invoices`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch job notes
  const { data: jobNotes } = useQuery<JobNoteWithAttachments[]>({
    queryKey: ["/api/jobs", id, "notes"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch active schedule proposal
  const { data: scheduleProposal, refetch: refetchProposal } = useQuery<JobScheduleProposal | null>({
    queryKey: ["/api/jobs", id, "schedule-proposals", "active"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/schedule-proposals/active`);
      if (!response.ok) throw new Error("Failed to fetch schedule proposal");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Schedule proposal dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [proposedStartDate, setProposedStartDate] = useState("");
  const [proposedEndDate, setProposedEndDate] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");

  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<JobNoteWithAttachments | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<string>("internal");
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      setPendingAttachments(prev => [...prev, {
        fileName: response.metadata.name,
        fileUrl: response.objectPath,
        mimeType: response.metadata.contentType,
        fileSize: response.metadata.size,
      }]);
      setIsUploadingPhoto(false);
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
      setIsUploadingPhoto(false);
    },
  });

  // Calculate quote totals from items - must be before any conditional returns
  const quoteTotals = useMemo(() => {
    const job = data?.job;
    if (!quoteItems || quoteItems.length === 0 || !job) return null;
    
    const subtotal = quoteItems.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
    
    let discountAmount = 0;
    if (job.discountType && job.discountValue) {
      if (job.discountType === "percentage") {
        discountAmount = subtotal * (parseFloat(job.discountValue) / 100);
      } else if (job.discountType === "fixed") {
        discountAmount = parseFloat(job.discountValue) || 0;
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    if (job.taxEnabled && job.taxRate) {
      taxAmount = afterDiscount * (parseFloat(job.taxRate) / 100);
    }
    
    const grandTotal = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, grandTotal };
  }, [quoteItems, data?.job]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Error updating status", variant: "destructive" });
    },
  });

  const updatePartnerStatusMutation = useMutation({
    mutationFn: async (partnerStatus: string) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { partnerStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Partner status updated" });
    },
    onError: () => {
      toast({ title: "Error updating partner status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Job deleted" });
      navigate("/jobs");
    },
    onError: () => {
      toast({ title: "Error deleting job", variant: "destructive" });
    },
  });

  // Schedule proposal mutations
  const createScheduleProposalMutation = useMutation({
    mutationFn: async (data: { proposedStartDate: string; proposedEndDate?: string; notes?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/schedule-proposals`, {
        proposedStartDate: new Date(data.proposedStartDate).toISOString(),
        proposedEndDate: data.proposedEndDate ? new Date(data.proposedEndDate).toISOString() : null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "schedule-proposals", "active"] });
      toast({ title: "Schedule proposal sent to client" });
      setScheduleDialogOpen(false);
      setProposedStartDate("");
      setProposedEndDate("");
      setProposalNotes("");
    },
    onError: () => {
      toast({ title: "Failed to create schedule proposal", variant: "destructive" });
    },
  });

  const confirmCounterProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return apiRequest("POST", `/api/schedule-proposals/${proposalId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "schedule-proposals", "active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "Start date confirmed and added to calendar" });
    },
    onError: () => {
      toast({ title: "Failed to confirm schedule", variant: "destructive" });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (type: "quote" | "invoice") => {
      return apiRequest("POST", `/api/jobs/${id}/invoices`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "invoices"] });
      toast({ title: "Document created successfully" });
    },
    onError: () => {
      toast({ title: "Error creating document", variant: "destructive" });
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest("POST", `/api/invoices/${invoiceId}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Sent to client portal" });
    },
    onError: () => {
      toast({ title: "Error sending document", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string }): Promise<JobNote> => {
      const response = await apiRequest("POST", `/api/jobs/${id}/notes`, data);
      return response.json();
    },
    onSuccess: async (note: JobNote) => {
      for (const attachment of pendingAttachments) {
        await apiRequest("POST", `/api/jobs/${id}/notes/${note.id}/attachments`, attachment);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "notes"] });
      toast({ title: "Note added" });
      resetNoteDialog();
    },
    onError: () => {
      toast({ title: "Error creating note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: { noteId: string; content: string; visibility: string }): Promise<JobNote> => {
      const response = await apiRequest("PATCH", `/api/jobs/${id}/notes/${data.noteId}`, { content: data.content, visibility: data.visibility });
      return response.json();
    },
    onSuccess: async (note: JobNote) => {
      for (const attachment of pendingAttachments) {
        await apiRequest("POST", `/api/jobs/${id}/notes/${note.id}/attachments`, attachment);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "notes"] });
      toast({ title: "Note updated" });
      resetNoteDialog();
    },
    onError: () => {
      toast({ title: "Error updating note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest("DELETE", `/api/jobs/${id}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "notes"] });
      toast({ title: "Note deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting note", variant: "destructive" });
    },
  });

  const toggleShareQuoteMutation = useMutation({
    mutationFn: async (shareQuoteWithPartner: boolean) => {
      return apiRequest("PATCH", `/api/jobs/${id}/share-quote`, { shareQuoteWithPartner });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Quote sharing updated" });
    },
    onError: () => {
      toast({ title: "Error updating share settings", variant: "destructive" });
    },
  });

  const toggleShareNotesMutation = useMutation({
    mutationFn: async (shareNotesWithPartner: boolean) => {
      return apiRequest("PATCH", `/api/jobs/${id}/share-notes`, { shareNotesWithPartner });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Notes sharing updated" });
    },
    onError: () => {
      toast({ title: "Error updating share settings", variant: "destructive" });
    },
  });

  const resetNoteDialog = () => {
    setNoteDialogOpen(false);
    setEditingNote(null);
    setNoteContent("");
    setNoteVisibility("internal");
    setPendingAttachments([]);
  };

  const openNoteDialog = (note?: JobNoteWithAttachments) => {
    if (note) {
      setEditingNote(note);
      setNoteContent(note.content);
      setNoteVisibility(note.visibility);
      setPendingAttachments([]);
    } else {
      setEditingNote(null);
      setNoteContent("");
      setNoteVisibility("internal");
      setPendingAttachments([]);
    }
    setNoteDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      await uploadFile(file);
    }
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({ title: "Note content is required", variant: "destructive" });
      return;
    }
    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, content: noteContent, visibility: noteVisibility });
    } else {
      createNoteMutation.mutate({ content: noteContent, visibility: noteVisibility });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Job Details</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found</p>
          <Link href="/jobs">
            <Button variant="ghost">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { job, contact, partner, tasks } = data;
  const deliveryType = DELIVERY_TYPES.find(t => t.value === job.deliveryType);
  const isPartnerJob = job.deliveryType === "partner" || job.deliveryType === "hybrid";

  const margin = job.quotedValue && job.partnerCharge 
    ? Number(job.quotedValue) - Number(job.partnerCharge)
    : job.cccMargin ? Number(job.cccMargin) : null;

  const marginPercentage = margin && job.quotedValue
    ? ((margin / Number(job.quotedValue)) * 100).toFixed(1)
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{job.jobNumber}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground">{job.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" className="gap-2" data-testid="button-edit-job">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => {
              if (confirm("Are you sure you want to delete this job?")) {
                deleteMutation.mutate();
              }
            }}
            data-testid="button-delete-job"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Job Address</p>
                    <p className="text-sm text-muted-foreground">{job.jobAddress}</p>
                    <p className="text-sm text-muted-foreground">{job.jobPostcode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
              </div>
              
              {job.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">Pipeline Status</p>
                <Select
                  value={job.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                >
                  <SelectTrigger className="w-full max-w-xs" data-testid="select-job-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                          {stage.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Quote Type</span>
                  <Badge variant="outline">{job.quoteType === "fixed" ? "Fixed Quote" : "Estimate"}</Badge>
                </div>

                {quoteItems && quoteItems.length > 0 ? (
                  <>
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
                            <tr key={item.id} data-testid={`quote-row-${item.id}`}>
                              <td className="p-3">{item.description}</td>
                              <td className="p-3 text-right font-mono text-muted-foreground">{item.quantity}</td>
                              <td className="p-3 text-right font-mono text-muted-foreground">£{parseFloat(item.unitPrice).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {quoteTotals && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-mono">£{quoteTotals.subtotal.toFixed(2)}</span>
                        </div>
                        {job.discountType && quoteTotals.discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Discount {job.discountType === "percentage" ? `(${job.discountValue}%)` : ""}
                            </span>
                            <span className="font-mono text-green-600 dark:text-green-400">
                              -£{quoteTotals.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {job.taxEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT ({job.taxRate}%)</span>
                            <span className="font-mono">£{quoteTotals.taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">Grand Total</span>
                          <span className="font-mono font-semibold text-lg">
                            £{quoteTotals.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Quoted Value</span>
                    <span className="font-mono text-lg font-semibold">
                      {job.quotedValue ? `£${Number(job.quotedValue).toLocaleString()}` : "-"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Deposit</span>
                    {job.depositRequired && (
                      job.depositReceived 
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {job.depositRequired 
                      ? `£${Number(job.depositAmount || 0).toLocaleString()} ${job.depositReceived ? "(Received)" : "(Pending)"}`
                      : "Not required"
                    }
                  </span>
                </div>

                {isPartnerJob && (
                  <>
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Partner Charge</span>
                      <span className="font-mono text-sm font-semibold">
                        {job.partnerCharge ? `£${Number(job.partnerCharge).toLocaleString()}` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-primary/10">
                      <span className="text-sm font-medium">CCC Margin</span>
                      <div className="text-right">
                        <span className="font-mono text-lg font-semibold text-primary">
                          {margin ? `£${margin.toLocaleString()}` : "-"}
                        </span>
                        {marginPercentage && (
                          <span className="text-xs text-muted-foreground ml-2">({marginPercentage}%)</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Quotes & Invoices
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createInvoiceMutation.mutate("quote")}
                    disabled={createInvoiceMutation.isPending || !quoteItems?.length}
                    data-testid="button-create-quote"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Quote
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createInvoiceMutation.mutate("invoice")}
                    disabled={createInvoiceMutation.isPending || !quoteItems?.length}
                    data-testid="button-create-invoice"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Invoice
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!quoteItems?.length ? (
                <p className="text-sm text-muted-foreground">Add quote items first to generate documents.</p>
              ) : invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const statusInfo = INVOICE_STATUSES.find(s => s.value === invoice.status);
                    return (
                      <div 
                        key={invoice.id} 
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
                        data-testid={`invoice-row-${invoice.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">{invoice.referenceNumber}</span>
                            <Badge variant="outline" className="text-xs">
                              {invoice.type === "invoice" ? "Invoice" : "Quote"}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${statusInfo?.color || ''} ${statusInfo?.color ? 'text-white' : ''}`}
                            >
                              {statusInfo?.label || invoice.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>£{parseFloat(invoice.grandTotal).toFixed(2)}</span>
                            {invoice.createdAt && (
                              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                              disabled={sendInvoiceMutation.isPending}
                              data-testid={`button-send-${invoice.id}`}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send to Portal
                            </Button>
                          )}
                          {invoice.status === "sent" && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              Visible in Portal
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No quotes or invoices yet. Create one to send to the client.</p>
              )}
            </CardContent>
          </Card>

          {/* Schedule Proposal Section - Show when job is in appropriate stage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date Scheduling
                </div>
                {!scheduleProposal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScheduleDialogOpen(true)}
                    data-testid="button-propose-start-date"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Propose Start Date
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleProposal ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-sm font-medium">Proposed Start Date</span>
                      <Badge variant={
                        scheduleProposal.status === "scheduled" ? "default" :
                        scheduleProposal.status === "client_countered" ? "secondary" :
                        scheduleProposal.status === "client_declined" ? "destructive" :
                        "outline"
                      }>
                        {scheduleProposal.status === "pending_client" && "Awaiting Client Response"}
                        {scheduleProposal.status === "client_accepted" && "Client Accepted"}
                        {scheduleProposal.status === "client_countered" && "Client Counter-Proposed"}
                        {scheduleProposal.status === "client_declined" && "Client Declined"}
                        {scheduleProposal.status === "scheduled" && "Scheduled"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Your Proposed Date</p>
                        <p className="font-medium">{new Date(scheduleProposal.proposedStartDate).toLocaleDateString()}</p>
                        {scheduleProposal.proposedEndDate && (
                          <p className="text-xs text-muted-foreground">
                            to {new Date(scheduleProposal.proposedEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {scheduleProposal.counterProposedDate && (
                        <div>
                          <p className="text-muted-foreground">Client's Counter Date</p>
                          <p className="font-medium">{new Date(scheduleProposal.counterProposedDate).toLocaleDateString()}</p>
                          {scheduleProposal.counterReason && (
                            <p className="text-xs text-muted-foreground mt-1">{scheduleProposal.counterReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {scheduleProposal.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">Notes: {scheduleProposal.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions based on status */}
                  <div className="flex gap-2 flex-wrap">
                    {scheduleProposal.status === "client_countered" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => confirmCounterProposalMutation.mutate(scheduleProposal.id)}
                          disabled={confirmCounterProposalMutation.isPending}
                          data-testid="button-confirm-counter"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept Client's Date
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScheduleDialogOpen(true)}
                          data-testid="button-new-proposal"
                        >
                          Propose Different Date
                        </Button>
                      </>
                    )}
                    {scheduleProposal.status === "client_declined" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setScheduleDialogOpen(true)}
                        data-testid="button-new-proposal-after-decline"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Propose New Date
                      </Button>
                    )}
                    {scheduleProposal.status === "scheduled" && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Job scheduled and added to calendar</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No start date proposed yet. After the quote is accepted, propose a start date to the client.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Job Notes
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openNoteDialog()}
                  data-testid="button-add-note"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Note
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobNotes && jobNotes.length > 0 ? (
                <div className="space-y-4">
                  {jobNotes.map((note) => {
                    const visibilityInfo = NOTE_VISIBILITY.find(v => v.value === note.visibility);
                    return (
                      <div 
                        key={note.id} 
                        className="p-3 rounded-lg bg-muted/50"
                        data-testid={`note-row-${note.id}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {visibilityInfo?.label || note.visibility}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openNoteDialog(note)}
                              data-testid={`button-edit-note-${note.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Delete this note?")) {
                                  deleteNoteMutation.mutate(note.id);
                                }
                              }}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
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
                                data-testid={`attachment-${att.id}`}
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
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet. Add notes to track progress, communications, or issues.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{contact.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
              </div>
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{contact.address}</span>
                </div>
              )}
              <Link href={`/contacts/${contact.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">View Contact</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-4">
                {deliveryType?.label || job.deliveryType}
              </Badge>
              
              {isPartnerJob && partner && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{partner.businessName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.tradeCategory}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${partner.phone}`} className="hover:underline">{partner.phone}</a>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Partner Status
                    </p>
                    <Select
                      value={job.partnerStatus || "offered"}
                      onValueChange={(value) => updatePartnerStatusMutation.mutate(value)}
                    >
                      <SelectTrigger className="w-full" data-testid="select-partner-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {isPartnerJob && !partner && (
                <p className="text-sm text-muted-foreground">No partner assigned</p>
              )}
            </CardContent>
          </Card>

          {isPartnerJob && partner && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Partner Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="share-quote" className="text-sm">
                    Share Quote/Estimate
                  </Label>
                  <Switch
                    id="share-quote"
                    checked={job.shareQuoteWithPartner ?? false}
                    onCheckedChange={(checked) => toggleShareQuoteMutation.mutate(checked)}
                    data-testid="switch-share-quote"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="share-notes" className="text-sm">
                    Share Job Notes
                  </Label>
                  <Switch
                    id="share-notes"
                    checked={job.shareNotesWithPartner ?? false}
                    onCheckedChange={(checked) => toggleShareNotesMutation.mutate(checked)}
                    data-testid="switch-share-notes"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only notes marked as "Partner" or "All" visibility will be visible when sharing is enabled.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Proposal Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose Start Date to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={proposedStartDate}
                  onChange={(e) => setProposedStartDate(e.target.value)}
                  data-testid="input-proposed-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={proposedEndDate}
                  onChange={(e) => setProposedEndDate(e.target.value)}
                  data-testid="input-proposed-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes for Client (Optional)</Label>
              <Textarea
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                placeholder="e.g., 'We can start early morning if that works better'"
                className="min-h-[80px]"
                data-testid="textarea-proposal-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!proposedStartDate) {
                  toast({ title: "Please select a start date", variant: "destructive" });
                  return;
                }
                createScheduleProposalMutation.mutate({
                  proposedStartDate,
                  proposedEndDate: proposedEndDate || undefined,
                  notes: proposalNotes || undefined,
                });
              }}
              disabled={createScheduleProposalMutation.isPending}
              data-testid="button-send-proposal"
            >
              <Send className="w-3 h-3 mr-1" />
              Send to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={(open) => !open && resetNoteDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={noteVisibility} onValueChange={setNoteVisibility}>
                <SelectTrigger data-testid="select-note-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_VISIBILITY.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note Content</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter note content..."
                className="min-h-[120px]"
                data-testid="textarea-note-content"
              />
            </div>
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  disabled={isUploadingPhoto}
                  data-testid="button-upload-photo"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              {(editingNote?.attachments?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingNote?.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-1 text-xs p-1 rounded bg-muted">
                      <Image className="w-3 h-3" />
                      {att.fileName}
                    </div>
                  ))}
                </div>
              )}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pendingAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs p-1 rounded bg-green-100 dark:bg-green-900">
                      <Image className="w-3 h-3" />
                      {att.fileName}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4"
                        onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetNoteDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              data-testid="button-save-note"
            >
              {editingNote ? "Update" : "Add"} Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
