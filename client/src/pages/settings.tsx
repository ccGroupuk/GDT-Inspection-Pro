import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Save, ExternalLink } from "lucide-react";
import type { CompanySetting } from "@shared/schema";

interface ReviewUrlSettings {
  facebook_review_url: string;
  google_review_url: string;
  trustpilot_review_url: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ReviewUrlSettings>({
    facebook_review_url: "",
    google_review_url: "",
    trustpilot_review_url: "",
  });

  const { data: settings = [], isLoading } = useQuery<CompanySetting[]>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings.length > 0) {
      const newData = { ...formData };
      settings.forEach((setting) => {
        if (setting.settingKey in newData) {
          newData[setting.settingKey as keyof ReviewUrlSettings] = setting.settingValue || "";
        }
      });
      setFormData(newData);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(formData).map(([key, value]) =>
        apiRequest("POST", "/api/settings", {
          settingKey: key,
          settingValue: value,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Review URLs have been updated successfully.",
      });
    },
    onError: (error: Error) => {
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

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review URLs</CardTitle>
            <CardDescription>
              Configure the URLs where clients can leave reviews for your business.
              These links will be displayed in the client portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || isLoading}
                  className="gap-2"
                  data-testid="button-save-settings"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
