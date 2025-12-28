import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Megaphone, Gift, Tag, MessageSquare, X, Bell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PortalMessage = {
  id: string;
  title: string;
  body: string;
  messageType: string;
  urgency: string;
  createdAt: string;
};

const messageTypeIcons: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-5 h-5" />,
  announcement: <Megaphone className="w-5 h-5" />,
  birthday: <Gift className="w-5 h-5" />,
  sales: <Tag className="w-5 h-5" />,
  custom: <MessageSquare className="w-5 h-5" />,
};

const urgencyStyles: Record<string, string> = {
  high: "border-destructive/50 bg-destructive/5",
  normal: "border-primary/20 bg-primary/5",
  low: "border-muted-foreground/20",
};

const urgencyIconStyles: Record<string, string> = {
  high: "text-destructive",
  normal: "text-primary",
  low: "text-muted-foreground",
};

interface PortalMessagesDisplayProps {
  portalType: "client" | "partner";
  accessToken: string;
}

export function PortalMessagesDisplay({ portalType, accessToken }: PortalMessagesDisplayProps) {
  const apiBase = portalType === "client" ? "/api/portal" : "/api/partner-portal";

  // Don't attempt to load if no valid token
  if (!accessToken) {
    return null;
  }

  const { data: messages = [], isLoading } = useQuery<PortalMessage[]>({
    queryKey: [apiBase, "messages"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!accessToken,
  });

  const dismissMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`${apiBase}/messages/${messageId}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to dismiss message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, "messages"] });
    },
  });

  if (isLoading || messages.length === 0) return null;

  return (
    <div className="space-y-3 mb-6" data-testid="portal-messages-section">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Messages from CCC Group</span>
        <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
      </div>
      
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`relative ${urgencyStyles[message.urgency] || urgencyStyles.normal}`}
          data-testid={`portal-message-${message.id}`}
        >
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className={`shrink-0 ${urgencyIconStyles[message.urgency] || urgencyIconStyles.normal}`}>
                {messageTypeIcons[message.messageType] || messageTypeIcons.custom}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm">{message.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -mt-1 -mr-1"
                    onClick={() => dismissMutation.mutate(message.id)}
                    disabled={dismissMutation.isPending}
                    data-testid={`button-dismiss-message-${message.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{message.body}</p>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {new Date(message.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
