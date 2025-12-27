import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
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
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(false);
  const { setToken } = usePortalAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const authenticate = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/portal/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setToken(token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlToken = params.get("token");
    
    if (urlToken) {
      setIsAutoAuthenticating(true);
      authenticate(urlToken).then((success) => {
        if (success) {
          toast({
            title: "Welcome!",
            description: "You have successfully logged in.",
          });
          setLocation("/portal/jobs");
        } else {
          setIsAutoAuthenticating(false);
          toast({
            title: "Invalid Token",
            description: "The access token is not valid or has expired.",
            variant: "destructive",
          });
        }
      });
    }
  }, [searchString]);

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

    const success = await authenticate(accessToken.trim());
    
    if (success) {
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
    
    setIsLoading(false);
  };

  if (isAutoAuthenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
