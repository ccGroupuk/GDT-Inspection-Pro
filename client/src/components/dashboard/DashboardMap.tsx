import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MapWidget from "@/components/map/MapWidget";
import { useQuery } from "@tanstack/react-query";
import type { Job } from "@shared/schema";
import { Map as MapIcon, Maximize2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardMap() {
    // Fetch active jobs
    const { data } = useQuery<{ jobs: Job[] }>({
        queryKey: ["/api/jobs"],
    });
    const jobs = data?.jobs || [];

    // Filter for jobs that have coordinates
    // For now, we only show jobs that have coordinates set
    const mappableJobs = jobs.filter(j => j.latitude && j.longitude && j.status !== "closed" && j.status !== "lost");

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <MapIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Live Operations Map</CardTitle>
                        <CardDescription className="text-xs">
                            {mappableJobs.length} active jobs requiring attention
                        </CardDescription>
                    </div>
                </div>
                <Link href="/map-view">
                    <Button variant="ghost" size="icon" title="Full Screen Map">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="bg-muted/20 min-h-[350px]">
                    <MapWidget jobs={mappableJobs} height="350px" />
                </div>
            </CardContent>
        </Card>
    );
}
