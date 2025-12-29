import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  X,
  Send,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { Job, Contact, TradePartner, QuoteItem, JobNote, JobNoteAttachment } from "@shared/schema";

interface JobNoteWithAttachments extends JobNote {
  attachments: JobNoteAttachment[];
}

interface JobHubData {
  job: Job;
  contact: Contact | null;
  partner: TradePartner | null;
  partyType: "client" | "partner" | "employee";
  notes: JobNoteWithAttachments[];
  quoteItems: QuoteItem[];
  quoteTotals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  } | null;
}

export default function JobHub() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");

  const { data, isLoading, error } = useQuery<JobHubData>({
    queryKey: ["/api/job-hub", token],
    queryFn: async () => {
      const response = await fetch(`/api/job-hub/${token}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to access job hub");
      }
      return response.json();
    },
    enabled: Boolean(token),
    retry: false,
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/job-hub/${token}/accept-quote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-hub", token] });
      toast({ title: "Quote accepted successfully!" });
    },
    onError: () => {
      toast({ title: "Error accepting quote", variant: "destructive" });
    },
  });

  const declineQuoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/job-hub/${token}/decline-quote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-hub", token] });
      toast({ title: "Quote declined" });
    },
    onError: () => {
      toast({ title: "Error declining quote", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/job-hub/${token}/message`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-hub", token] });
      toast({ title: "Message sent" });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Error sending message", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "This link is invalid, expired, or has been revoked."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { job, contact, partner, partyType, notes, quoteItems, quoteTotals } = data;

  const getPartyLabel = () => {
    switch (partyType) {
      case "client": return "Client Portal";
      case "partner": return "Partner Portal";
      case "employee": return "Employee Access";
      default: return "Job Hub";
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">CCC Group</h1>
              <p className="text-sm text-muted-foreground">{getPartyLabel()}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {partyType.charAt(0).toUpperCase() + partyType.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {job.serviceType}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: #{job.jobNumber}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {getStageLabel(job.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.jobAddress && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>{job.jobAddress}</span>
              </div>
            )}
            {job.description && (
              <div className="pt-2 border-t">
                <p className="text-sm">{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">
              <FileText className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="quote" data-testid="tab-quote">
              <Clock className="w-4 h-4 mr-2" />
              Quote
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {partyType === "client" && contact && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{contact.name}</p>
                  {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                  {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                </CardContent>
              </Card>
            )}

            {partyType === "partner" && partner && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Partner Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{partner.businessName}</p>
                  {partner.tradeCategory && (
                    <Badge variant="outline" className="mt-1">{partner.tradeCategory}</Badge>
                  )}
                  {job.partnerStatus && (
                    <div className="mt-2">
                      <Badge variant="secondary">
                        Status: {job.partnerStatus.charAt(0).toUpperCase() + job.partnerStatus.slice(1).replace("_", " ")}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Job Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes available.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-md bg-muted/50">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                        </p>
                        {note.attachments && note.attachments.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {note.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                {attachment.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Label>Send a Message</Label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    data-testid="input-message"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => sendMessageMutation.mutate(newMessage)}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quote" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quote Details</CardTitle>
              </CardHeader>
              <CardContent>
                {quoteItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quote available yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {quoteItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-4 py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} x £{parseFloat(item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            £{parseFloat(item.lineTotal).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {quoteTotals && (
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>£{quoteTotals.subtotal.toFixed(2)}</span>
                        </div>
                        {quoteTotals.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-£{quoteTotals.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {quoteTotals.taxAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>VAT</span>
                            <span>£{quoteTotals.taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>£{quoteTotals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {partyType === "client" && (!job.quoteResponse || job.quoteResponse === "pending") && (
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => acceptQuoteMutation.mutate()}
                          disabled={acceptQuoteMutation.isPending}
                          className="flex-1"
                          data-testid="button-accept-quote"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Quote
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => declineQuoteMutation.mutate()}
                          disabled={declineQuoteMutation.isPending}
                          className="flex-1"
                          data-testid="button-decline-quote"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {job.quoteResponse === "accepted" && (
                      <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 rounded-md">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Quote Accepted
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-8 py-4 text-center text-sm text-muted-foreground">
        Cardiff & Caerphilly Carpentry - CCC Group
      </footer>
    </div>
  );
}
