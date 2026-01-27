import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Users, Phone, Mail, MapPin, Edit, Trash2, UserPlus, CheckCircle, Copy, ExternalLink, MessageSquare, Upload, FileSpreadsheet, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Contact, InsertContact, ClientPortalAccess } from "@shared/schema";

interface PortalAccessWithToken {
  isActive?: boolean;
  portalToken?: string;
  inviteStatus?: "pending" | "accepted";
  inviteSentAt?: string;
  inviteExpiresAt?: string;
}
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";

const formSchema = insertContactSchema.extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

type FormData = z.infer<typeof formSchema>;

// Import dialog types
interface ImportParseResult {
  headers: string[];
  previewRows: Record<string, string>[];
  totalRows: number;
  autoMapping: Record<string, string>;
  contactFields: string[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  totalErrors: number;
}

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [resetPasswordContact, setResetPasswordContact] = useState<Contact | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "result">("upload");
  const [importFile, setImportFile] = useState<{ name: string; content: string } | null>(null);
  const [importParseResult, setImportParseResult] = useState<ImportParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Delete confirm state
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Handle URL query parameter to auto-select a contact
  const searchString = useSearch();
  useEffect(() => {
    if (!contacts.length) return;

    const params = new URLSearchParams(searchString);
    const selectedId = params.get("selected");

    if (selectedId) {
      const contact = contacts.find(c => c.id === selectedId);
      if (contact) {
        setEditingContact(contact);
        form.reset({
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone,
          address: contact.address || "",
          postcode: contact.postcode || "",
          notes: contact.notes || "",
        });
        setIsDialogOpen(true);
      }
    }
  }, [contacts, searchString]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (editingContact) {
        return apiRequest("PATCH", `/api/contacts/${editingContact.id}`, values);
      }
      return apiRequest("POST", "/api/contacts", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: editingContact ? "Contact updated" : "Contact created",
        description: editingContact ? "The contact has been updated." : "New contact has been added.",
      });
      setIsDialogOpen(false);
      setEditingContact(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return apiRequest("DELETE", `/api/contacts/${id}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contact deleted" });
      setContactToDelete(null);
      setDeletePassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting contact",
        description: error.message || "Failed to delete contact. Check your password.",
        variant: "destructive"
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ contactId, sendEmail }: { contactId: string; sendEmail: boolean }) => {
      const response = await apiRequest("POST", `/api/contacts/${contactId}/invite`, { sendEmail });
      return response.json();
    },
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/portal/invite/${data.inviteToken}`;
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/portal-access"] });
      if (data.emailSent) {
        toast({
          title: "Invitation sent via email",
          description: "The client has been emailed their portal access link.",
        });
      } else {
        toast({
          title: "Invitation created",
          description: `Invite link: ${inviteUrl}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ contactId, password }: { contactId: string; password: string }) => {
      const response = await apiRequest("POST", `/api/contacts/${contactId}/reset-password`, { newPassword: password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/portal-access"] });
      toast({
        title: "Password Reset",
        description: data.message || "Password has been reset successfully.",
      });
      setResetPasswordContact(null);
      setNewPassword("");
      setShowPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const getPortalAccess = async (contactId: string): Promise<PortalAccessWithToken | null> => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/portal-access`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  const copyPortalLink = (token: string, isPending: boolean) => {
    const path = isPending ? `/portal/invite/${token}` : `/portal/login?token=${token}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: isPending ? "Invite link copied to clipboard" : "Portal link copied to clipboard",
    });
  };

  const openPortalAsClient = (token: string, isPending: boolean) => {
    const url = isPending ? `/portal/invite/${token}` : `/portal/login?token=${token}`;
    window.open(url, "_blank");
  };

  const { data: portalAccessMap = {} } = useQuery({
    queryKey: ["/api/contacts/portal-access", contacts.map(c => c.id).join(",")],
    queryFn: async () => {
      const accessMap: Record<string, PortalAccessWithToken | null> = {};
      await Promise.all(
        contacts.map(async (contact) => {
          accessMap[contact.id] = await getPortalAccess(contact.id);
        })
      );
      return accessMap;
    },
    enabled: contacts.length > 0,
  });

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.postcode?.toLowerCase().includes(query)
    );
  });

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      address: contact.address || "",
      postcode: contact.postcode || "",
      notes: contact.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingContact(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // Import functions
  const resetImportState = () => {
    setImportStep("upload");
    setImportFile(null);
    setImportParseResult(null);
    setColumnMapping({});
    setImportResult(null);
    setIsImporting(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [".csv", ".xlsx", ".xls"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validTypes.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      setImportFile({ name: file.name, content: base64 });

      // Parse file to get headers and preview
      try {
        const response = await apiRequest("POST", "/api/contacts/import/parse", {
          fileContent: base64,
          fileName: file.name,
        });
        const result = await response.json();
        setImportParseResult(result);
        setColumnMapping(result.autoMapping || {});
        setImportStep("mapping");
      } catch (err) {
        toast({
          title: "Failed to parse file",
          description: err instanceof Error ? err.message : "Please check the file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportExecute = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const response = await apiRequest("POST", "/api/contacts/import/execute", {
        fileContent: importFile.content,
        fileName: importFile.name,
        columnMapping,
        skipDuplicates,
      });
      const result: ImportResult = await response.json();
      setImportResult(result);
      setImportStep("result");

      // Refresh contacts list
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: "Name *",
      email: "Email",
      phone: "Phone *",
      address: "Address",
      postcode: "Postcode",
      notes: "Notes",
    };
    return labels[field] || field;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { resetImportState(); setIsImportDialogOpen(true); }}
            data-testid="button-import-contacts"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreateDialog} data-testid="button-add-contact">
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      {...form.register("name")}
                      placeholder="Client name"
                      data-testid="input-contact-name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      {...form.register("phone")}
                      placeholder="Phone number"
                      data-testid="input-contact-phone"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...form.register("email")}
                      type="email"
                      placeholder="Email address"
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      {...form.register("address")}
                      placeholder="Street address"
                      data-testid="input-contact-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      {...form.register("postcode")}
                      placeholder="e.g. CF10 1AA"
                      data-testid="input-contact-postcode"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    {...form.register("notes")}
                    placeholder="Additional notes..."
                    data-testid="textarea-contact-notes"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-contact">
                    {createMutation.isPending ? "Saving..." : editingContact ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Clients Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setIsImportDialogOpen(open); if (!open) resetImportState(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Clients
            </DialogTitle>
          </DialogHeader>

          {importStep === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV or Excel file containing your client data. The file should have column headers in the first row.
              </p>
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                  data-testid="input-import-file"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          )}

          {importStep === "mapping" && importParseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <strong>{importParseResult.totalRows}</strong> rows to import from <strong>{importFile?.name}</strong>
                </p>
                <Button variant="ghost" size="sm" onClick={() => { setImportStep("upload"); setImportFile(null); }} data-testid="button-import-choose-different">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Choose different file
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Map your columns to contact fields:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {importParseResult.headers.map(header => (
                    <div key={header} className="flex items-center gap-2">
                      <span className="text-sm w-32 truncate" title={header}>{header}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={columnMapping[header] || "skip"}
                        onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [header]: value }))}
                      >
                        <SelectTrigger className="flex-1" data-testid={`select-mapping-${header}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip this column</SelectItem>
                          {importParseResult.contactFields.map(field => (
                            <SelectItem key={field} value={field}>{getFieldLabel(field)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Preview (first 5 rows):</h4>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted">
                        {importParseResult.headers.map(header => (
                          <th key={header} className="px-2 py-1 text-left font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importParseResult.previewRows.map((row, i) => (
                        <tr key={i} className="border-t">
                          {importParseResult.headers.map(header => (
                            <td key={header} className="px-2 py-1 truncate max-w-[150px]" title={row[header]}>
                              {row[header] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                  data-testid="checkbox-skip-duplicates"
                />
                <label htmlFor="skipDuplicates" className="text-sm">
                  Skip duplicates (matching email or phone)
                </label>
              </div>

              {!Object.values(columnMapping).includes("name") && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Name field must be mapped to continue
                </div>
              )}
              {!Object.values(columnMapping).includes("phone") && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Phone field must be mapped to continue
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} data-testid="button-import-cancel">
                  Cancel
                </Button>
                <Button
                  onClick={handleImportExecute}
                  disabled={isImporting || !Object.values(columnMapping).includes("name") || !Object.values(columnMapping).includes("phone")}
                  data-testid="button-execute-import"
                >
                  {isImporting ? "Importing..." : `Import ${importParseResult.totalRows} Contacts`}
                </Button>
              </div>
            </div>
          )}

          {importStep === "result" && importResult && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
                <p className="text-muted-foreground">
                  Successfully imported {importResult.imported} contact{importResult.imported !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped (Duplicates)</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{importResult.totalErrors}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {importResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {importResult.totalErrors > importResult.errors.length && (
                      <li className="text-muted-foreground">...and {importResult.totalErrors - importResult.errors.length} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsImportDialogOpen(false)} data-testid="button-close-import">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Postcode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Portal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description={searchQuery ? "Try adjusting your search" : "Add your first client contact to get started"}
          action={!searchQuery ? { label: "Add Contact", onClick: openCreateDialog } : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Postcode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Portal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => {
                  const portalAccess = portalAccessMap[contact.id];
                  const hasPortalAccess = portalAccess && portalAccess.isActive;

                  return (
                    <tr key={contact.id} className="border-b border-border last:border-0 hover-elevate" data-testid={`contact-row-${contact.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm">{contact.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {contact.email ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {contact.postcode ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {contact.postcode}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {portalAccess?.portalToken ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={portalAccess.isActive ? "secondary" : "outline"}
                              className="gap-1"
                              data-testid={`badge-portal-access-${contact.id}`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              {portalAccess.isActive ? "Active" : "Pending"}
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyPortalLink(portalAccess.portalToken!, !portalAccess.isActive)}
                                  data-testid={`button-copy-portal-link-${contact.id}`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{portalAccess.isActive ? "Copy portal link" : "Copy invite link"}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openPortalAsClient(portalAccess.portalToken!, !portalAccess.isActive)}
                                  data-testid={`button-open-portal-${contact.id}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{portalAccess.isActive ? "View portal as client" : "Open invite page"}</p>
                              </TooltipContent>
                            </Tooltip>
                            {portalAccess.isActive && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setResetPasswordContact(contact)}
                                    data-testid={`button-reset-password-${contact.id}`}
                                  >
                                    <KeyRound className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset Password</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : hasPortalAccess ? (
                          <Badge variant="secondary" className="gap-1" data-testid={`badge-portal-access-${contact.id}`}>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : contact.email ? (
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => inviteMutation.mutate({ contactId: contact.id, sendEmail: true })}
                                  disabled={inviteMutation.isPending}
                                  className="gap-1"
                                  data-testid={`button-invite-portal-${contact.id}`}
                                >
                                  <Mail className="w-3 h-3" />
                                  Email Invite
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send portal invite email to {contact.email}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => inviteMutation.mutate({ contactId: contact.id, sendEmail: false })}
                                  disabled={inviteMutation.isPending}
                                  data-testid={`button-invite-link-${contact.id}`}
                                >
                                  <UserPlus className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Create invite link only (no email)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No email</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <SendMessageDialog
                            recipientId={contact.id}
                            recipientName={contact.name}
                            recipientType="client"
                            trigger={
                              <Button variant="ghost" size="icon" data-testid={`button-message-contact-${contact.id}`}>
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(contact)}
                            data-testid={`button-edit-contact-${contact.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setContactToDelete(contact)}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!contactToDelete} onOpenChange={(open) => {
        if (!open) {
          setContactToDelete(null);
          setDeletePassword("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Delete Contact?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold mb-1">Warning: Irreversible Action</p>
              <p>
                You are about to delete <strong>{contactToDelete?.name}</strong>.
                This will permanently remove the contact and <strong>ALL associated data</strong>, including:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Jobs and Projects</li>
                <li>Invoices and Quotes</li>
                <li>Notes and Files</li>
                <li>Portal Access</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deletePassword">Enter Admin Password to Confirm</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Admin password"
                autoComplete="new-password"
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setContactToDelete(null);
                  setDeletePassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (contactToDelete) {
                    deleteMutation.mutate({ id: contactToDelete.id, password: deletePassword });
                  }
                }}
                disabled={!deletePassword || deleteMutation.isPending}
                className="gap-2"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordContact} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordContact(null);
          setNewPassword("");
          setShowPassword(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Client Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{resetPasswordContact?.name}</strong>. They can use this password to log in to the client portal.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  data-testid="input-client-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-sm text-destructive">Password must be at least 6 characters</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordContact(null);
                  setNewPassword("");
                  setShowPassword(false);
                }}
                data-testid="button-cancel-reset-password"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (resetPasswordContact && newPassword.length >= 6) {
                    resetPasswordMutation.mutate({ contactId: resetPasswordContact.id, password: newPassword });
                  }
                }}
                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
