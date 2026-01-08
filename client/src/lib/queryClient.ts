import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  try {
    const employeeToken = localStorage.getItem("employeeToken");
    if (employeeToken) {
      headers["Authorization"] = `Bearer ${employeeToken}`;
    }
  } catch (e) {
    // Ignore localStorage access errors (e.g. SecurityError in private mode/iframe)
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 10000, // Auto-refresh every 10 seconds
      refetchOnWindowFocus: true,
      staleTime: 5000, // Consider data stale after 5 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
