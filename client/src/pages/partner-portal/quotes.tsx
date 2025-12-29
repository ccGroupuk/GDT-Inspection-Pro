import { useEffect, useState } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Briefcase, LogOut, Loader2, Calendar, HelpCircle, Settings, 
  ClipboardCheck, FileText, Plus, Trash2, Save, Send, ArrowLeft, Siren
} from "lucide-react";
import type { PartnerQuote, PartnerQuoteItem, Job } from "@shared/schema";

type QuoteWithDetails = PartnerQuote & { 
  items: PartnerQuoteItem[];
  job?: Job;
};

interface QuoteLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

function getQuoteStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "submitted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "declined":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

export default function PartnerPortalQuotes() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(searchString);
  const surveyId = searchParams.get('surveyId');
  const jobId = searchParams.get('jobId');
  const isNewQuote = location.includes('/quotes/new');

  const [editMode, setEditMode] = useState(isNewQuote);
  const [items, setItems] = useState<QuoteLineItem[]>([{ description: "", quantity: "1", unitPrice: "0" }]);
  const [notes, setNotes] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState("20");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: quotes, isLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/partner-portal/quotes"],
    enabled: isAuthenticated && !isNewQuote,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/quotes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load quotes");
      return res.json();
    },
  });

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

  const { data: job } = useQuery<Job>({
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

  const createQuoteMutation = useMutation({
    mutationFn: async (data: { jobId: string; surveyId?: string; items: QuoteLineItem[]; notes: string; taxEnabled: boolean; taxRate: string }) => {
      const res = await fetch("/api/partner-portal/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create quote");
      return res.json();
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/quotes"] });
      toast({ title: "Quote created" });
      setLocation("/partner-portal/quotes");
    },
    onError: () => {
      toast({ title: "Error creating quote", variant: "destructive" });
    },
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/partner-portal/quotes/${quoteId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to submit quote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/quotes"] });
      toast({ title: "Quote submitted for review" });
    },
    onError: () => {
      toast({ title: "Error submitting quote", variant: "destructive" });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/partner-portal/quotes/${quoteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete quote");
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/quotes"] });
      toast({ title: "Quote deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting quote", variant: "destructive" });
    },
  });

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unitPrice: "0" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteLineItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    if (!taxEnabled) return 0;
    return calculateSubtotal() * (parseFloat(taxRate) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSaveQuote = () => {
    const validItems = items.filter(item => item.description.trim() && parseFloat(item.unitPrice) > 0);
    if (validItems.length === 0) {
      toast({ title: "Please add at least one line item with a description and price", variant: "destructive" });
      return;
    }
    if (!jobId) {
      toast({ title: "No job selected", variant: "destructive" });
      return;
    }
    createQuoteMutation.mutate({
      jobId,
      surveyId: surveyId || undefined,
      items: validItems,
      notes,
      taxEnabled,
      taxRate,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isNewQuote) {
    if (!jobId) {
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
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} data-testid="button-partner-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            <Link href="/partner-portal/surveys">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Surveys
              </Button>
            </Link>
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Job Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please complete a survey first, then you can create a quote from the survey completion page.
                </p>
                <Link href="/partner-portal/surveys">
                  <Button variant="outline">
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    View Surveys
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }
    
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
          <div className="mb-6">
            <Link href="/partner-portal/quotes">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quotes
              </Button>
            </Link>
            <h2 className="text-2xl font-semibold mb-1">Create Quote</h2>
            {job && (
              <p className="text-muted-foreground">
                For job: {job.jobNumber} - {job.serviceType}
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Line Items</Label>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      {index === 0 && <Label className="text-xs text-muted-foreground mb-1">Description</Label>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        data-testid={`input-item-description-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && <Label className="text-xs text-muted-foreground mb-1">Qty</Label>}
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        data-testid={`input-item-quantity-${index}`}
                      />
                    </div>
                    <div className="col-span-3">
                      {index === 0 && <Label className="text-xs text-muted-foreground mb-1">Unit Price</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        data-testid={`input-item-price-${index}`}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="tax-enabled" className="text-sm">Add VAT/Tax</Label>
                  <Switch
                    id="tax-enabled"
                    checked={taxEnabled}
                    onCheckedChange={setTaxEnabled}
                    data-testid="switch-tax-enabled"
                  />
                </div>
                {taxEnabled && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Tax Rate:</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-20"
                      data-testid="input-tax-rate"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2 text-right">
                  <p className="text-sm text-muted-foreground">
                    Subtotal: <span className="font-medium text-foreground">{calculateSubtotal().toFixed(2)}</span>
                  </p>
                  {taxEnabled && (
                    <p className="text-sm text-muted-foreground">
                      VAT ({taxRate}%): <span className="font-medium text-foreground">{calculateTax().toFixed(2)}</span>
                    </p>
                  )}
                  <p className="text-lg font-semibold">
                    Total: {calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes, terms, or conditions..."
                  className="min-h-[100px]"
                  data-testid="textarea-quote-notes"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleSaveQuote}
                  disabled={createQuoteMutation.isPending}
                  data-testid="button-save-quote"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createQuoteMutation.isPending ? "Saving..." : "Save as Draft"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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

      <nav className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Link href="/partner-portal">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-jobs"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs
              </Button>
            </Link>
            <Link href="/partner-portal/surveys">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-surveys"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Surveys
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-foreground"
              data-testid="nav-quotes"
            >
              <FileText className="w-4 h-4 mr-2" />
              Quotes
            </Button>
            <Link href="/partner-portal/calendar">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-calendar"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/partner-portal/emergency-callouts">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-emergency"
              >
                <Siren className="w-4 h-4 mr-2" />
                Emergency
              </Button>
            </Link>
            <Link href="/partner-portal/help">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-help"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </Link>
            <Link href="/partner-portal/profile">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-profile"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">Your Quotes</h2>
          <p className="text-muted-foreground">
            Create and manage quotes for your survey work
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !quotes || quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Quotes</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any quotes yet. Complete a survey to create a quote.
              </p>
              <Link href="/partner-portal/surveys">
                <Button variant="outline">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  View Surveys
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} data-testid={`card-quote-${quote.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{quote.job?.jobNumber || "Unknown Job"}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quote.job?.serviceType}
                      </p>
                    </div>
                    <Badge className={getQuoteStatusColor(quote.status)}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Subtotal:</span> {parseFloat(quote.subtotal || "0").toFixed(2)}
                    </p>
                    {quote.taxEnabled && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">VAT ({quote.taxRate}%):</span> {parseFloat(quote.taxAmount || "0").toFixed(2)}
                      </p>
                    )}
                    <p className="font-medium">
                      Total: {parseFloat(quote.total || "0").toFixed(2)}
                    </p>
                  </div>
                  
                  {quote.items && quote.items.length > 0 && (
                    <div className="border-t pt-3 mb-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        Items ({quote.items.length})
                      </p>
                      <div className="space-y-1">
                        {quote.items.slice(0, 3).map((item, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {item.quantity} x {item.description}
                          </p>
                        ))}
                        {quote.items.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{quote.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {quote.status === "draft" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => submitQuoteMutation.mutate(quote.id)}
                          disabled={submitQuoteMutation.isPending}
                          data-testid={`button-submit-quote-${quote.id}`}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => deleteQuoteMutation.mutate(quote.id)}
                          disabled={deleteQuoteMutation.isPending}
                          data-testid={`button-delete-quote-${quote.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    {quote.status === "submitted" && (
                      <Badge variant="secondary">Awaiting Review</Badge>
                    )}
                    {quote.status === "accepted" && (
                      <Badge variant="default" className="bg-green-600">Accepted by Admin</Badge>
                    )}
                    {quote.status === "declined" && (
                      <Badge variant="destructive">Declined</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
