import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { Loader2, CheckCircle, XCircle, Wrench } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type InviteStatus = "loading" | "accepting" | "success" | "error" | "expired" | "used";

export default function PartnerPortalInvite() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [partnerName, setPartnerName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { setToken } = usePartnerPortalAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invite link");
      return;
    }

    const processInvite = async () => {
      try {
        const inviteResponse = await fetch(`/api/partner-portal/invite/${token}`);
        
        if (inviteResponse.status === 404) {
          setStatus("error");
          setErrorMessage("This invite link is not valid.");
          return;
        }
        
        if (inviteResponse.status === 410) {
          const data = await inviteResponse.json();
          if (data.message?.includes("expired")) {
            setStatus("expired");
            setErrorMessage("This invite has expired. Please contact the admin for a new invite.");
          } else {
            setStatus("used");
            setErrorMessage("This invite has already been used. If you need access, please contact the admin.");
          }
          return;
        }

        if (!inviteResponse.ok) {
          setStatus("error");
          setErrorMessage("Failed to load invite details.");
          return;
        }

        const { partner } = await inviteResponse.json();
        setPartnerName(partner?.businessName || "Partner");
        setStatus("accepting");

        const acceptResponse = await apiRequest("POST", `/api/partner-portal/invite/${token}/accept`);
        const { token: accessToken } = await acceptResponse.json();

        if (accessToken) {
          setToken(accessToken);
          setStatus("success");
          
          toast({
            title: "Welcome to the Partner Portal!",
            description: "You now have access to view your assigned jobs.",
          });

          setTimeout(() => {
            setLocation("/partner-portal/jobs");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage("Failed to activate your portal access.");
        }
      } catch (error) {
        console.error("Invite processing error:", error);
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again or contact the admin.");
      }
    };

    processInvite();
  }, [token, setToken, toast, setLocation]);

  const handleRetry = () => {
    setStatus("loading");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {(status === "loading" || status === "accepting") && (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2" data-testid="text-invite-status">
                {status === "loading" ? "Loading invite..." : "Activating your access..."}
              </h2>
              <p className="text-muted-foreground text-center">
                Please wait while we set up your portal access.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2" data-testid="text-invite-success">
                Welcome, {partnerName}!
              </h2>
              <p className="text-muted-foreground text-center">
                Redirecting you to your jobs...
              </p>
            </>
          )}

          {(status === "error" || status === "expired" || status === "used") && (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2" data-testid="text-invite-error">
                {status === "expired" ? "Invite Expired" : status === "used" ? "Invite Already Used" : "Something Went Wrong"}
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                {errorMessage}
              </p>
              <Button onClick={handleRetry} variant="outline" data-testid="button-retry-invite">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
