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
import { ChecklistCompletion, PendingChecklistsWarning } from "@/components/checklist-completion";
import { SendMessageDialog } from "@/components/send-message-dialog";
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
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Siren,
  Link2,
  Copy,
  ExternalLink,
  Boxes,
  PoundSterling,
  Loader2,
  Check,
  Banknote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Job, Contact, TradePartner, Task, QuoteItem, Invoice, JobNote, JobNoteAttachment, JobScheduleProposal, JobSurvey, EmergencyCallout, EmergencyCalloutResponse, ConnectionLink, ChangeOrder, ChangeOrderItem, CatalogItem } from "@shared/schema";
import { PIPELINE_STAGES, DELIVERY_TYPES, PARTNER_STATUSES, INVOICE_STATUSES, NOTE_VISIBILITY, SURVEY_STATUSES, EMERGENCY_INCIDENT_TYPES, EMERGENCY_PRIORITIES } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

interface JobSurveyWithPartner extends JobSurvey {
  partner?: TradePartner | null;
}

interface EmergencyCalloutWithDetails extends EmergencyCallout {
  responses?: (EmergencyCalloutResponse & { partner?: TradePartner })[];
  job?: Job;
}

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

  // Fetch payment requests for this job
  interface PaymentRequest {
    id: string;
    jobId: string;
    type: string;
    amount: string;
    description?: string | null;
    dueDate?: Date | null;
    status: string;
    showInPortal?: boolean;
    audience?: string | null;
    requestedByRole?: string | null;
    approvalStatus?: string | null;
    confirmedById?: string | null;
    confirmedAt?: Date | null;
  }
  const { data: paymentRequests } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/jobs", id, "payment-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/payment-requests`);
      if (!response.ok) throw new Error("Failed to fetch payment requests");
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

  // Fetch change orders
  const { data: changeOrders } = useQuery<ChangeOrder[]>({
    queryKey: ["/api/jobs", id, "change-orders"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/change-orders`);
      if (!response.ok) throw new Error("Failed to fetch change orders");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch catalog items for adding to change orders
  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog-items"],
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

  // Fetch job surveys
  const { data: jobSurveys } = useQuery<JobSurveyWithPartner[]>({
    queryKey: ["/api/jobs", id, "surveys"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/surveys`);
      if (!response.ok) throw new Error("Failed to fetch surveys");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch all trade partners (for survey assignment)
  const { data: allPartners } = useQuery<TradePartner[]>({
    queryKey: ["/api/partners"],
    enabled: Boolean(id),
  });

  // Fetch partner quotes for this job (admin review)
  interface PartnerQuoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }
  interface PartnerQuote {
    id: string;
    jobId: string;
    partnerId: string;
    surveyId?: string | null;
    status: string;
    subtotal: string;
    taxEnabled: boolean;
    taxRate: string;
    taxAmount: string;
    total: string;
    notes?: string | null;
    validUntil?: Date | null;
    adminNotes?: string | null;
    respondedAt?: Date | null;
    submittedAt?: Date | null;
    partner?: TradePartner;
    items: PartnerQuoteItem[];
  }
  const { data: partnerQuotes } = useQuery<PartnerQuote[]>({
    queryKey: ["/api/jobs", id, "partner-quotes"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/partner-quotes`);
      if (!response.ok) throw new Error("Failed to fetch partner quotes");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch emergency callouts for this job
  const { data: emergencyCallouts } = useQuery<EmergencyCalloutWithDetails[]>({
    queryKey: ["/api/jobs", id, "emergency-callouts"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/emergency-callouts`);
      if (!response.ok) throw new Error("Failed to fetch emergency callouts");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch emergency-ready partners
  const { data: emergencyPartners } = useQuery<TradePartner[]>({
    queryKey: ["/api/emergency-ready-partners"],
    queryFn: async () => {
      const response = await fetch("/api/emergency-ready-partners");
      if (!response.ok) throw new Error("Failed to fetch emergency partners");
      return response.json();
    },
  });

  // Fetch fund summary (client payments and allocations)
  interface ClientPayment {
    id: string;
    jobId: string;
    type: string;
    amount: string;
    paymentMethod?: string | null;
    reference?: string | null;
    notes?: string | null;
    receivedAt: string;
    recordedBy?: string | null;
    createdAt: string;
  }
  interface FundAllocation {
    id: string;
    jobId: string;
    partnerId?: string | null;
    jobPartnerId?: string | null;
    clientPaymentId?: string | null;
    amount: string;
    purpose?: string | null;
    notes?: string | null;
    status: string;
    allocatedBy?: string | null;
    paidAt?: string | null;
    confirmedAt?: string | null;
    createdAt: string;
  }
  interface JobPartnerWithDetails {
    id: string;
    jobId: string;
    partnerId: string;
    role?: string | null;
    status: string;
    subcontractFeeType?: string | null;
    subcontractFee?: string | null;
    subcontractDepositRequired?: boolean | null;
    subcontractDepositAmount?: string | null;
    partner?: TradePartner;
  }
  interface FundSummary {
    totalReceived: number;
    totalAllocated: number;
    unallocated: number;
    clientPayments: ClientPayment[];
    allocations: FundAllocation[];
    allocationsByPartner: Record<string, { partnerId: string; total: number; allocations: FundAllocation[] }>;
    jobPartners: JobPartnerWithDetails[];
  }
  const { data: fundSummary } = useQuery<FundSummary>({
    queryKey: ["/api/jobs", id, "fund-summary"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/fund-summary`);
      if (!response.ok) throw new Error("Failed to fetch fund summary");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch stage readiness for pipeline progression
  interface StagePrerequisiteResult {
    field: string;
    passed: boolean;
    message: string;
  }
  interface StageReadiness {
    stage: string;
    label: string;
    isCurrentStage: boolean;
    canProgress: boolean;
    prerequisites: StagePrerequisiteResult[];
    canSkip?: boolean;
  }
  interface JobStageReadiness {
    jobId: string;
    currentStage: string;
    stages: StageReadiness[];
  }
  const { data: stageReadiness } = useQuery<JobStageReadiness>({
    queryKey: ["/api/jobs", id, "stage-readiness"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/stage-readiness`);
      if (!response.ok) throw new Error("Failed to fetch stage readiness");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Schedule proposal dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [proposedStartDate, setProposedStartDate] = useState("");
  const [proposedEndDate, setProposedEndDate] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");

  // Deposit request dialog state
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositType, setDepositType] = useState<"fixed" | "percentage">("fixed");
  const [depositDescription, setDepositDescription] = useState("Booking deposit to secure your scheduled work dates");
  const [depositDueDate, setDepositDueDate] = useState("");

  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<JobNoteWithAttachments | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<string>("internal");
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ fileName: string; fileUrl: string; mimeType?: string; fileSize?: number }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Survey dialog state
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [surveyDate, setSurveyDate] = useState("");
  const [surveyTime, setSurveyTime] = useState("");

  // Emergency callout dialog state
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyIncidentType, setEmergencyIncidentType] = useState<string>("leak");
  const [emergencyPriority, setEmergencyPriority] = useState<string>("high");
  const [emergencyDescription, setEmergencyDescription] = useState("");
  const [selectedEmergencyPartners, setSelectedEmergencyPartners] = useState<string[]>([]);
  const [emergencyCalloutDetailId, setEmergencyCalloutDetailId] = useState<string | null>(null);

  // Connection links state
  const [connectionLinkDialogOpen, setConnectionLinkDialogOpen] = useState(false);
  const [connectionLinkType, setConnectionLinkType] = useState<string>("client");

  // CAD drawing link state
  const [cadLinkEditing, setCadLinkEditing] = useState(false);
  const [cadLinkValue, setCadLinkValue] = useState("");

  // Change order state
  const [changeOrderDialogOpen, setChangeOrderDialogOpen] = useState(false);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);
  const [changeOrderItems, setChangeOrderItems] = useState<ChangeOrderItem[]>([]);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnitPrice, setNewItemUnitPrice] = useState("");
  const [showCatalogInChangeOrder, setShowCatalogInChangeOrder] = useState(false);
  const [catalogSearchInChangeOrder, setCatalogSearchInChangeOrder] = useState("");

  // Client payment dialog state
  const [clientPaymentDialogOpen, setClientPaymentDialogOpen] = useState(false);
  const [clientPaymentType, setClientPaymentType] = useState<string>("deposit");
  const [clientPaymentAmount, setClientPaymentAmount] = useState("");
  const [clientPaymentMethod, setClientPaymentMethod] = useState<string>("");
  const [clientPaymentReference, setClientPaymentReference] = useState("");
  const [clientPaymentNotes, setClientPaymentNotes] = useState("");

  // Fund allocation dialog state
  const [fundAllocationDialogOpen, setFundAllocationDialogOpen] = useState(false);
  const [allocationPartnerId, setAllocationPartnerId] = useState<string>("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [allocationPurpose, setAllocationPurpose] = useState<string>("materials");
  const [allocationNotes, setAllocationNotes] = useState("");

  // Fetch connection links for this job
  const { data: connectionLinks } = useQuery<ConnectionLink[]>({
    queryKey: ["/api/jobs", id, "connection-links"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/connection-links`);
      if (!response.ok) throw new Error("Failed to fetch connection links");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Fetch single emergency callout with responses (must be after state declaration)
  const { data: emergencyCalloutDetail } = useQuery<EmergencyCalloutWithDetails>({
    queryKey: ["/api/emergency-callouts", emergencyCalloutDetailId],
    queryFn: async () => {
      const response = await fetch(`/api/emergency-callouts/${emergencyCalloutDetailId}`);
      if (!response.ok) throw new Error("Failed to fetch emergency callout");
      return response.json();
    },
    enabled: Boolean(emergencyCalloutDetailId),
  });

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

  // Filter catalog items for change order picker
  const filteredCatalogForChangeOrder = useMemo(() => {
    if (!catalogSearchInChangeOrder.trim()) return catalogItems.slice(0, 10);
    const search = catalogSearchInChangeOrder.toLowerCase();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search)) ||
      (item.sku && item.sku.toLowerCase().includes(search))
    ).slice(0, 20);
  }, [catalogItems, catalogSearchInChangeOrder]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, ...errorData };
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Status updated" });
    },
    onError: (error: { status?: number; message?: string; unmetPrerequisites?: Array<{ message: string }> }) => {
      if (error.status === 409 && error.unmetPrerequisites?.length) {
        const prereqMessages = error.unmetPrerequisites.map(p => p.message).join("\n");
        toast({ 
          title: "Cannot change status",
          description: prereqMessages,
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({ title: error.message || "Error updating status", variant: "destructive" });
      }
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

  const acknowledgePartnerAcceptanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${id}/acknowledge-partner-acceptance`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Partner acceptance acknowledged" });
    },
    onError: () => {
      toast({ title: "Error acknowledging acceptance", variant: "destructive" });
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
    mutationFn: async (data: { proposedStartDate: string; proposedEndDate?: string; adminNotes?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/schedule-proposals`, {
        proposedStartDate: new Date(data.proposedStartDate).toISOString(),
        proposedEndDate: data.proposedEndDate ? new Date(data.proposedEndDate).toISOString() : null,
        adminNotes: data.adminNotes || null,
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

  // Admin respond to client-initiated schedule proposal
  const adminRespondToClientProposalMutation = useMutation({
    mutationFn: async (data: { proposalId: string; response: "accepted" | "countered" | "declined"; counterDate?: string; notes?: string }) => {
      return apiRequest("POST", `/api/schedule-proposals/${data.proposalId}/admin-respond`, {
        response: data.response,
        counterDate: data.counterDate,
        notes: data.notes,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "schedule-proposals", "active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      if (variables.response === "accepted") {
        toast({ title: "Client's requested date accepted and added to calendar" });
      } else if (variables.response === "declined") {
        toast({ title: "Request declined" });
      } else {
        toast({ title: "Alternative date proposed to client" });
      }
    },
    onError: () => {
      toast({ title: "Failed to respond to schedule request", variant: "destructive" });
    },
  });

  // Create deposit request mutation
  const createDepositRequestMutation = useMutation({
    mutationFn: async (data: { amount: string; description: string; dueDate?: string; depositType: "fixed" | "percentage"; originalAmount: string }) => {
      // Create the payment request
      await apiRequest("POST", `/api/jobs/${id}/payment-requests`, {
        jobId: id,
        type: "deposit",
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        status: "sent",
        showInPortal: true,
      });
      // Also update job to mark deposit as required (use calculated amount for consistency)
      await apiRequest("PATCH", `/api/jobs/${id}`, {
        depositRequired: true,
        depositAmount: data.amount, // Always store the calculated currency amount
        depositType: data.depositType,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Deposit request sent to client portal" });
      setDepositDialogOpen(false);
      setDepositAmount("");
      setDepositDueDate("");
    },
    onError: () => {
      toast({ title: "Failed to create deposit request", variant: "destructive" });
    },
  });

  // Mark deposit as paid mutation
  const markDepositPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/jobs/${id}`, {
        depositReceived: true,
      });
      // Also update any pending deposit payment request to paid
      const depositRequest = paymentRequests?.find(
        pr => pr.type === "deposit" && pr.status !== "paid" && pr.status !== "cancelled"
      );
      if (depositRequest) {
        await apiRequest("PATCH", `/api/payment-requests/${depositRequest.id}`, {
          status: "paid",
          paidAt: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "invoices"] });
      toast({ title: "Deposit marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to update deposit status", variant: "destructive" });
    },
  });

  // Check if there's already an active deposit request
  const hasActiveDepositRequest = paymentRequests?.some(
    pr => pr.type === "deposit" && pr.status !== "paid" && pr.status !== "cancelled"
  );

  // Approve/reject partner payment request mutation
  const updatePaymentRequestApprovalMutation = useMutation({
    mutationFn: async ({ requestId, approvalStatus }: { requestId: string; approvalStatus: "marked_paid" | "confirmed" | "rejected" }) => {
      await apiRequest("PATCH", `/api/payment-requests/${requestId}`, {
        approvalStatus,
        ...(approvalStatus === "confirmed" ? { confirmedAt: new Date().toISOString() } : {}),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "payment-requests"] });
      if (variables.approvalStatus === "marked_paid") {
        toast({ title: "Payment marked as processing" });
      } else if (variables.approvalStatus === "confirmed") {
        toast({ title: "Payment confirmed" });
      } else {
        toast({ title: "Payment request rejected" });
      }
    },
    onError: () => {
      toast({ title: "Failed to update payment request", variant: "destructive" });
    },
  });

  // Get partner payment requests (include all partner-related types)
  const partnerPaymentRequests = paymentRequests?.filter(
    pr => (pr.type === "partner_payout" || pr.type === "partner_deposit" || pr.type === "partner_balance" || pr.type === "partner_commission") && pr.requestedByRole === "partner"
  ) || [];

  // Create client payment mutation
  const createClientPaymentMutation = useMutation({
    mutationFn: async (data: { type: string; amount: string; paymentMethod?: string; reference?: string; notes?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/client-payments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "fund-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      setClientPaymentDialogOpen(false);
      setClientPaymentType("deposit");
      setClientPaymentAmount("");
      setClientPaymentMethod("");
      setClientPaymentReference("");
      setClientPaymentNotes("");
      toast({ title: "Payment recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  // Create fund allocation mutation
  const createFundAllocationMutation = useMutation({
    mutationFn: async (data: { partnerId?: string; amount: string; purpose?: string; notes?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/fund-allocations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "fund-summary"] });
      setFundAllocationDialogOpen(false);
      setAllocationPartnerId("");
      setAllocationAmount("");
      setAllocationPurpose("materials");
      setAllocationNotes("");
      toast({ title: "Funds allocated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to allocate funds", 
        variant: "destructive" 
      });
    },
  });

  // Update fund allocation status mutation
  const updateFundAllocationMutation = useMutation({
    mutationFn: async ({ allocationId, status }: { allocationId: string; status: string }) => {
      return apiRequest("PATCH", `/api/fund-allocations/${allocationId}`, {
        status,
        ...(status === "paid" ? { paidAt: new Date().toISOString() } : {}),
        ...(status === "confirmed" ? { confirmedAt: new Date().toISOString() } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "fund-summary"] });
      toast({ title: "Allocation status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update allocation", variant: "destructive" });
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

  // Change order mutations
  const createChangeOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${id}/change-orders`, {});
    },
    onSuccess: async (response) => {
      const changeOrder = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "change-orders"] });
      setSelectedChangeOrder(changeOrder);
      setChangeOrderItems([]);
      setChangeOrderDialogOpen(true);
      toast({ title: "Change order created" });
    },
    onError: () => {
      toast({ title: "Error creating change order", variant: "destructive" });
    },
  });

  const deleteChangeOrderMutation = useMutation({
    mutationFn: async (changeOrderId: string) => {
      return apiRequest("DELETE", `/api/change-orders/${changeOrderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "change-orders"] });
      toast({ title: "Change order deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting change order", variant: "destructive" });
    },
  });

  const sendChangeOrderMutation = useMutation({
    mutationFn: async (changeOrderId: string) => {
      return apiRequest("POST", `/api/change-orders/${changeOrderId}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "change-orders"] });
      toast({ title: "Change order sent to client portal" });
    },
    onError: () => {
      toast({ title: "Error sending change order", variant: "destructive" });
    },
  });

  const addChangeOrderItemMutation = useMutation({
    mutationFn: async (item: { description: string; quantity: string; unitPrice: string; lineTotal: string }) => {
      return apiRequest("POST", `/api/change-orders/${selectedChangeOrder?.id}/items`, item);
    },
    onSuccess: async () => {
      // Refetch change order with items
      if (selectedChangeOrder) {
        const response = await fetch(`/api/change-orders/${selectedChangeOrder.id}`);
        const updatedCO = await response.json();
        setSelectedChangeOrder(updatedCO);
        setChangeOrderItems(updatedCO.items || []);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "change-orders"] });
      setNewItemDescription("");
      setNewItemQuantity("1");
      setNewItemUnitPrice("");
      setCatalogSearchInChangeOrder("");
      toast({ title: "Item added" });
    },
    onError: () => {
      toast({ title: "Error adding item", variant: "destructive" });
    },
  });

  const deleteChangeOrderItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/change-order-items/${itemId}`);
    },
    onSuccess: async () => {
      if (selectedChangeOrder) {
        const response = await fetch(`/api/change-orders/${selectedChangeOrder.id}`);
        const updatedCO = await response.json();
        setSelectedChangeOrder(updatedCO);
        setChangeOrderItems(updatedCO.items || []);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "change-orders"] });
      toast({ title: "Item removed" });
    },
    onError: () => {
      toast({ title: "Error removing item", variant: "destructive" });
    },
  });

  const openChangeOrderForEdit = async (changeOrder: ChangeOrder) => {
    const response = await fetch(`/api/change-orders/${changeOrder.id}`);
    const fullCO = await response.json();
    setSelectedChangeOrder(fullCO);
    setChangeOrderItems(fullCO.items || []);
    setChangeOrderDialogOpen(true);
  };

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

  // CAD drawing link mutation
  const updateCadLinkMutation = useMutation({
    mutationFn: async (cadDrawingLink: string) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { cadDrawingLink });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "CAD drawing link saved" });
      setCadLinkEditing(false);
    },
    onError: () => {
      toast({ title: "Error saving CAD link", variant: "destructive" });
    },
  });

  // Connection link mutations
  const createConnectionLinkMutation = useMutation({
    mutationFn: async (data: { partyType: string }) => {
      return apiRequest("POST", `/api/connection-links`, { ...data, jobId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "connection-links"] });
      toast({ title: "Connection link created" });
      setConnectionLinkDialogOpen(false);
      setConnectionLinkType("client");
    },
    onError: () => {
      toast({ title: "Error creating connection link", variant: "destructive" });
    },
  });

  const revokeConnectionLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      return apiRequest("DELETE", `/api/connection-links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "connection-links"] });
      toast({ title: "Connection link revoked" });
    },
    onError: () => {
      toast({ title: "Error revoking connection link", variant: "destructive" });
    },
  });

  // Survey mutations
  const createSurveyMutation = useMutation({
    mutationFn: async (data: { partnerId: string; adminNotes?: string; scheduledDate?: string; scheduledTime?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/surveys`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "surveys"] });
      toast({ title: "Survey request sent" });
      resetSurveyDialog();
    },
    onError: () => {
      toast({ title: "Error creating survey request", variant: "destructive" });
    },
  });

  const cancelSurveyMutation = useMutation({
    mutationFn: async (surveyId: string) => {
      return apiRequest("POST", `/api/surveys/${surveyId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "surveys"] });
      toast({ title: "Survey cancelled" });
    },
    onError: () => {
      toast({ title: "Error cancelling survey", variant: "destructive" });
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: string) => {
      return apiRequest("DELETE", `/api/surveys/${surveyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "surveys"] });
      toast({ title: "Survey deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting survey", variant: "destructive" });
    },
  });

  // Partner quote mutations
  const acceptPartnerQuoteMutation = useMutation({
    mutationFn: async ({ quoteId }: { quoteId: string }) => {
      return apiRequest("POST", `/api/partner-quotes/${quoteId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "partner-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Partner quote accepted and sent to client" });
    },
    onError: () => {
      toast({ title: "Error accepting partner quote", variant: "destructive" });
    },
  });

  const declinePartnerQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return apiRequest("POST", `/api/partner-quotes/${quoteId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "partner-quotes"] });
      toast({ title: "Partner quote declined" });
    },
    onError: () => {
      toast({ title: "Error declining partner quote", variant: "destructive" });
    },
  });

  // Emergency callout mutations
  const createEmergencyCalloutMutation = useMutation({
    mutationFn: async (data: { 
      jobId: string; 
      incidentType: string; 
      priority: string; 
      description?: string; 
      partnerIds: string[] 
    }) => {
      return apiRequest("POST", "/api/emergency-callouts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "emergency-callouts"] });
      toast({ title: "Emergency callout broadcast sent" });
      resetEmergencyDialog();
    },
    onError: () => {
      toast({ title: "Error creating emergency callout", variant: "destructive" });
    },
  });

  const assignEmergencyPartnerMutation = useMutation({
    mutationFn: async ({ calloutId, responseId }: { calloutId: string; responseId: string }) => {
      return apiRequest("POST", `/api/emergency-callouts/${calloutId}/assign`, { responseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "emergency-callouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-callouts", emergencyCalloutDetailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Partner assigned to emergency callout" });
      setEmergencyCalloutDetailId(null);
    },
    onError: () => {
      toast({ title: "Error assigning partner", variant: "destructive" });
    },
  });

  const resolveEmergencyCalloutMutation = useMutation({
    mutationFn: async ({ calloutId, status, resolutionNotes }: { calloutId: string; status: string; resolutionNotes?: string }) => {
      return apiRequest("POST", `/api/emergency-callouts/${calloutId}/resolve`, { status, resolutionNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "emergency-callouts"] });
      toast({ title: "Emergency callout resolved" });
    },
    onError: () => {
      toast({ title: "Error resolving callout", variant: "destructive" });
    },
  });

  const resetEmergencyDialog = () => {
    setEmergencyDialogOpen(false);
    setEmergencyIncidentType("leak");
    setEmergencyPriority("high");
    setEmergencyDescription("");
    setSelectedEmergencyPartners([]);
  };

  const resetSurveyDialog = () => {
    setSurveyDialogOpen(false);
    setSelectedPartnerId("");
    setSurveyNotes("");
    setSurveyDate("");
    setSurveyTime("");
  };

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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold">{job.jobNumber}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground truncate">{job.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" className="gap-2" data-testid="button-edit-job">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
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

              {(job.clientTimeframe || job.clientBudget) && (
                <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.clientTimeframe && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Client Timeframe</p>
                        <p className="text-sm text-muted-foreground">
                          {job.clientTimeframe === "asap" && "ASAP - Urgent"}
                          {job.clientTimeframe === "getting_quotes" && "Just Getting Quotes"}
                          {job.clientTimeframe === "flexible" && "Flexible - Within a few weeks"}
                          {job.clientTimeframe === "no_rush" && "No Rush - Whenever available"}
                        </p>
                      </div>
                    </div>
                  )}
                  {job.clientBudget && (
                    <div className="flex items-start gap-3">
                      <PoundSterling className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Client Budget</p>
                        <p className="text-sm text-muted-foreground">{job.clientBudget}</p>
                      </div>
                    </div>
                  )}
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
                {/* Pending checklists warning */}
                <div className="mt-3">
                  <PendingChecklistsWarning jobId={id!} />
                </div>
                
                {/* Stage Requirements - show what's needed for next stages */}
                {stageReadiness && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      Stage Requirements
                    </p>
                    <div className="space-y-2">
                      {stageReadiness.stages
                        .filter(s => !s.isCurrentStage && s.prerequisites.length > 0)
                        .slice(0, 4)
                        .map(stage => {
                          const allMet = stage.prerequisites.every(p => p.passed);
                          const unmetCount = stage.prerequisites.filter(p => !p.passed).length;
                          return (
                            <div key={stage.stage} className="text-sm">
                              <div className="flex items-center gap-2">
                                {allMet || stage.canSkip ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span className={allMet || stage.canSkip ? "text-muted-foreground" : ""}>
                                  {stage.label}
                                </span>
                                {!allMet && !stage.canSkip && (
                                  <span className="text-xs text-muted-foreground">
                                    ({unmetCount} requirement{unmetCount > 1 ? "s" : ""})
                                  </span>
                                )}
                                {stage.canSkip && !allMet && (
                                  <Badge variant="outline" className="text-xs">Optional</Badge>
                                )}
                              </div>
                              {!allMet && !stage.canSkip && (
                                <ul className="ml-6 mt-1 space-y-0.5">
                                  {stage.prerequisites.filter(p => !p.passed).map((prereq, i) => (
                                    <li key={i} className="text-xs text-muted-foreground">
                                      {prereq.message}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {job.depositRequired 
                        ? `£${Number(job.depositAmount || 0).toLocaleString()} ${job.depositReceived ? "(Received)" : "(Pending)"}`
                        : "Not required"
                      }
                    </span>
                    {job.depositRequired && !job.depositReceived && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markDepositPaidMutation.mutate()}
                        disabled={markDepositPaidMutation.isPending}
                        data-testid="button-mark-deposit-paid"
                      >
                        {markDepositPaidMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span className="ml-1">Mark Paid</span>
                      </Button>
                    )}
                  </div>
                </div>

                {job.depositRequired && job.depositReceived && quoteTotals && (
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Balance Due</span>
                    <span className="font-mono text-lg font-semibold text-green-700 dark:text-green-300">
                      £{Math.max(quoteTotals.grandTotal - Number(job.depositAmount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}

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
                    
                    {/* Partner Payment Requests */}
                    {partnerPaymentRequests.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Partner Payment Requests
                        </h4>
                        <div className="space-y-2">
                          {partnerPaymentRequests.map((req) => (
                            <div key={req.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">£{parseFloat(req.amount).toFixed(2)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {req.type === "partner_deposit" ? "Deposit" : 
                                     req.type === "partner_balance" ? "Balance" : 
                                     req.type === "partner_commission" ? "Commission" : "Payout"}
                                  </Badge>
                                  {req.description && (
                                    <p className="text-xs text-muted-foreground">{req.description}</p>
                                  )}
                                </div>
                                <Badge variant={
                                  req.approvalStatus === "confirmed" ? "default" :
                                  req.approvalStatus === "marked_paid" ? "secondary" :
                                  req.approvalStatus === "rejected" ? "destructive" :
                                  "outline"
                                }>
                                  {req.approvalStatus === "confirmed" ? "Paid" :
                                   req.approvalStatus === "marked_paid" ? "Processing" :
                                   req.approvalStatus === "rejected" ? "Rejected" : "Pending"}
                                </Badge>
                              </div>
                              {(!req.approvalStatus || req.approvalStatus === "pending") && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updatePaymentRequestApprovalMutation.mutate({ 
                                      requestId: req.id, 
                                      approvalStatus: "marked_paid" 
                                    })}
                                    disabled={updatePaymentRequestApprovalMutation.isPending}
                                    data-testid={`button-mark-processing-${req.id}`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Mark Processing
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updatePaymentRequestApprovalMutation.mutate({ 
                                      requestId: req.id, 
                                      approvalStatus: "rejected" 
                                    })}
                                    disabled={updatePaymentRequestApprovalMutation.isPending}
                                    data-testid={`button-reject-payment-${req.id}`}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {req.approvalStatus === "marked_paid" && (
                                <Button
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => updatePaymentRequestApprovalMutation.mutate({ 
                                    requestId: req.id, 
                                    approvalStatus: "confirmed" 
                                  })}
                                  disabled={updatePaymentRequestApprovalMutation.isPending}
                                  data-testid={`button-confirm-payment-${req.id}`}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Confirm Paid
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fund Allocation Card - Only show for hybrid jobs */}
          {job.deliveryType === "hybrid" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Client Funds & Allocations
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setClientPaymentDialogOpen(true)}
                      data-testid="button-record-payment"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Record Payment
                    </Button>
                    {fundSummary && fundSummary.unallocated > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setFundAllocationDialogOpen(true)}
                        data-testid="button-allocate-funds"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Allocate Funds
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fund Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" data-testid="summary-funds-received">
                      <p className="text-xs text-green-700 dark:text-green-300">Received</p>
                      <p className="text-lg font-semibold font-mono text-green-700 dark:text-green-300" data-testid="text-funds-received-amount">
                        £{(fundSummary?.totalReceived || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" data-testid="summary-funds-allocated">
                      <p className="text-xs text-blue-700 dark:text-blue-300">Allocated</p>
                      <p className="text-lg font-semibold font-mono text-blue-700 dark:text-blue-300" data-testid="text-funds-allocated-amount">
                        £{(fundSummary?.totalAllocated || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" data-testid="summary-funds-unallocated">
                      <p className="text-xs text-amber-700 dark:text-amber-300">Unallocated</p>
                      <p className="text-lg font-semibold font-mono text-amber-700 dark:text-amber-300" data-testid="text-funds-unallocated-amount">
                        £{(fundSummary?.unallocated || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Client Payments Received */}
                  {fundSummary?.clientPayments && fundSummary.clientPayments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <PoundSterling className="w-4 h-4" />
                        Payments Received
                      </h4>
                      <div className="space-y-2">
                        {fundSummary.clientPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {payment.type === "deposit" ? "Deposit" : 
                                 payment.type === "balance" ? "Balance" : 
                                 payment.type === "partial" ? "Partial" : "Other"}
                              </Badge>
                              <span className="font-mono font-medium">£{parseFloat(payment.amount).toFixed(2)}</span>
                              {payment.paymentMethod && (
                                <span className="text-xs text-muted-foreground">via {payment.paymentMethod}</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(payment.receivedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fund Allocations */}
                  {fundSummary?.allocations && fundSummary.allocations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Handshake className="w-4 h-4" />
                        Fund Allocations
                      </h4>
                      <div className="space-y-2">
                        {fundSummary.allocations.map((alloc) => {
                          const partner = fundSummary.jobPartners.find(jp => jp.partnerId === alloc.partnerId)?.partner;
                          return (
                            <div key={alloc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-medium">£{parseFloat(alloc.amount).toFixed(2)}</span>
                                {partner && (
                                  <Badge variant="outline" className="text-xs">{partner.businessName}</Badge>
                                )}
                                {alloc.purpose && (
                                  <span className="text-xs text-muted-foreground">
                                    {alloc.purpose === "materials" ? "Materials" : 
                                     alloc.purpose === "deposit" ? "Deposit" :
                                     alloc.purpose === "labor" ? "Labor" : alloc.purpose}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  alloc.status === "confirmed" ? "default" :
                                  alloc.status === "paid" ? "secondary" :
                                  "outline"
                                }>
                                  {alloc.status === "confirmed" ? "Confirmed" :
                                   alloc.status === "paid" ? "Paid" : "Pending"}
                                </Badge>
                                {alloc.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateFundAllocationMutation.mutate({ 
                                      allocationId: alloc.id, 
                                      status: "paid" 
                                    })}
                                    disabled={updateFundAllocationMutation.isPending}
                                    data-testid={`button-mark-allocation-paid-${alloc.id}`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                {alloc.status === "paid" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateFundAllocationMutation.mutate({ 
                                      allocationId: alloc.id, 
                                      status: "confirmed" 
                                    })}
                                    disabled={updateFundAllocationMutation.isPending}
                                    data-testid={`button-confirm-allocation-${alloc.id}`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!fundSummary?.clientPayments?.length && !fundSummary?.allocations?.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No payments recorded yet. Record client payments to track funds.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Change Orders Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Change Orders
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createChangeOrderMutation.mutate()}
                  disabled={createChangeOrderMutation.isPending}
                  data-testid="button-add-change-order"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Change Order
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {changeOrders && changeOrders.length > 0 ? (
                <div className="space-y-3">
                  {changeOrders.map((co) => (
                    <div 
                      key={co.id} 
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
                      data-testid={`change-order-row-${co.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium">{co.referenceNumber}</span>
                          <Badge 
                            variant={co.status === "sent" ? "default" : co.status === "accepted" ? "default" : "secondary"}
                            className={`text-xs ${co.status === "accepted" ? "bg-green-500" : ""}`}
                          >
                            {co.status === "draft" ? "Draft" : co.status === "sent" ? "Sent" : co.status === "accepted" ? "Accepted" : "Declined"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">£{parseFloat(co.grandTotal).toFixed(2)}</span>
                          {co.reason && <span className="truncate">{co.reason}</span>}
                          {co.createdAt && (
                            <span>{new Date(co.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openChangeOrderForEdit(co)}
                          data-testid={`button-edit-co-${co.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {co.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => sendChangeOrderMutation.mutate(co.id)}
                              disabled={sendChangeOrderMutation.isPending || parseFloat(co.grandTotal) === 0}
                              data-testid={`button-send-co-${co.id}`}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteChangeOrderMutation.mutate(co.id)}
                              disabled={deleteChangeOrderMutation.isPending}
                              data-testid={`button-delete-co-${co.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {co.status === "sent" && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            In Portal
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No change orders yet. Add extra materials or costs after the original quote.</p>
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
                      <span className="text-sm font-medium">
                        {scheduleProposal.proposedByRole === "client" ? "Client Requested Date" : 
                         scheduleProposal.proposedByRole === "partner" ? "Partner Requested Date" : 
                         "Proposed Start Date"}
                      </span>
                      <Badge variant={
                        scheduleProposal.status === "scheduled" ? "default" :
                        scheduleProposal.status === "client_countered" || scheduleProposal.status === "partner_countered" ? "secondary" :
                        scheduleProposal.status === "pending_admin" ? "secondary" :
                        scheduleProposal.status === "client_declined" || scheduleProposal.status === "partner_declined" ? "destructive" :
                        scheduleProposal.status === "admin_declined" ? "destructive" :
                        "outline"
                      }>
                        {scheduleProposal.status === "pending_client" && "Awaiting Client Response"}
                        {scheduleProposal.status === "pending_partner" && "Awaiting Partner Response"}
                        {scheduleProposal.status === "pending_admin" && (scheduleProposal.proposedByRole === "partner" ? "Partner Requested - Your Response Needed" : "Client Requested - Your Response Needed")}
                        {scheduleProposal.status === "client_accepted" && "Client Accepted"}
                        {scheduleProposal.status === "partner_accepted" && "Partner Accepted"}
                        {scheduleProposal.status === "client_countered" && "Client Counter-Proposed"}
                        {scheduleProposal.status === "partner_countered" && "Partner Counter-Proposed"}
                        {scheduleProposal.status === "client_declined" && "Client Declined"}
                        {scheduleProposal.status === "partner_declined" && "Partner Declined"}
                        {scheduleProposal.status === "admin_declined" && "Declined"}
                        {scheduleProposal.status === "scheduled" && "Scheduled"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {scheduleProposal.proposedByRole === "client" ? "Client's Requested Date" : 
                           scheduleProposal.proposedByRole === "partner" ? "Partner's Requested Date" :
                           "Your Proposed Date"}
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
                          <p className="text-muted-foreground">
                            {scheduleProposal.proposedByRole === "admin" ? (scheduleProposal.status?.includes("partner") ? "Partner's Counter Date" : "Client's Counter Date") : "Your Counter Date"}
                          </p>
                          <p className="font-medium">{new Date(scheduleProposal.counterProposedDate).toLocaleDateString()}</p>
                          {scheduleProposal.counterReason && (
                            <p className="text-xs text-muted-foreground mt-1">{scheduleProposal.counterReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {scheduleProposal.adminNotes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">Notes: {scheduleProposal.adminNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions based on status */}
                  <div className="flex gap-2 flex-wrap">
                    {scheduleProposal.status === "pending_admin" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => adminRespondToClientProposalMutation.mutate({ 
                            proposalId: scheduleProposal.id, 
                            response: "accepted" 
                          })}
                          disabled={adminRespondToClientProposalMutation.isPending}
                          data-testid="button-accept-requested-date"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept {scheduleProposal.proposedByRole === "partner" ? "Partner's" : "Client's"} Date
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScheduleDialogOpen(true)}
                          data-testid="button-counter-requested-date"
                        >
                          Suggest Different Date
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adminRespondToClientProposalMutation.mutate({ 
                            proposalId: scheduleProposal.id, 
                            response: "declined" 
                          })}
                          disabled={adminRespondToClientProposalMutation.isPending}
                          data-testid="button-decline-requested-date"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    {(scheduleProposal.status === "client_countered" || scheduleProposal.status === "client_accepted" || 
                      scheduleProposal.status === "partner_countered" || scheduleProposal.status === "partner_accepted") && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => confirmCounterProposalMutation.mutate(scheduleProposal.id)}
                          disabled={confirmCounterProposalMutation.isPending}
                          data-testid="button-confirm-counter"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept {scheduleProposal.status?.includes("partner") ? "Partner's" : "Client's"} Date
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
                    {(scheduleProposal.status === "client_declined" || scheduleProposal.status === "admin_declined" ||
                      scheduleProposal.status === "partner_declined") && (
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
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Job scheduled and added to calendar</span>
                        </div>
                        {/* Deposit Request Section */}
                        {(() => {
                          const existingDeposit = paymentRequests?.find(pr => pr.type === "deposit");
                          if (existingDeposit) {
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <PoundSterling className="w-4 h-4" />
                                <span>Deposit requested: £{parseFloat(existingDeposit.amount).toFixed(2)}</span>
                                <Badge variant={existingDeposit.status === "paid" ? "default" : "secondary"} className="text-xs">
                                  {existingDeposit.status === "paid" ? "Paid" : existingDeposit.status === "sent" ? "Awaiting Payment" : existingDeposit.status}
                                </Badge>
                              </div>
                            );
                          }
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDepositDialogOpen(true)}
                              disabled={hasActiveDepositRequest}
                              title={hasActiveDepositRequest ? "A deposit request is already pending" : undefined}
                              data-testid="button-request-deposit"
                            >
                              <PoundSterling className="w-3 h-3 mr-1" />
                              {hasActiveDepositRequest ? "Deposit Requested" : "Request Booking Deposit"}
                            </Button>
                          );
                        })()}
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

          {/* Mandatory Checklists */}
          <ChecklistCompletion targetType="job" targetId={id!} />

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
              <Link href={`/contacts?selected=${contact.id}`}>
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
                  
                  <SendMessageDialog
                    recipientId={partner.id}
                    recipientName={partner.businessName}
                    recipientType="partner"
                    trigger={
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-message-partner">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Partner
                      </Button>
                    }
                  />
                  
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
                    
                    {job.partnerStatus === "accepted" && !job.partnerAcceptanceAcknowledged && (
                      <div className="mt-3 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium mb-2">
                          <CheckCircle className="w-4 h-4" />
                          Partner Accepted!
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {partner.businessName} accepted this job
                          {job.partnerRespondedAt && (
                            <> on {new Date(job.partnerRespondedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</>
                          )}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => acknowledgePartnerAcceptanceMutation.mutate()}
                          disabled={acknowledgePartnerAcceptanceMutation.isPending}
                          data-testid="button-acknowledge-partner"
                        >
                          Acknowledge
                        </Button>
                      </div>
                    )}
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

          {/* CAD Drawing Link Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  CAD Drawing
                </div>
                {!cadLinkEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCadLinkValue(job.cadDrawingLink || "");
                      setCadLinkEditing(true);
                    }}
                    data-testid="button-edit-cad-link"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cadLinkEditing ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Paste CAD drawing link here..."
                    value={cadLinkValue}
                    onChange={(e) => setCadLinkValue(e.target.value)}
                    data-testid="input-cad-link"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateCadLinkMutation.mutate(cadLinkValue)}
                      disabled={updateCadLinkMutation.isPending}
                      data-testid="button-save-cad-link"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCadLinkEditing(false)}
                      data-testid="button-cancel-cad-link"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : job.cadDrawingLink ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <a 
                    href={job.cadDrawingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                    data-testid="link-cad-drawing"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    {job.cadDrawingLink}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(job.cadDrawingLink!);
                      toast({ title: "Link copied to clipboard" });
                    }}
                    data-testid="button-copy-cad-link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No CAD drawing link added yet. Click the edit button to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Connection Links Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Connection Links
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConnectionLinkDialogOpen(true)}
                  data-testid="button-add-connection-link"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!connectionLinks || connectionLinks.length === 0) ? (
                <p className="text-sm text-muted-foreground">No connection links created. Create a link to share job access with clients, partners, or employees.</p>
              ) : (
                <div className="space-y-3">
                  {connectionLinks.map((link) => (
                    <div key={link.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            link.partyType === "client" ? "default" :
                            link.partyType === "partner" ? "secondary" :
                            "outline"
                          }>
                            {link.partyType.charAt(0).toUpperCase() + link.partyType.slice(1)}
                          </Badge>
                          {link.status === "active" ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                          ) : link.status === "connected" ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Connected</Badge>
                          ) : (
                            <Badge variant="destructive">{link.status.charAt(0).toUpperCase() + link.status.slice(1)}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const url = `${window.location.origin}/job-hub/${link.token}`;
                              navigator.clipboard.writeText(url);
                              toast({ title: "Link copied to clipboard" });
                            }}
                            disabled={link.status === "revoked" || link.status === "expired"}
                            data-testid={`button-copy-link-${link.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`/job-hub/${link.token}`, '_blank')}
                            disabled={link.status === "revoked" || link.status === "expired"}
                            data-testid={`button-open-link-${link.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          {(link.status === "active" || link.status === "connected") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => revokeConnectionLinkMutation.mutate(link.id)}
                              data-testid={`button-revoke-link-${link.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : "N/A"}
                        {link.expiresAt && ` | Expires: ${new Date(link.expiresAt).toLocaleDateString()}`}
                        {link.lastAccessedAt && ` | Last accessed: ${new Date(link.lastAccessedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partner Surveys Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Partner Surveys
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSurveyDialogOpen(true)}
                  data-testid="button-add-survey"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!jobSurveys || jobSurveys.length === 0) ? (
                <p className="text-sm text-muted-foreground">No surveys requested yet.</p>
              ) : (
                <div className="space-y-3">
                  {jobSurveys.map((survey) => (
                    <div key={survey.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {survey.partner?.businessName || "Unknown Partner"}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={
                            survey.status === "completed" ? "default" :
                            survey.status === "accepted" || survey.status === "scheduled" ? "secondary" :
                            survey.status === "declined" || survey.status === "cancelled" ? "destructive" :
                            "outline"
                          }>
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                          {survey.bookingStatus && (
                            <Badge className={
                              survey.bookingStatus === "pending_client" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              survey.bookingStatus === "client_accepted" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              survey.bookingStatus === "client_declined" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              survey.bookingStatus === "client_counter" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                              survey.bookingStatus === "confirmed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }>
                              {survey.bookingStatus === "pending_client" ? "Awaiting Client" :
                               survey.bookingStatus === "client_accepted" ? "Client Accepted" :
                               survey.bookingStatus === "client_declined" ? "Client Declined" :
                               survey.bookingStatus === "client_counter" ? "Client Counter" :
                               survey.bookingStatus === "confirmed" ? "Confirmed" :
                               survey.bookingStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {survey.partner?.tradeCategory && (
                        <p className="text-xs text-muted-foreground">{survey.partner.tradeCategory}</p>
                      )}
                      
                      {/* Booking Timeline - Always show full history */}
                      {survey.proposedDate && (
                        <div className="text-xs text-muted-foreground border-l-2 border-blue-300 pl-2 py-1">
                          <span className="font-medium">Partner proposed: </span>
                          {new Date(survey.proposedDate).toLocaleDateString()}
                          {survey.proposedTime && ` at ${survey.proposedTime}`}
                          {survey.partnerNotes && <p className="mt-1">{survey.partnerNotes}</p>}
                        </div>
                      )}
                      
                      {/* Show client response - display regardless of current status for audit trail */}
                      {survey.clientProposedDate && (
                        <div className="text-xs text-muted-foreground border-l-2 border-orange-300 pl-2 py-1">
                          <span className="font-medium">Client counter-proposed: </span>
                          {new Date(survey.clientProposedDate).toLocaleDateString()}
                          {survey.clientProposedTime && ` at ${survey.clientProposedTime}`}
                          {survey.clientNotes && <p className="mt-1">{survey.clientNotes}</p>}
                        </div>
                      )}
                      
                      {/* Show client acceptance without counter-proposal */}
                      {!survey.clientProposedDate && survey.bookingStatus && ["client_accepted", "confirmed"].includes(survey.bookingStatus) && (
                        <div className="text-xs text-muted-foreground border-l-2 border-green-300 pl-2 py-1">
                          <span className="font-medium">Client accepted proposed date</span>
                          {survey.clientNotes && <p className="mt-1">{survey.clientNotes}</p>}
                        </div>
                      )}
                      
                      {/* Show client decline */}
                      {survey.bookingStatus === "client_declined" && (
                        <div className="text-xs text-muted-foreground border-l-2 border-red-300 pl-2 py-1">
                          <span className="font-medium">Client declined proposed date</span>
                          {survey.clientNotes && <p className="mt-1">{survey.clientNotes}</p>}
                        </div>
                      )}

                      {survey.scheduledDate && survey.status === "scheduled" && (
                        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 border-l-2 border-green-500 pl-2 py-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Confirmed: </span>
                          {new Date(survey.scheduledDate).toLocaleDateString()}
                          {survey.scheduledTime && ` at ${survey.scheduledTime}`}
                        </div>
                      )}
                      
                      {survey.surveyDetails && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          {survey.surveyDetails}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {survey.status === "requested" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => cancelSurveyMutation.mutate(survey.id)}
                            data-testid={`button-cancel-survey-${survey.id}`}
                          >
                            Cancel
                          </Button>
                        )}
                        {(survey.status === "cancelled" || survey.status === "declined") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive"
                            onClick={() => deleteSurveyMutation.mutate(survey.id)}
                            data-testid={`button-delete-survey-${survey.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partner Quotes Section - for admin approval */}
          {partnerQuotes && partnerQuotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Partner Quotes
                  {partnerQuotes.some(q => q.status === "submitted") && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-2">
                      Awaiting Review
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partnerQuotes.map((quote) => (
                  <div key={quote.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {quote.partner?.businessName || "Unknown Partner"}
                      </span>
                      <Badge variant={
                        quote.status === "accepted" ? "default" :
                        quote.status === "declined" ? "destructive" :
                        quote.status === "submitted" ? "secondary" :
                        "outline"
                      }>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">£{parseFloat(quote.total || "0").toFixed(2)}</span>
                      {quote.taxEnabled && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (inc. VAT)
                        </span>
                      )}
                    </div>
                    
                    {quote.items && quote.items.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                        <ul className="mt-1 space-y-0.5 pl-3">
                          {quote.items.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.description} - £{parseFloat(item.total).toFixed(2)}
                            </li>
                          ))}
                          {quote.items.length > 3 && (
                            <li className="text-muted-foreground">+{quote.items.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {quote.notes && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {quote.notes}
                      </p>
                    )}
                    
                    {quote.submittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                    
                    {quote.status === "submitted" && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => acceptPartnerQuoteMutation.mutate({ quoteId: quote.id })}
                          disabled={acceptPartnerQuoteMutation.isPending}
                          data-testid={`button-accept-partner-quote-${quote.id}`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept & Send to Client
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declinePartnerQuoteMutation.mutate(quote.id)}
                          disabled={declinePartnerQuoteMutation.isPending}
                          data-testid={`button-decline-partner-quote-${quote.id}`}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Emergency Callouts Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-destructive" />
                  Emergency Callouts
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setEmergencyDialogOpen(true)}
                  data-testid="button-emergency-callout"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Urgent
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!emergencyCallouts || emergencyCallouts.length === 0) ? (
                <p className="text-sm text-muted-foreground">No emergency callouts for this job.</p>
              ) : (
                <div className="space-y-3">
                  {emergencyCallouts.map((callout) => (
                    <div key={callout.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {EMERGENCY_INCIDENT_TYPES.find(t => t.value === callout.incidentType)?.label || callout.incidentType}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            callout.priority === "critical" ? "destructive" :
                            callout.priority === "high" ? "destructive" :
                            callout.priority === "medium" ? "secondary" :
                            "outline"
                          }>
                            {EMERGENCY_PRIORITIES.find(p => p.value === callout.priority)?.label || callout.priority}
                          </Badge>
                          <Badge variant={
                            callout.status === "assigned" || callout.status === "resolved" ? "default" :
                            callout.status === "cancelled" ? "destructive" :
                            "outline"
                          }>
                            {callout.status.charAt(0).toUpperCase() + callout.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      {callout.description && (
                        <p className="text-xs text-muted-foreground">{callout.description}</p>
                      )}
                      
                      {callout.broadcastAt && (
                        <p className="text-xs text-muted-foreground">
                          Broadcast: {new Date(callout.broadcastAt).toLocaleString()}
                        </p>
                      )}
                      
                      {callout.assignedPartnerId && callout.assignedAt && (
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Partner assigned at {new Date(callout.assignedAt).toLocaleString()}
                        </p>
                      )}
                      
                      {callout.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEmergencyCalloutDetailId(callout.id)}
                          data-testid={`button-view-responses-${callout.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Responses
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Survey Assignment Dialog */}
      <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Partner Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Trade Partner</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger data-testid="select-survey-partner">
                  <SelectValue placeholder="Choose a partner..." />
                </SelectTrigger>
                <SelectContent>
                  {allPartners?.filter(p => p.isActive !== false).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.businessName} - {p.tradeCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Date (Optional)</Label>
                <Input
                  type="date"
                  value={surveyDate}
                  onChange={(e) => setSurveyDate(e.target.value)}
                  data-testid="input-survey-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Time (Optional)</Label>
                <Input
                  type="time"
                  value={surveyTime}
                  onChange={(e) => setSurveyTime(e.target.value)}
                  data-testid="input-survey-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes for Partner (Optional)</Label>
              <Textarea
                value={surveyNotes}
                onChange={(e) => setSurveyNotes(e.target.value)}
                placeholder="Any special instructions or details..."
                className="min-h-[80px]"
                data-testid="textarea-survey-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetSurveyDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedPartnerId) {
                  toast({ title: "Please select a partner", variant: "destructive" });
                  return;
                }
                createSurveyMutation.mutate({
                  partnerId: selectedPartnerId,
                  adminNotes: surveyNotes || undefined,
                  scheduledDate: surveyDate || undefined,
                  scheduledTime: surveyTime || undefined,
                });
              }}
              disabled={createSurveyMutation.isPending}
              data-testid="button-submit-survey"
            >
              {createSurveyMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  adminNotes: proposalNotes || undefined,
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

      {/* Deposit Request Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Booking Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Deposit Type</Label>
              <Select value={depositType} onValueChange={(v) => setDepositType(v as "fixed" | "percentage")}>
                <SelectTrigger data-testid="select-deposit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage of Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{depositType === "fixed" ? "Amount (£)" : "Percentage (%)"}</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={depositType === "fixed" ? "e.g. 500" : "e.g. 25"}
                data-testid="input-deposit-amount"
              />
              {depositType === "percentage" && data?.job?.quotedValue && depositAmount && (
                <p className="text-sm text-muted-foreground">
                  = £{((parseFloat(data.job.quotedValue) * parseFloat(depositAmount)) / 100).toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={depositDueDate}
                onChange={(e) => setDepositDueDate(e.target.value)}
                data-testid="input-deposit-due-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                placeholder="Enter description for the client"
                className="min-h-[60px]"
                data-testid="textarea-deposit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!depositAmount || parseFloat(depositAmount) <= 0) {
                  toast({ title: "Please enter a valid amount", variant: "destructive" });
                  return;
                }
                let finalAmount = depositAmount;
                if (depositType === "percentage" && data?.job?.quotedValue) {
                  finalAmount = ((parseFloat(data.job.quotedValue) * parseFloat(depositAmount)) / 100).toFixed(2);
                }
                createDepositRequestMutation.mutate({
                  amount: finalAmount,
                  description: depositDescription,
                  dueDate: depositDueDate || undefined,
                  depositType: depositType,
                  originalAmount: depositAmount,
                });
              }}
              disabled={createDepositRequestMutation.isPending}
              data-testid="button-send-deposit-request"
            >
              <Send className="w-3 h-3 mr-1" />
              Send to Client Portal
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

      {/* Emergency Callout Create Dialog */}
      <Dialog open={emergencyDialogOpen} onOpenChange={(open) => !open && resetEmergencyDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="w-5 h-5" />
              Emergency Callout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Type</Label>
                <Select value={emergencyIncidentType} onValueChange={setEmergencyIncidentType}>
                  <SelectTrigger data-testid="select-emergency-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={emergencyPriority} onValueChange={setEmergencyPriority}>
                  <SelectTrigger data-testid="select-emergency-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                placeholder="Describe the emergency situation..."
                className="min-h-[80px]"
                data-testid="textarea-emergency-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Select Partners to Alert</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Only partners marked as emergency-available will be shown
              </p>
              {(!emergencyPartners || emergencyPartners.length === 0) ? (
                <p className="text-sm text-muted-foreground">No emergency-ready partners available.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {emergencyPartners.map((partner) => (
                    <div key={partner.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`partner-${partner.id}`}
                        checked={selectedEmergencyPartners.includes(partner.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmergencyPartners(prev => [...prev, partner.id]);
                          } else {
                            setSelectedEmergencyPartners(prev => prev.filter(id => id !== partner.id));
                          }
                        }}
                        data-testid={`checkbox-partner-${partner.id}`}
                      />
                      <label
                        htmlFor={`partner-${partner.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {partner.businessName}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({partner.tradeCategory})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEmergencyDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEmergencyPartners.length === 0) {
                  toast({ title: "Please select at least one partner", variant: "destructive" });
                  return;
                }
                createEmergencyCalloutMutation.mutate({
                  jobId: id!,
                  incidentType: emergencyIncidentType,
                  priority: emergencyPriority,
                  description: emergencyDescription || undefined,
                  partnerIds: selectedEmergencyPartners,
                });
              }}
              disabled={createEmergencyCalloutMutation.isPending}
              data-testid="button-broadcast-emergency"
            >
              <Siren className="w-4 h-4 mr-1" />
              {createEmergencyCalloutMutation.isPending ? "Broadcasting..." : "Broadcast Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Response Board Dialog */}
      <Dialog open={!!emergencyCalloutDetailId} onOpenChange={(open) => !open && setEmergencyCalloutDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-destructive" />
              Emergency Response Board
            </DialogTitle>
          </DialogHeader>
          {emergencyCalloutDetail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">
                    {EMERGENCY_INCIDENT_TYPES.find(t => t.value === emergencyCalloutDetail.incidentType)?.label || emergencyCalloutDetail.incidentType}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority: </span>
                  <Badge variant={emergencyCalloutDetail.priority === "critical" || emergencyCalloutDetail.priority === "high" ? "destructive" : "secondary"}>
                    {EMERGENCY_PRIORITIES.find(p => p.value === emergencyCalloutDetail.priority)?.label || emergencyCalloutDetail.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Broadcast: </span>
                  <span>{emergencyCalloutDetail.broadcastAt ? new Date(emergencyCalloutDetail.broadcastAt).toLocaleString() : "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge>{emergencyCalloutDetail.status}</Badge>
                </div>
              </div>
              
              {emergencyCalloutDetail.description && (
                <div className="text-sm bg-muted p-2 rounded">
                  {emergencyCalloutDetail.description}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-base">Partner Responses</Label>
                {(!emergencyCalloutDetail.responses || emergencyCalloutDetail.responses.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No responses yet. Waiting for partners...</p>
                ) : (
                  <div className="space-y-2">
                    {emergencyCalloutDetail.responses.map((response) => (
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
                              response.status === "acknowledged" ? "outline" :
                              "outline"
                            }>
                              {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        {response.responseNotes && (
                          <p className="text-xs text-muted-foreground mt-1">{response.responseNotes}</p>
                        )}
                        
                        {response.declineReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Reason: {response.declineReason}
                          </p>
                        )}
                        
                        {response.status === "responded" && emergencyCalloutDetail.status === "open" && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => assignEmergencyPartnerMutation.mutate({
                              calloutId: emergencyCalloutDetail.id,
                              responseId: response.id,
                            })}
                            disabled={assignEmergencyPartnerMutation.isPending}
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
              
              {emergencyCalloutDetail.status === "open" && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resolveEmergencyCalloutMutation.mutate({
                        calloutId: emergencyCalloutDetail.id,
                        status: "cancelled",
                      });
                      setEmergencyCalloutDetailId(null);
                    }}
                    data-testid="button-cancel-callout"
                  >
                    Cancel Callout
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Order Dialog */}
      <Dialog open={changeOrderDialogOpen} onOpenChange={(open) => {
        setChangeOrderDialogOpen(open);
        if (!open) {
          setSelectedChangeOrder(null);
          setChangeOrderItems([]);
          setNewItemDescription("");
          setNewItemQuantity("1");
          setNewItemUnitPrice("");
          setShowCatalogInChangeOrder(false);
          setCatalogSearchInChangeOrder("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedChangeOrder?.referenceNumber || "Change Order"} - Additional Costs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add Item Options */}
            {selectedChangeOrder?.status === "draft" && (
              <div className="space-y-3">
                {/* Toggle between manual and catalog */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={!showCatalogInChangeOrder ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCatalogInChangeOrder(false)}
                    data-testid="button-manual-entry"
                  >
                    Manual Entry
                  </Button>
                  <Button
                    variant={showCatalogInChangeOrder ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCatalogInChangeOrder(true)}
                    data-testid="button-from-catalog"
                  >
                    <Boxes className="w-3 h-3 mr-1" />
                    From Catalog
                  </Button>
                </div>

                {/* Manual Entry Form */}
                {!showCatalogInChangeOrder && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <p className="text-sm font-medium">Add Manual Item</p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Description"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        data-testid="input-co-item-description"
                      />
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(e.target.value)}
                            data-testid="input-co-item-qty"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price £"
                            value={newItemUnitPrice}
                            onChange={(e) => setNewItemUnitPrice(e.target.value)}
                            data-testid="input-co-item-price"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newItemDescription && newItemUnitPrice) {
                              const qty = parseFloat(newItemQuantity) || 1;
                              const price = parseFloat(newItemUnitPrice) || 0;
                              addChangeOrderItemMutation.mutate({
                                description: newItemDescription,
                                quantity: qty.toString(),
                                unitPrice: price.toFixed(2),
                                lineTotal: (qty * price).toFixed(2),
                              });
                            }
                          }}
                          disabled={addChangeOrderItemMutation.isPending || !newItemDescription || !newItemUnitPrice}
                          data-testid="button-add-co-item"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Catalog Picker */}
                {showCatalogInChangeOrder && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <p className="text-sm font-medium">Select from Catalog</p>
                    <Input
                      placeholder="Search products..."
                      value={catalogSearchInChangeOrder}
                      onChange={(e) => setCatalogSearchInChangeOrder(e.target.value)}
                      data-testid="input-catalog-search-co"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredCatalogForChangeOrder.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {catalogItems.length === 0 ? "No products in catalog" : "No matching products"}
                        </p>
                      ) : (
                        filteredCatalogForChangeOrder.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border hover-elevate"
                            data-testid={`catalog-co-item-${item.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                £{parseFloat(item.unitPrice).toFixed(2)}/{item.unitOfMeasure || "each"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                addChangeOrderItemMutation.mutate({
                                  description: item.name,
                                  quantity: "1",
                                  unitPrice: item.unitPrice,
                                  lineTotal: item.unitPrice,
                                });
                              }}
                              disabled={addChangeOrderItemMutation.isPending}
                              data-testid={`button-add-catalog-co-${item.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            {changeOrderItems.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {changeOrderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex-1">
                      <p className="text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x £{parseFloat(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        £{parseFloat(item.lineTotal).toFixed(2)}
                      </span>
                      {selectedChangeOrder?.status === "draft" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteChangeOrderItemMutation.mutate(item.id)}
                          disabled={deleteChangeOrderItemMutation.isPending}
                          data-testid={`button-delete-item-${item.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items added yet. Add extra materials or costs above.
              </p>
            )}

            {/* Totals */}
            {selectedChangeOrder && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>£{parseFloat(selectedChangeOrder.subtotal).toFixed(2)}</span>
                </div>
                {selectedChangeOrder.taxEnabled && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT ({selectedChangeOrder.taxRate}%)</span>
                    <span>£{parseFloat(selectedChangeOrder.taxAmount || "0").toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>£{parseFloat(selectedChangeOrder.grandTotal).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeOrderDialogOpen(false)}>
              Close
            </Button>
            {selectedChangeOrder?.status === "draft" && changeOrderItems.length > 0 && (
              <Button
                onClick={() => {
                  sendChangeOrderMutation.mutate(selectedChangeOrder.id);
                  setChangeOrderDialogOpen(false);
                }}
                disabled={sendChangeOrderMutation.isPending}
              >
                <Send className="w-3 h-3 mr-1" />
                Send to Client
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Link Dialog */}
      <Dialog open={connectionLinkDialogOpen} onOpenChange={setConnectionLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Connection Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Create a shareable link to give clients, partners, or employees direct access to this job's hub.
            </p>
            <div className="space-y-2">
              <Label>Link Type</Label>
              <Select value={connectionLinkType} onValueChange={setConnectionLinkType}>
                <SelectTrigger data-testid="select-connection-link-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client - View job details, accept quotes, send messages</SelectItem>
                  <SelectItem value="partner">Partner - View assigned work, notes, and financials</SelectItem>
                  <SelectItem value="employee">Employee - Full access to job management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConnectionLinkDialogOpen(false);
                setConnectionLinkType("client");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createConnectionLinkMutation.mutate({ partyType: connectionLinkType })}
              disabled={createConnectionLinkMutation.isPending}
              data-testid="button-create-connection-link"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Client Payment Dialog */}
      <Dialog open={clientPaymentDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setClientPaymentType("deposit");
          setClientPaymentAmount("");
          setClientPaymentMethod("");
          setClientPaymentReference("");
          setClientPaymentNotes("");
        }
        setClientPaymentDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Client Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select value={clientPaymentType} onValueChange={setClientPaymentType}>
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="balance">Final Balance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input
                type="number"
                step="0.01"
                value={clientPaymentAmount}
                onChange={(e) => setClientPaymentAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-payment-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method (optional)</Label>
              <Select value={clientPaymentMethod} onValueChange={setClientPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={clientPaymentReference}
                onChange={(e) => setClientPaymentReference(e.target.value)}
                placeholder="Transaction reference"
                data-testid="input-payment-reference"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={clientPaymentNotes}
                onChange={(e) => setClientPaymentNotes(e.target.value)}
                placeholder="Any additional notes..."
                data-testid="input-payment-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClientPaymentType("deposit");
                setClientPaymentAmount("");
                setClientPaymentMethod("");
                setClientPaymentReference("");
                setClientPaymentNotes("");
                setClientPaymentDialogOpen(false);
              }}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createClientPaymentMutation.mutate({
                type: clientPaymentType,
                amount: clientPaymentAmount,
                paymentMethod: clientPaymentMethod || undefined,
                reference: clientPaymentReference || undefined,
                notes: clientPaymentNotes || undefined,
              })}
              disabled={createClientPaymentMutation.isPending || !clientPaymentAmount || parseFloat(clientPaymentAmount) <= 0}
              data-testid="button-confirm-payment"
            >
              {createClientPaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Funds Dialog */}
      <Dialog open={fundAllocationDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAllocationPartnerId("");
          setAllocationAmount("");
          setAllocationPurpose("materials");
          setAllocationNotes("");
        }
        setFundAllocationDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Funds to Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" data-testid="text-available-to-allocate">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Available to allocate: <span className="font-semibold font-mono">£{(fundSummary?.unallocated || 0).toFixed(2)}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Partner <span className="text-destructive">*</span></Label>
              <Select value={allocationPartnerId} onValueChange={setAllocationPartnerId}>
                <SelectTrigger data-testid="select-allocation-partner">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {fundSummary?.jobPartners?.map((jp) => (
                    <SelectItem key={jp.partnerId} value={jp.partnerId}>
                      {jp.partner?.businessName || "Unknown Partner"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!allocationPartnerId && fundSummary?.jobPartners?.length === 0 && (
                <p className="text-xs text-muted-foreground">No partners assigned to this job yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                step="0.01"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                placeholder="0.00"
                max={fundSummary?.unallocated || 0}
                data-testid="input-allocation-amount"
              />
              {allocationAmount && parseFloat(allocationAmount) > (fundSummary?.unallocated || 0) && (
                <p className="text-xs text-destructive">Amount exceeds available funds</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={allocationPurpose} onValueChange={setAllocationPurpose}>
                <SelectTrigger data-testid="select-allocation-purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="deposit">Subcontract Deposit</SelectItem>
                  <SelectItem value="labor">Labor Payment</SelectItem>
                  <SelectItem value="equipment">Equipment Rental</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={allocationNotes}
                onChange={(e) => setAllocationNotes(e.target.value)}
                placeholder="Reason for this allocation..."
                data-testid="input-allocation-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAllocationPartnerId("");
                setAllocationAmount("");
                setAllocationPurpose("materials");
                setAllocationNotes("");
                setFundAllocationDialogOpen(false);
              }}
              data-testid="button-cancel-allocation"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createFundAllocationMutation.mutate({
                partnerId: allocationPartnerId,
                amount: allocationAmount,
                purpose: allocationPurpose,
                notes: allocationNotes || undefined,
              })}
              disabled={
                createFundAllocationMutation.isPending || 
                !allocationPartnerId || 
                !allocationAmount || 
                parseFloat(allocationAmount) <= 0 ||
                parseFloat(allocationAmount) > (fundSummary?.unallocated || 0)
              }
              data-testid="button-confirm-allocation"
            >
              {createFundAllocationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Allocate Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
