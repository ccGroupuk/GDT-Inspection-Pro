import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Plus, Search, Users, Phone, Mail, MapPin, Edit, Trash2, UserPlus, CheckCircle, Copy, ExternalLink } from "lucide-react";
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

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

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
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contact deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting contact", variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiRequest("POST", `/api/contacts/${contactId}/invite`);
      return response.json();
    },
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/portal/invite/${data.inviteToken}`;
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Invitation sent",
        description: `Invite link: ${inviteUrl}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-semibold">Contacts</h1>
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
                        </div>
                      ) : hasPortalAccess ? (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-portal-access-${contact.id}`}>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : contact.email ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => inviteMutation.mutate(contact.id)}
                              disabled={inviteMutation.isPending}
                              className="gap-1"
                              data-testid={`button-invite-portal-${contact.id}`}
                            >
                              <UserPlus className="w-3 h-3" />
                              Invite
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send portal invite to {contact.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">No email</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          onClick={() => {
                            if (confirm("Delete this contact?")) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
