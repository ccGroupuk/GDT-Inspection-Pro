import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface UseTabNotificationOptions {
  portalType: "client" | "partner";
  accessToken: string | null;
}

export function useTabNotification({ 
  portalType, 
  accessToken
}: UseTabNotificationOptions) {
  const apiBase = portalType === "client" ? "/api/portal" : "/api/partner-portal";
  const portalTitle = portalType === "client" ? "CCC Client Portal" : "CCC Partner Portal";
  const previousTitleRef = useRef<string | null>(null);

  const { data: messages = [] } = useQuery<Array<{ id: string }>>({
    queryKey: [apiBase, "messages", "count"],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await fetch(`${apiBase}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  const unreadCount = messages.length;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title;
    }

    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${portalTitle}`;
    } else {
      document.title = portalTitle;
    }

    return () => {
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
      }
    };
  }, [unreadCount, portalTitle, accessToken]);

  return { unreadCount };
}
