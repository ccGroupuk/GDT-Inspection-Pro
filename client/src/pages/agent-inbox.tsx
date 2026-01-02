import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Inbox, 
  Code, 
  Copy, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Rocket,
  FileCode,
  Loader2,
  Trash2,
  Bell,
  Zap,
  GitBranch,
  ExternalLink
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import type { BuildRequest } from "@shared/schema";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  implemented: { label: "Implemented", color: "bg-blue-500", icon: Rocket },
};

export default function AgentInbox() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<BuildRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const prevPendingCountRef = useRef<number>(0);
  const [newTaskAlert, setNewTaskAlert] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitPath, setCommitPath] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitBranch, setCommitBranch] = useState("main");

  const { data: requests = [], isLoading } = useQuery<BuildRequest[]>({
    queryKey: ["/api/build-requests"],
    refetchInterval: 10000, // Poll every 10 seconds for new tasks
  });

  const { data: githubStatus } = useQuery<{ configured: boolean; repo?: string; defaultBranch?: string; error?: string }>({
    queryKey: ["/api/github/status"],
  });

  const { data: branches = [] } = useQuery<{ name: string; protected: boolean }[]>({
    queryKey: ["/api/github/branches"],
    enabled: githubStatus?.configured === true,
  });

  // Watch for new pending tasks and show alert
  useEffect(() => {
    const currentPendingCount = requests.filter(r => r.status === "pending").length;
    
    if (currentPendingCount > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
      setNewTaskAlert(true);
      toast({
        title: "NEW_TASK_READY",
        description: `New build request detected! ${currentPendingCount} pending task(s) in queue.`,
        duration: 10000,
      });
    }
    
    prevPendingCountRef.current = currentPendingCount;
  }, [requests, toast]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/build-requests/${id}`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests/pending/count"] });
      setSelectedRequest(null);
      setReviewNotes("");
      toast({
        title: "Updated",
        description: "Build request status updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/build-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests/pending/count"] });
      setSelectedRequest(null);
      toast({
        title: "Deleted",
        description: "Build request deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete request.",
        variant: "destructive",
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: async ({ id, path, message, branch }: { id: string; path: string; message: string; branch: string }) => {
      const response = await apiRequest("POST", `/api/build-requests/${id}/commit`, { path, message, branch });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests"] });
      setShowCommitDialog(false);
      setSelectedRequest(null);
      setCommitPath("");
      setCommitMessage("");
      toast({
        title: "Committed to GitHub!",
        description: (
          <div className="flex items-center gap-2">
            <span>Successfully committed to {commitBranch}</span>
            <a 
              href={data.commitUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Commit Failed",
        description: error.message || "Failed to commit to GitHub.",
        variant: "destructive",
      });
    },
  });

  const handleOpenCommitDialog = (request: BuildRequest) => {
    setCommitPath(request.filename || "");
    setCommitMessage(`[AI Bridge] ${request.description || 'Update ' + (request.filename || 'file')}`);
    setCommitBranch(githubStatus?.defaultBranch || "main");
    setShowCommitDialog(true);
  };

  const handleCommit = () => {
    if (!selectedRequest || !commitPath) return;
    commitMutation.mutate({
      id: selectedRequest.id,
      path: commitPath,
      message: commitMessage,
      branch: commitBranch,
    });
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Code copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, status, notes: reviewNotes });
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-agent-inbox">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
            <Inbox className="h-6 w-6" />
            Agent's Inbox
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Review and manage code requests from the AI Assistant
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/20">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">NEW_TASK_READY</p>
                <p className="text-sm text-muted-foreground">
                  {pendingCount} task{pendingCount !== 1 ? 's' : ''} waiting to be built. 
                  Tell your Agent: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">"Check inbox and build pending tasks"</span>
                </p>
              </div>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                <Bell className="h-3 w-3 mr-1" />
                Auto-polling every 10s
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2" data-testid="tab-pending">
            <Clock className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="implemented" data-testid="tab-implemented">
            <Rocket className="h-4 w-4 mr-1" />
            Implemented
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            <XCircle className="h-4 w-4 mr-1" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium">No {activeTab === "all" ? "" : activeTab} requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "pending" 
                    ? "Code requests from the AI Assistant will appear here."
                    : `No ${activeTab} requests to show.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                return (
                  <Card key={request.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedRequest(request)} data-testid={`request-${request.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            <FileCode className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate">{request.filename || "Unnamed code"}</span>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </CardTitle>
                          {request.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {request.description}
                            </CardDescription>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(request.createdAt!), { addSuffix: true })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="bg-muted rounded-md p-3 text-xs font-mono line-clamp-3 overflow-hidden">
                        {request.code.substring(0, 200)}{request.code.length > 200 ? '...' : ''}
                      </pre>
                      {request.language && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {request.language}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {selectedRequest?.filename || "Code Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.description || "Review and manage this code request."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedRequest?.language && (
                <Badge variant="secondary">{selectedRequest.language}</Badge>
              )}
              {selectedRequest?.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {STATUS_CONFIG[selectedRequest.status as keyof typeof STATUS_CONFIG]?.label || selectedRequest.status}
                </Badge>
              )}
              {selectedRequest?.createdAt && (
                <span className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(selectedRequest.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedRequest && handleCopy(selectedRequest.code)}
                  data-testid="button-copy-request-code"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <pre className="bg-muted rounded-md p-4 text-sm font-mono whitespace-pre-wrap">
                  {selectedRequest?.code}
                </pre>
              </ScrollArea>
            </div>

            {selectedRequest?.notes && (
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            {selectedRequest?.status === "pending" && (
              <div className="space-y-2">
                <Label htmlFor="notes">Add Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this code request..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="input-review-notes"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedRequest && handleStatusChange(selectedRequest.id, "rejected")}
                  disabled={updateMutation.isPending}
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => selectedRequest && handleStatusChange(selectedRequest.id, "approved")}
                  disabled={updateMutation.isPending}
                  data-testid="button-approve"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
            {selectedRequest?.status === "approved" && (
              <>
                {githubStatus?.configured && (
                  <Button
                    variant="default"
                    onClick={() => selectedRequest && handleOpenCommitDialog(selectedRequest)}
                    disabled={commitMutation.isPending}
                    data-testid="button-commit-github"
                  >
                    <SiGithub className="h-4 w-4 mr-1" />
                    Commit to GitHub
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => selectedRequest && handleStatusChange(selectedRequest.id, "implemented")}
                  disabled={updateMutation.isPending}
                  data-testid="button-mark-implemented"
                >
                  <Rocket className="h-4 w-4 mr-1" />
                  Mark as Implemented
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => selectedRequest && deleteMutation.mutate(selectedRequest.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-request"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiGithub className="h-5 w-5" />
              Commit to GitHub
            </DialogTitle>
            <DialogDescription>
              Commit this code directly to your GitHub repository.
              {githubStatus?.repo && (
                <span className="block mt-1 text-xs">
                  Repository: <span className="font-mono">{githubStatus.repo}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commit-path">File Path *</Label>
              <Input
                id="commit-path"
                placeholder="e.g., client/src/components/Button.tsx"
                value={commitPath}
                onChange={(e) => setCommitPath(e.target.value)}
                data-testid="input-commit-path"
              />
              <p className="text-xs text-muted-foreground">
                The path where the file will be created or updated in your repository.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commit-branch">Branch</Label>
              <Select value={commitBranch} onValueChange={setCommitBranch}>
                <SelectTrigger data-testid="select-commit-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        <span className="flex items-center gap-2">
                          <GitBranch className="h-3 w-3" />
                          {branch.name}
                          {branch.protected && <Badge variant="secondary" className="text-xs ml-1">protected</Badge>}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="main">main</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commit-message">Commit Message</Label>
              <Textarea
                id="commit-message"
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-commit-message"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCommit}
              disabled={commitMutation.isPending || !commitPath}
              data-testid="button-confirm-commit"
            >
              {commitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <SiGithub className="h-4 w-4 mr-1" />
              )}
              Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
