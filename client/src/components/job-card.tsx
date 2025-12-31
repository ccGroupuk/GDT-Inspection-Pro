import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, PoundSterling, Handshake, CheckCircle, XCircle, Clock, Bell } from "lucide-react";
import type { Job, Contact, TradePartner } from "@shared/schema";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface JobCardProps {
  job: Job;
  contact?: Contact;
  partner?: TradePartner;
}

export function JobCard({ job, contact, partner }: JobCardProps) {
  const deliveryTypeConfig = {
    in_house: { label: "In-House", variant: "default" as const, icon: CheckCircle },
    partner: { label: "Partner", variant: "secondary" as const, icon: Handshake },
    hybrid: { label: "Hybrid", variant: "outline" as const, icon: Handshake },
  };

  const delivery = deliveryTypeConfig[job.deliveryType as keyof typeof deliveryTypeConfig] || deliveryTypeConfig.in_house;
  const DeliveryIcon = delivery.icon;

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`job-card-${job.id}`}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {job.jobNumber}
                </span>
                <span className="font-semibold text-sm text-foreground truncate">
                  {contact?.name || "Unknown Client"}
                </span>
              </div>
              <Badge variant={delivery.variant} className="shrink-0 gap-1">
                <DeliveryIcon className="w-3 h-3" />
                {delivery.label}
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{job.jobPostcode}</span>
              </div>
              {contact && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground truncate">
                {job.serviceType}
              </span>
              {job.quotedValue && (
                <div className="flex items-center gap-1 font-mono text-sm font-semibold text-foreground">
                  <PoundSterling className="w-3 h-3" />
                  {Number(job.quotedValue).toLocaleString()}
                </div>
              )}
            </div>

            {partner && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-border text-xs text-muted-foreground">
                <Handshake className="w-3 h-3 shrink-0" />
                <span className="truncate">{partner.businessName}</span>
                {/* Partner acceptance status indicator */}
                {job.partnerStatus === "accepted" && !job.partnerAcceptanceAcknowledged ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-auto shrink-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                        <Bell className="w-2.5 h-2.5 mr-0.5" />
                        Accepted
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Partner accepted - needs acknowledgment</TooltipContent>
                  </Tooltip>
                ) : job.partnerStatus === "accepted" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400 ml-auto shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Partner accepted</TooltipContent>
                  </Tooltip>
                ) : job.partnerStatus === "declined" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <XCircle className="w-3 h-3 text-red-600 dark:text-red-400 ml-auto shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Partner declined{job.partnerDeclineReason ? `: ${job.partnerDeclineReason}` : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 ml-auto shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Awaiting partner response</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
