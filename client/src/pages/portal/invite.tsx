import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { Building2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteResponse {
  invite: {
    id: string;
    contactId: string;
    email: string;
    expiresAt: string;
  };
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export default function PortalInvite() {
  const [, params] = useRoute("/portal/invite/:token");
  const token = params?.token || "";
  const [isAccepting, setIsAccepting] = useState(false);
  const { setToken } = usePortalAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: inviteData, isLoading, error } = useQuery<InviteResponse>({
    queryKey: ["/api/portal/invite", token],
    queryFn: async () => {
      const response = await fetch(`/api/portal/invite/${token}`);
      if (!response.ok) {
        throw new Error("Invalid or expired invite");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/portal/invite/${token}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        toast({
          title: "Welcome!",
          description: "Your portal access has been activated.",
        });
        setLocation("/portal/jobs");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.message || "Failed to accept invite. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold" data-testid="text-invite-error">
              Invalid Invite
            </CardTitle>
            <CardDescription>
              This invite link is invalid or has expired. Please contact us for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/portal/login")}
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
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
          <CardTitle className="text-2xl font-semibold" data-testid="text-invite-title">
            Welcome, {inviteData.contact.name}!
          </CardTitle>
          <CardDescription>
            You've been invited to access the CCC Group Client Portal to track your jobs and project progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Invite sent to</p>
            <p className="font-medium" data-testid="text-invite-email">{inviteData.invite.email}</p>
          </div>
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
            data-testid="button-accept-invite"
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Access Portal
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
