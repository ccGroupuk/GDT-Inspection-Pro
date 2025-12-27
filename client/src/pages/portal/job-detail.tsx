import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { StatusBadge } from "@/components/status-badge";
import { PIPELINE_STAGES, PAYMENT_STATUSES } from "@shared/schema";
import { ArrowLeft, MapPin, Calendar, CheckCircle, Circle, PoundSterling } from "lucide-react";
import { useEffect } from "react";

interface PaymentRequest {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  status: string;
  dueDate: string | null;
}

interface PortalJobDetail {
  id: string;
  jobNumber: string;
  serviceType: string;
  description: string | null;
  status: string;
  jobAddress: string;
  jobPostcode: string;
  quotedValue: string | null;
  createdAt: string;
  paymentRequests: PaymentRequest[];
}

export default function PortalJobDetail() {
  const [, params] = useRoute("/portal/jobs/:jobId");
  const jobId = params?.jobId || "";
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: job, isLoading, error } = useQuery<PortalJobDetail>({
    queryKey: ["/api/portal/jobs", jobId],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", `/api/portal/jobs/${jobId}`, token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch job");
      }
      return response.json();
    },
    enabled: !!token && !!jobId,
  });

  if (!isAuthenticated) {
    return null;
  }

  const currentStageIndex = job ? PIPELINE_STAGES.findIndex(s => s.value === job.status) : -1;

  const getPaymentStatusBadge = (status: string) => {
    const statusInfo = PAYMENT_STATUSES.find(s => s.value === status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    const colorMap: Record<string, string> = {
      "bg-yellow-500": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      "bg-blue-500": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "bg-green-500": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "bg-red-500": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={colorMap[statusInfo.color] || ""}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/portal/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-job-detail-title">Job Details</h1>
            {job && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-mono">{job.jobNumber}</span>
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : error || !job ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Failed to load job details. Please try again.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg" data-testid="text-service-type">
                      {job.serviceType}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span data-testid="text-job-address">{job.jobAddress}, {job.jobPostcode}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={job.status} />
                    {job.quotedValue && (
                      <span className="font-mono font-semibold" data-testid="text-quoted-value">
                        £{Number(job.quotedValue).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              {job.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground" data-testid="text-description">
                    {job.description}
                  </p>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Job Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" data-testid="timeline-progress">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {PIPELINE_STAGES.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      const isPending = index > currentStageIndex;

                      return (
                        <div
                          key={stage.value}
                          className={`relative flex items-center gap-4 pl-10 ${
                            isPending ? "opacity-50" : ""
                          }`}
                          data-testid={`stage-${stage.value}`}
                        >
                          <div
                            className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border-2 border-border"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : isCurrent ? (
                              <Circle className="w-3 h-3 fill-current" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isCurrent ? "font-semibold" : ""
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {job.paymentRequests && job.paymentRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PoundSterling className="w-4 h-4" />
                    Payment Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.paymentRequests.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50"
                        data-testid={`payment-${payment.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium capitalize">
                              {payment.type.replace("_", " ")}
                            </span>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                          {payment.description && (
                            <p className="text-sm text-muted-foreground">
                              {payment.description}
                            </p>
                          )}
                          {payment.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-lg" data-testid={`payment-amount-${payment.id}`}>
                          £{Number(payment.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
