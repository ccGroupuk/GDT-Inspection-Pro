import { QueryClient, QueryFunction } from "@tanstack/react-query";

export async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined,
): Promise<Response> {
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || res.statusText);
    }

    return res;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
