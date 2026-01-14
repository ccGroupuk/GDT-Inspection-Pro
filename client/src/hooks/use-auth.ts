import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertEngineer, type Engineer } from "@shared/schema";
import { getSettings } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: user, error, isLoading } = useQuery<Engineer | null>({
        queryKey: ["/api/user"],
        queryFn: async () => {
            const res = await fetch("/api/user");
            if (!res.ok) {
                if (res.status === 401) return null;
                throw new Error("Failed to fetch user");
            }
            return res.json();
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: Pick<InsertEngineer, "username" | "password">) => {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Login failed");
            }
            return res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({ title: "Welcome back!", description: `Logged in as ${user.username}` });
        },
        onError: (error: Error) => {
            toast({ variant: "destructive", title: "Login failed", description: error.message });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (credentials: InsertEngineer) => {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Registration failed");
            }
            return res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({ title: "Welcome!", description: "Account created successfully" });
        },
        onError: (error: Error) => {
            toast({ variant: "destructive", title: "Registration failed", description: error.message });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/logout", { method: "POST" });
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({ title: "Goodbye!", description: "You have been logged out" });
        },
        onError: (error: Error) => {
            toast({ variant: "destructive", title: "Logout failed", description: error.message });
        },
    });


    const loginAsGuestMutation = useMutation({
        mutationFn: async () => {
            // Simulate a "network request"
            return new Promise<Engineer & { isGuest: boolean }>((resolve) => {
                setTimeout(() => {
                    resolve({
                        id: -1,
                        username: "guest",
                        name: "Guest Engineer",
                        password: "",
                        role: "engineer",
                        createdAt: new Date(),
                        isGuest: true
                    });
                }, 500);
            });
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({ title: "Guest Mode", description: "You are now using offline mode." });
        },
    });

    return {
        user,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
        loginAsGuestMutation
    };
}
