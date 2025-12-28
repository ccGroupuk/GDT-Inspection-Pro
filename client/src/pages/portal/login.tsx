import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { Building2, LogIn, Loader2, Key, Mail } from "lucide-react";

export default function PortalLogin() {
  const [accessToken, setAccessToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleTokenSubmit = async (e: React.FormEvent) => {
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        toast({
          title: "Welcome!",
          description: "You have successfully logged in.",
        });
        setLocation("/portal/jobs");
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
            Sign in to view your jobs and project progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" data-testid="tab-client-password-login">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="token" data-testid="tab-client-token-login">
                <Key className="w-4 h-4 mr-2" />
                Access Token
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-client-email"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-client-password"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-client-password-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Password login requires you to have set a password in your portal settings.
                </p>
              </form>
            </TabsContent>
            <TabsContent value="token" className="mt-4">
              <form onSubmit={handleTokenSubmit} className="space-y-4">
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
                <p className="text-xs text-muted-foreground text-center">
                  You can find your access token in the invite email sent to you.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
