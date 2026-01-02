import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Sparkles, Code, Copy, Check, Loader2, Send, Trash2, User, Bot, MessageCircle, 
  Rocket, TrendingUp, GitBranch, FolderOpen, FileCode, ChevronRight, ChevronDown, 
  RefreshCw, Eye, GitCommit, Github, File, Folder, ArrowLeft
} from "lucide-react";
import type { AiConversation } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
}

interface GitHubStatus {
  configured: boolean;
  repo?: string;
  defaultBranch?: string;
  isPrivate?: boolean;
  error?: string;
}

export default function AIBridge() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendFilename, setSendFilename] = useState("");
  const [sendDescription, setSendDescription] = useState("");
  const [codeToSend, setCodeToSend] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // GitHub state
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [currentPath, setCurrentPath] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitPath, setCommitPath] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitBranch, setCommitBranch] = useState("main");
  const [activeTab, setActiveTab] = useState<string>("browse");

  // GitHub queries
  const { data: githubStatus, isLoading: statusLoading } = useQuery<GitHubStatus>({
    queryKey: ["/api/github/status"],
  });

  const { data: branches = [] } = useQuery<{ name: string; protected: boolean }[]>({
    queryKey: ["/api/github/branches"],
    enabled: githubStatus?.configured,
  });

  const { data: directoryContents = [], isLoading: directoryLoading, refetch: refetchDirectory } = useQuery<GitHubFile[]>({
    queryKey: ["/api/github/directory", currentPath, selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentPath) params.set("path", currentPath);
      params.set("branch", selectedBranch);
      const response = await fetch(`/api/github/directory?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch directory");
      return response.json();
    },
    enabled: githubStatus?.configured,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<AiConversation[]>({
    queryKey: ["/api/ai-assistant/conversations"],
  });

  // Fetch file content mutation
  const fetchFileMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await apiRequest("GET", `/api/github/file?path=${encodeURIComponent(path)}&branch=${selectedBranch}`);
      return response.json();
    },
    onSuccess: (data, path) => {
      setFileContent(data.content);
      setSelectedFile(path);
      toast({
        title: "File Loaded",
        description: `Loaded ${path.split('/').pop()}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load file",
        variant: "destructive",
      });
    },
  });

  // Direct commit mutation
  const directCommitMutation = useMutation({
    mutationFn: async (data: { path: string; content: string; message: string; branch: string }) => {
      const response = await apiRequest("POST", "/api/github/commit", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowCommitDialog(false);
      setCommitPath("");
      setCommitMessage("");
      toast({
        title: "Committed Successfully",
        description: `File committed to ${data.path}`,
        duration: 5000,
      });
      refetchDirectory();
    },
    onError: (error: Error) => {
      toast({
        title: "Commit Failed",
        description: error.message || "Failed to commit file",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", "/api/ai-assistant/chat", { message: messageText });
      const data = await response.json();
      if (data.message && !data.response) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/conversations"] });
      if (data.codeSnippet) {
        setCurrentCode(data.codeSnippet);
      }
    },
    onError: (error: Error) => {
      const isRateLimit = error.message.includes('rate limit') || error.message.includes('20 requests');
      toast({
        title: isRateLimit ? "Rate Limit Reached" : "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
        duration: isRateLimit ? 10000 : 5000,
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/ai-assistant/conversations");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant/conversations"] });
      setCurrentCode(null);
      toast({
        title: "Cleared",
        description: "Conversation history cleared.",
      });
    },
  });

  const sendToAgentMutation = useMutation({
    mutationFn: async (data: { code: string; filename: string; description: string }) => {
      const response = await apiRequest("POST", "/api/build-requests", {
        code: data.code,
        filename: data.filename || null,
        description: data.description || null,
        language: detectLanguage(data.code),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/build-requests/pending/count"] });
      setShowSendDialog(false);
      setSendFilename("");
      setSendDescription("");
      setCodeToSend(null);
      toast({
        title: "NEW_TASK_READY",
        description: "Build request queued! Tell your Agent: 'Check inbox and build pending tasks'",
        duration: 15000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send code request.",
        variant: "destructive",
      });
    },
  });

  const detectLanguage = (code: string): string => {
    if (code.includes('import React') || code.includes('useState') || code.includes('export default function')) return 'tsx';
    if (code.includes('const ') && code.includes('=>')) return 'typescript';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('SELECT ') || code.includes('INSERT ')) return 'sql';
    if (code.includes('<html') || code.includes('<div')) return 'html';
    if (code.includes('.') && code.includes('{')) return 'css';
    return 'text';
  };

  const extractFilenameFromMessage = (messageContent: string, codeContent: string): string => {
    const filePathRegex = /(?:^|[\s`"'(])(((?:client|server|shared)\/)?(?:src\/)?[\w\-\/]+\.(?:tsx?|jsx?))/gm;
    const allMatches: { path: string; index: number }[] = [];
    let match;
    while ((match = filePathRegex.exec(messageContent)) !== null) {
      allMatches.push({ path: match[1], index: match.index });
    }
    
    if (allMatches.length > 0) {
      const codeBlockIndex = messageContent.indexOf('```');
      if (codeBlockIndex !== -1 && allMatches.length > 1) {
        allMatches.sort((a, b) => 
          Math.abs(a.index - codeBlockIndex) - Math.abs(b.index - codeBlockIndex)
        );
      }
      return allMatches[0].path;
    }
    
    const exportMatch = codeContent.match(/export\s+(?:default\s+)?function\s+(\w+)/);
    if (exportMatch) {
      const componentName = exportMatch[1];
      return `client/src/components/${componentName}.tsx`;
    }
    
    const namedExportMatch = codeContent.match(/export\s+(?:const|class)\s+(\w+)/);
    if (namedExportMatch) {
      const name = namedExportMatch[1];
      return `client/src/components/${name}.tsx`;
    }
    
    return "";
  };

  const extractDescriptionFromMessage = (content: string): string => {
    const textOnly = content.replace(/```[\s\S]*?```/g, '').trim();
    if (textOnly.length > 0) {
      const cleaned = textOnly.replace(/\s+/g, ' ').trim();
      return cleaned.substring(0, 100) + (cleaned.length > 100 ? '...' : '');
    }
    return "";
  };

  const handleOpenSendDialog = (code: string) => {
    setCodeToSend(code);
    const lastAssistantMessage = [...conversations].reverse().find(c => c.role === 'assistant');
    if (lastAssistantMessage) {
      const autoFilename = extractFilenameFromMessage(lastAssistantMessage.content, code);
      const autoDescription = extractDescriptionFromMessage(lastAssistantMessage.content);
      setSendFilename(autoFilename);
      setSendDescription(autoDescription);
    } else {
      const fallbackFilename = extractFilenameFromMessage("", code);
      setSendFilename(fallbackFilename);
      setSendDescription("");
    }
    setShowSendDialog(true);
  };

  const handleSendToAgent = () => {
    if (!codeToSend) return;
    sendToAgentMutation.mutate({
      code: codeToSend,
      filename: sendFilename,
      description: sendDescription,
    });
  };

  const handleSend = () => {
    if (!message.trim()) return;
    chatMutation.mutate(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async () => {
    if (currentCode) {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectCommit = (code: string) => {
    setCodeToSend(code);
    const lastAssistantMessage = [...conversations].reverse().find(c => c.role === 'assistant');
    if (lastAssistantMessage) {
      const autoFilename = extractFilenameFromMessage(lastAssistantMessage.content, code);
      setCommitPath(autoFilename);
      setCommitMessage(`[AI Bridge] Update ${autoFilename || 'file'}`);
    }
    setCommitBranch(selectedBranch);
    setShowCommitDialog(true);
  };

  const handleConfirmCommit = () => {
    if (!codeToSend || !commitPath || !commitMessage) return;
    directCommitMutation.mutate({
      path: commitPath,
      content: codeToSend,
      message: commitMessage,
      branch: commitBranch,
    });
  };

  const handleFileClick = (file: GitHubFile) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path);
    } else {
      fetchFileMutation.mutate(file.path);
    }
  };

  const handleSendFileToAI = () => {
    if (!selectedFile || !fileContent) return;
    const fileName = selectedFile.split('/').pop();
    const contextMessage = `I'm looking at the file \`${selectedFile}\` from my GitHub repository. Here's the current content:\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease help me understand or modify this file.`;
    setMessage(contextMessage);
    setActiveTab("chat");
    toast({
      title: "File Context Added",
      description: `${fileName} content added to your message`,
    });
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations]);

  useEffect(() => {
    const lastAssistantMessage = [...conversations].reverse().find(c => c.role === 'assistant' && c.codeSnippet);
    if (lastAssistantMessage?.codeSnippet) {
      setCurrentCode(lastAssistantMessage.codeSnippet);
    }
  }, [conversations]);

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        if (match) {
          return (
            <pre key={idx} className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap break-words my-2 overflow-x-auto">
              <code>{match[2]}</code>
            </pre>
          );
        }
      }
      return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const getFileIcon = (file: GitHubFile) => {
    if (file.type === 'dir') return <Folder className="h-4 w-4 text-blue-500" />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileCode className="h-4 w-4 text-yellow-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="p-6 h-full" data-testid="page-ai-bridge">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">AI Assistant</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Your coding partner with full GitHub integration
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {githubStatus?.configured && (
            <Badge variant="outline" className="gap-1" data-testid="badge-github">
              <Github className="h-3 w-3" />
              {githubStatus.repo}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || conversations.length === 0}
            data-testid="button-clear-chat"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Chat
          </Button>
          <Badge variant="outline" className="gap-1" data-testid="badge-gemini">
            <Sparkles className="h-3 w-3" />
            Powered by Gemini
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Repository Browser */}
        <Card className="flex flex-col" data-testid="card-repo-browser">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2" data-testid="text-repo-title">
                <FolderOpen className="h-5 w-5 text-primary" />
                Repository
              </CardTitle>
              <div className="flex items-center gap-2">
                {branches.length > 0 && (
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="select-branch">
                      <GitBranch className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => refetchDirectory()}
                  data-testid="button-refresh-repo"
                >
                  <RefreshCw className={`h-4 w-4 ${directoryLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {!githubStatus?.configured ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Github className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm text-center">GitHub not configured</p>
                <p className="text-xs text-center mt-1">Add GITHUB_PAT, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME to secrets</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b px-2">
                  <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
                  <TabsTrigger value="file" className="text-xs" disabled={!selectedFile}>
                    {selectedFile ? selectedFile.split('/').pop() : 'File'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="browse" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      {currentPath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start mb-1 text-xs"
                          onClick={navigateUp}
                          data-testid="button-navigate-up"
                        >
                          <ArrowLeft className="h-3 w-3 mr-2" />
                          ..
                        </Button>
                      )}
                      {currentPath && (
                        <div className="text-xs text-muted-foreground px-2 py-1 mb-2 bg-muted rounded">
                          {currentPath}
                        </div>
                      )}
                      {directoryLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {directoryContents
                            .sort((a, b) => {
                              if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                              return a.name.localeCompare(b.name);
                            })
                            .map(file => (
                              <Button
                                key={file.path}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => handleFileClick(file)}
                                data-testid={`file-${file.name}`}
                              >
                                {getFileIcon(file)}
                                <span className="ml-2 truncate">{file.name}</span>
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="file" className="flex-1 m-0 overflow-hidden flex flex-col">
                  {selectedFile && (
                    <>
                      <div className="p-2 border-b flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">{selectedFile}</span>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={handleSendFileToAI}
                          className="shrink-0"
                          data-testid="button-send-file-to-ai"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Ask AI About This
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        {fetchFileMutation.isPending ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <pre className="p-2 text-xs font-mono whitespace-pre-wrap break-words">
                            {fileContent}
                          </pre>
                        )}
                      </ScrollArea>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Middle Panel - Chat */}
        <Card className="flex flex-col" data-testid="card-chat">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2" data-testid="text-chat-title">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Welcome to AI Assistant</p>
                  <p className="text-sm mt-1 text-center max-w-xs">
                    Browse your GitHub repo on the left, ask me to edit files, and I'll commit directly!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex gap-3 ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${conv.id}`}
                    >
                      {conv.role === 'assistant' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          conv.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {conv.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{conv.content}</p>
                        ) : (
                          <div className="text-sm">{formatMessage(conv.content)}</div>
                        )}
                      </div>
                      {conv.role === 'user' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me to edit a file from your repo, or describe what code you need..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] resize-none"
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={chatMutation.isPending || !message.trim()}
                  className="h-auto"
                  data-testid="button-send"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Code Window */}
        <Card className="flex flex-col" data-testid="card-code-window">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg flex items-center gap-2" data-testid="text-code-title">
                <Code className="h-5 w-5 text-primary" />
                Code Window
              </CardTitle>
              {currentCode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    data-testid="button-copy-code"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            <ScrollArea className="flex-1">
              {currentCode ? (
                <pre className="bg-muted/50 p-4 text-sm font-mono whitespace-pre-wrap break-words" data-testid="text-code-content">
                  {currentCode}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4" data-testid="text-code-placeholder">
                  <Code className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Code Yet</p>
                  <p className="text-sm mt-1 text-center max-w-xs">
                    When you ask me to generate code, it will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
            {currentCode && (
              <div className="p-3 border-t flex flex-col gap-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleDirectCommit(currentCode)}
                  disabled={!githubStatus?.configured}
                  data-testid="button-commit-to-github"
                >
                  <GitCommit className="h-4 w-4 mr-2" />
                  Commit Directly to GitHub
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenSendDialog(currentCode)}
                  data-testid="button-send-to-agent"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Send to Agent Inbox
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send to Agent Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Send to Agent Inbox
            </DialogTitle>
            <DialogDescription>
              Queue this code for review and implementation by Replit Agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename (optional)</Label>
              <Input
                id="filename"
                placeholder="e.g., components/Button.tsx"
                value={sendFilename}
                onChange={(e) => setSendFilename(e.target.value)}
                data-testid="input-filename"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe what this code does..."
                value={sendDescription}
                onChange={(e) => setSendDescription(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-description"
              />
            </div>
            <div className="bg-muted rounded-md p-3 max-h-[150px] overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {codeToSend?.substring(0, 500)}{codeToSend && codeToSend.length > 500 ? '...' : ''}
              </pre>
            </div>
            {codeToSend && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-green-500/10 border border-green-500/30 rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Token Efficiency:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    ~{Math.ceil(codeToSend.length / 4)} tokens vs 5,000 full context
                  </span>
                  <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 font-semibold">
                    +{Math.max(0, Math.round((1 - (codeToSend.length / 4) / 5000) * 100))}% Savings
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSendToAgent}
              disabled={sendToAgentMutation.isPending}
              data-testid="button-confirm-send"
            >
              {sendToAgentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Rocket className="h-4 w-4 mr-1" />
              )}
              Send to Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Commit Dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Commit to GitHub
            </DialogTitle>
            <DialogDescription>
              Commit this code directly to your repository. Please verify the file path carefully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commit-branch">Branch</Label>
              <Select value={commitBranch} onValueChange={setCommitBranch}>
                <SelectTrigger data-testid="select-commit-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {commitBranch === "main" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  Committing directly to main branch
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="commit-path">
                File Path <span className="text-destructive">*</span>
              </Label>
              <Input
                id="commit-path"
                placeholder="e.g., client/src/components/Button.tsx"
                value={commitPath}
                onChange={(e) => setCommitPath(e.target.value)}
                className={!commitPath.trim() ? "border-destructive" : ""}
                data-testid="input-commit-path"
              />
              {!commitPath.trim() && (
                <p className="text-xs text-destructive">File path is required</p>
              )}
              {commitPath.trim() && !commitPath.includes("/") && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Path should include folder structure (e.g., client/src/...)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="commit-message">
                Commit Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="commit-message"
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className={`min-h-[60px] ${!commitMessage.trim() ? "border-destructive" : ""}`}
                data-testid="input-commit-message"
              />
              {!commitMessage.trim() && (
                <p className="text-xs text-destructive">Commit message is required</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Code Preview</Label>
              <div className="bg-muted rounded-md p-3 max-h-[100px] overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {codeToSend?.substring(0, 300)}{codeToSend && codeToSend.length > 300 ? '...' : ''}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                {codeToSend ? `${codeToSend.length} characters` : "No code"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleConfirmCommit}
              disabled={directCommitMutation.isPending || !commitPath.trim() || !commitMessage.trim()}
              data-testid="button-confirm-commit"
            >
              {directCommitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <GitCommit className="h-4 w-4 mr-1" />
              )}
              Commit to {commitBranch}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
