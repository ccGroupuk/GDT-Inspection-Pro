import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { JobCard } from "@/components/job-card";
import { JobCardSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { Plus, Search, Filter, LayoutGrid, List, Briefcase } from "lucide-react";
import type { Job, Contact, TradePartner } from "@shared/schema";
import { PIPELINE_STAGES, DELIVERY_TYPES } from "@shared/schema";

interface JobsData {
  jobs: Job[];
  contacts: Contact[];
  partners: TradePartner[];
}

export default function Jobs() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<JobsData>({
    queryKey: ["/api/jobs"],
  });

  const jobs = data?.jobs || [];
  const contacts = data?.contacts || [];
  const partners = data?.partners || [];

  const getContact = (contactId: string) => contacts.find(c => c.id === contactId);
  const getPartner = (partnerId: string | null) => partnerId ? partners.find(p => p.id === partnerId) : undefined;

  const filteredJobs = jobs.filter(job => {
    const contact = getContact(job.contactId);
    const matchesSearch = !searchQuery ||
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobPostcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDelivery = deliveryFilter === "all" || job.deliveryType === deliveryFilter;

    return matchesSearch && matchesDelivery;
  });

  const kanbanStages = PIPELINE_STAGES.slice(0, 8);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold">Jobs Pipeline</h1>
          <Link href="/jobs/new">
            <Button className="gap-2" data-testid="button-create-job">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Job</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-jobs"
            />
          </div>

          <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-delivery-filter">
              <Filter className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DELIVERY_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border border-border rounded-lg overflow-visible shrink-0">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
              className="rounded-r-none"
              data-testid="button-view-kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="rounded-l-none"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={searchQuery ? "Try adjusting your search or filters" : "Create your first job to get started"}
            action={!searchQuery ? { label: "Create Job", href: "/jobs/new" } : undefined}
          />
        ) : view === "kanban" ? (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6">
              <div className="flex gap-4" style={{ minWidth: `${kanbanStages.length * 280}px` }}>
                {kanbanStages.map(stage => {
                  const stageJobs = filteredJobs.filter(j => j.status === stage.value);
                  return (
                    <div key={stage.value} className="flex flex-col w-64 sm:w-72 shrink-0">
                      <div className={`flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg shadow-sm ${stage.color} text-white`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{stage.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0 bg-white/20 text-white hover:bg-white/30 border-0">
                          {stageJobs.length}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-3 min-h-[200px]">
                        {stageJobs.map(job => (
                          <JobCard
                            key={job.id}
                            job={job}
                            contact={getContact(job.contactId)}
                            partner={getPartner(job.partnerId)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6">
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Job #</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Service</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => {
                        const contact = getContact(job.contactId);
                        return (
                          <tr key={job.id} className="border-b border-border last:border-0 hover-elevate">
                            <td className="px-3 sm:px-4 py-3">
                              <Link href={`/jobs/${job.id}`} className="font-mono text-sm text-primary hover:underline" data-testid={`link-job-${job.id}`}>
                                {job.jobNumber}
                              </Link>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm truncate max-w-[120px] sm:max-w-none">{contact?.name || "Unknown"}</td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{job.serviceType}</td>
                            <td className="px-3 sm:px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {PIPELINE_STAGES.find(s => s.value === job.status)?.label || job.status}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                              <Badge variant="secondary" className="text-xs">
                                {DELIVERY_TYPES.find(t => t.value === job.deliveryType)?.label || job.deliveryType}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-right font-mono text-sm font-semibold">
                              {job.quotedValue ? `£${Number(job.quotedValue).toLocaleString()}` : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
