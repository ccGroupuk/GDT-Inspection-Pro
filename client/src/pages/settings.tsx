import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Save, ExternalLink, CreditCard, Building } from "lucide-react";
import type { CompanySetting } from "@shared/schema";

interface SettingsFormData {
  facebook_review_url: string;
  google_review_url: string;
  trustpilot_review_url: string;
  payment_bank_name: string;
  payment_account_name: string;
  payment_sort_code: string;
  payment_account_number: string;
  payment_methods: string;
  payment_notes: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SettingsFormData>({
    facebook_review_url: "",
    google_review_url: "",
    trustpilot_review_url: "",
    payment_bank_name: "",
    payment_account_name: "",
    payment_sort_code: "",
    payment_account_number: "",
    payment_methods: "",
    payment_notes: "",
  });

  const { data: settings = [], isLoading } = useQuery<CompanySetting[]>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings.length > 0) {
      const newData = { ...formData };
      settings.forEach((setting) => {
        if (setting.settingKey in newData) {
          newData[setting.settingKey as keyof SettingsFormData] = setting.settingValue || "";
        }
      });
      setFormData(newData);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        Object.entries(formData).map(async ([key, value]) => {
          const response = await apiRequest("POST", "/api/settings", {
            settingKey: key,
            settingValue: value,
          });
          if (!response.ok) {
            throw new Error(`Failed to save ${key}`);
          }
          return { key, success: true };
        })
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        const failedKeys = failures
          .map((f) => (f as PromiseRejectedResult).reason?.message || "Unknown")
          .join(", ");
        throw new Error(`Some settings failed to save: ${failedKeys}`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "All settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <SettingsIcon className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </div>
            <CardDescription>
              Bank details and payment information displayed on invoices and quotes.
              Clients will see these details when paying deposits or balances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_bank_name">Bank Name</Label>
                <Input
                  id="payment_bank_name"
                  placeholder="e.g., Barclays, Lloyds, NatWest"
                  value={formData.payment_bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_bank_name: e.target.value })
                  }
                  disabled={isLoading}
                  data-testid="input-payment-bank-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_account_name">Account Name</Label>
                <Input
                  id="payment_account_name"
                  placeholder="e.g., CCC Group Ltd"
                  value={formData.payment_account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_account_name: e.target.value })
                  }
                  disabled={isLoading}
                  data-testid="input-payment-account-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_sort_code">Sort Code</Label>
                <Input
                  id="payment_sort_code"
                  placeholder="e.g., 12-34-56"
                  value={formData.payment_sort_code}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_sort_code: e.target.value })
                  }
                  disabled={isLoading}
                  data-testid="input-payment-sort-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_account_number">Account Number</Label>
                <Input
                  id="payment_account_number"
                  placeholder="e.g., 12345678"
                  value={formData.payment_account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_account_number: e.target.value })
                  }
                  disabled={isLoading}
                  data-testid="input-payment-account-number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_methods">Accepted Payment Methods</Label>
              <Input
                id="payment_methods"
                placeholder="e.g., Bank Transfer, Cash, Card"
                value={formData.payment_methods}
                onChange={(e) =>
                  setFormData({ ...formData, payment_methods: e.target.value })
                }
                disabled={isLoading}
                data-testid="input-payment-methods"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Additional Payment Notes</Label>
              <Textarea
                id="payment_notes"
                placeholder="e.g., Please use your invoice number as payment reference"
                value={formData.payment_notes}
                onChange={(e) =>
                  setFormData({ ...formData, payment_notes: e.target.value })
                }
                disabled={isLoading}
                rows={3}
                data-testid="input-payment-notes"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Review URLs</CardTitle>
            </div>
            <CardDescription>
              Configure the URLs where clients can leave reviews for your business.
              These links will be displayed in the client portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_review_url" className="flex items-center gap-2">
                Facebook Review URL
                {formData.facebook_review_url && (
                  <a
                    href={formData.facebook_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </Label>
              <Input
                id="facebook_review_url"
                type="url"
                placeholder="https://www.facebook.com/yourpage/reviews"
                value={formData.facebook_review_url}
                onChange={(e) =>
                  setFormData({ ...formData, facebook_review_url: e.target.value })
                }
                disabled={isLoading}
                data-testid="input-facebook-review-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_review_url" className="flex items-center gap-2">
                Google Review URL
                {formData.google_review_url && (
                  <a
                    href={formData.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </Label>
              <Input
                id="google_review_url"
                type="url"
                placeholder="https://g.page/r/yourbusiness/review"
                value={formData.google_review_url}
                onChange={(e) =>
                  setFormData({ ...formData, google_review_url: e.target.value })
                }
                disabled={isLoading}
                data-testid="input-google-review-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trustpilot_review_url" className="flex items-center gap-2">
                Trustpilot Review URL
                {formData.trustpilot_review_url && (
                  <a
                    href={formData.trustpilot_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </Label>
              <Input
                id="trustpilot_review_url"
                type="url"
                placeholder="https://www.trustpilot.com/review/yourbusiness.com"
                value={formData.trustpilot_review_url}
                onChange={(e) =>
                  setFormData({ ...formData, trustpilot_review_url: e.target.value })
                }
                disabled={isLoading}
                data-testid="input-trustpilot-review-url"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saveMutation.isPending || isLoading}
            className="gap-2"
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
