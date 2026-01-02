import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Code, Copy, Check, Loader2, Send, Trash2, User, Bot, MessageCircle } from "lucide-react";
import type { AiConversation } from "@shared/schema";

export default function AIBridge() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<AiConversation[]>({
    queryKey: ["/api/ai-assistant/conversations"],
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
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
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

  return (
    <div className="p-6 h-full" data-testid="page-ai-bridge">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">AI Assistant</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">Your patient coding tutor powered by Gemini</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
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
                    Ask me anything about coding, or request me to generate code for you. I remember our conversation!
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
                  placeholder="Ask me anything about coding, or describe what code you need..."
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

        <Card className="flex flex-col" data-testid="card-code-window">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2" data-testid="text-code-title">
              <Code className="h-5 w-5 text-primary" />
              Code Window
            </CardTitle>
            {currentCode && (
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
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {currentCode ? (
                <pre className="bg-muted/50 p-4 text-sm font-mono whitespace-pre-wrap break-words" data-testid="text-code-content">
                  {currentCode}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4" data-testid="text-code-placeholder">
                  <Code className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Code Yet</p>
                  <p className="text-sm mt-1 text-center max-w-xs">
                    When you ask me to generate code, it will appear here for easy copying.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
