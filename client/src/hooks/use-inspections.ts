import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertInspection, type Inspection } from "@shared/schema";
import { getInspections, saveInspection } from "@/lib/local-storage";
import { useAuth } from "./use-auth";
import { useToast } from "@/hooks/use-toast";

export function useInspections() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch Inspections (List)
    const { data: inspections = [], isLoading } = useQuery<Inspection[]>({
        queryKey: ["inspections", user?.id],
        queryFn: async () => {
            if (!user || (user as any).isGuest) {
                // Guest: specific local storage read
                const local = getInspections();
                // Map local format to schema format roughly to satisfy type
                return local.map(i => ({
                    ...i,
                    id: i.id as any, // Cast ID to any to bypass number check
                    createdAt: new Date(i.timestamp),
                    date: new Date(i.timestamp), // Map timestamp to date
                    engineerId: 0,
                    clientName: i.title.split(' - ')[0] || "Unknown Client", // Heuristic
                })) as unknown as Inspection[];
            }

            const res = await fetch("/api/inspections");
            if (!res.ok) throw new Error("Failed to fetch inspections");
            return res.json();
        },
    });

    // Create Inspection
    const createMutation = useMutation({
        mutationFn: async (data: InsertInspection) => {
            if (!user || (user as any).isGuest) {
                // Guest: Save to local storage
                const id = Math.random().toString(36).substring(2, 9);
                const localData = {
                    ...data,
                    id,
                    timestamp: Date.now(),
                    title: `${data.clientName} - ${data.address}`,
                    templateId: 'default', // Fallback
                    data: data.data || {}
                };
                saveInspection(localData as any);
                return localData as unknown as Inspection;
            }

            const res = await fetch("/api/inspections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create inspection");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspections"] });
            toast({ title: "Inspection Created", description: "Successfully saved." });
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        },
    });

    return {
        inspections,
        isLoading,
        createMutation,
    };
}
