import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface EmployeeUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accessLevel: "owner" | "full_access" | "standard";
  role: string | "admin" | "accounting" | "fitting" | "sales";
  isActive: boolean;
}

interface AuthData {
  user: AuthUser | null;
  employee: EmployeeUser | null;
  authType: "replit" | "employee" | null;
}

interface AuthError {
  message: string;
  authenticated?: boolean;
  authorized?: boolean;
}

async function fetchAuthStatus(): Promise<AuthData | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  // Handle 403 - authenticated but not authorized
  if (response.status === 403) {
    const error: AuthError = await response.json();
    // Return a special object indicating user is authenticated but not authorized
    throw new Error(error.message || "Access denied");
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function performLogout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: authData, isLoading, refetch } = useQuery<AuthData | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchAuthStatus,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: performLogout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      setLocation("/landing");
    },
  });

  const isAuthenticated = !!authData?.authType;
  const hasAdminAccess = isAuthenticated && (
    authData?.authType === "replit" ||
    (authData?.employee?.accessLevel === "owner" ||
      authData?.employee?.accessLevel === "full_access" ||
      authData?.employee?.role === "admin")
  );

  return {
    user: authData?.user || null,
    employee: authData?.employee || null,
    authType: authData?.authType || null,
    isLoading,
    isAuthenticated,
    hasAdminAccess,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    refetch,
  };
}

export function useRequireAuth(redirectTo: string = "/landing") {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  if (!auth.isLoading && !auth.isAuthenticated) {
    setLocation(redirectTo);
  }

  return auth;
}

export function useRequireAdminAuth() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  if (!auth.isLoading) {
    if (!auth.isAuthenticated) {
      setLocation("/landing");
    } else if (!auth.hasAdminAccess) {
      setLocation("/employee-portal/home");
    }
  }

  return auth;
}
