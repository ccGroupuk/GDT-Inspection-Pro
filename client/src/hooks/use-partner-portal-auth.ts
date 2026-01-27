import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const PARTNER_PORTAL_TOKEN_KEY = "partnerPortalToken";

export function usePartnerPortalAuth() {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(PARTNER_PORTAL_TOKEN_KEY);
    }
    return null;
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem(PARTNER_PORTAL_TOKEN_KEY);
    if (storedToken !== token) {
      setTokenState(storedToken);
    }
  }, [token]);

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(PARTNER_PORTAL_TOKEN_KEY, newToken);
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(PARTNER_PORTAL_TOKEN_KEY);
    setTokenState(null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setLocation("/partner-portal/login");
  }, [clearToken, setLocation]);

  const getAuthHeaders = useCallback(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  return {
    token,
    isAuthenticated: !!token,
    setToken,
    clearToken,
    logout,
    getAuthHeaders,
  };
}

export async function partnerPortalApiRequest(
  method: string,
  url: string,
  token: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return res;
}
