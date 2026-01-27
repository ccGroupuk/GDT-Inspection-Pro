import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Filter } from "lucide-react";
import { Link } from "wouter";
import MapWidget from "@/components/map/MapWidget";
import type { Job, EmployeeLocation } from "@shared/schema";

export default function MapView() {
    const [statusFilter, setStatusFilter] = useState<string>("active");

    // Fetch data
    const { data, refetch: refetchJobs } = useQuery<{ jobs: Job[] }>({
        queryKey: ["/api/jobs"],
    });
    const jobs = data?.jobs || [];

    const { data: staffLocations = [], refetch: refetchStaff } = useQuery<EmployeeLocation[]>({
        queryKey: ["/api/staff-locations"],
        // Mock data for now since endpoint might not exist yet
        initialData: [],
    });

    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        if (!job.latitude || !job.longitude) return false;

        if (statusFilter === "active") {
            return !["closed", "lost", "paid", "completed"].includes(job.status);
        }
        return true;
    });

    const handleRefresh = () => {
        refetchJobs();
        refetchStaff();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background z-10">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold">Operations Map</h1>
                        <p className="text-xs text-muted-foreground">
                            {filteredJobs.length} jobs • {staffLocations.length} active staff
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active Jobs</SelectItem>
                            <SelectItem value="all">All Jobs</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <MapWidget
                    jobs={filteredJobs}
                    staffLocations={staffLocations}
                    height="100%"
                />

                {/* Floating Legend */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border z-[1000] text-sm">
                    <div className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Legend</div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Job Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Staff Member</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
