import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { Building2, LogIn, Loader2 } from "lucide-react";

export default function PortalLogin() {
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setToken } = usePortalAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter your access token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/portal/profile", {
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
        },
      });

      if (response.ok) {
        setToken(accessToken.trim());
        toast({
          title: "Welcome!",
          description: "You have successfully logged in.",
        });
        setLocation("/portal/jobs");
      } else {
        toast({
          title: "Invalid Token",
          description: "The access token you entered is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold" data-testid="text-login-title">
            Client Portal
          </CardTitle>
          <CardDescription>
            Enter your access token to view your jobs and project progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="text"
                placeholder="Enter your access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                data-testid="input-access-token"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Access Portal
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
