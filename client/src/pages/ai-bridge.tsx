import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Code, Copy, Check, Loader2 } from "lucide-react";

export default function AIBridge() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await apiRequest("POST", "/api/ai-bridge/generate", { prompt: promptText });
      const data = await response.json();
      if (!data.code) {
        throw new Error(data.message || "No code generated");
      }
      return data;
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: "Code Generated",
        description: "Gemini has generated your code successfully.",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to generate code. Please try again.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt to generate code.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(prompt);
  };

  const handleCopy = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 h-full" data-testid="page-ai-bridge">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">AI Bridge</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">Generate code with Gemini AI</p>
        </div>
        <Badge variant="outline" className="gap-1" data-testid="badge-gemini">
          <Sparkles className="h-3 w-3" />
          Powered by Gemini
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        <Card className="flex flex-col" data-testid="card-prompt">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2" data-testid="text-prompt-title">
              <Sparkles className="h-5 w-5 text-primary" />
              Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea
              placeholder="Describe what you want to build...

Example: Create a React component that displays a list of products with search and filter functionality."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[300px] resize-none"
              data-testid="input-prompt"
            />
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="w-full"
              data-testid="button-build-gemini"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Build with Gemini
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col" data-testid="card-code-preview">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2" data-testid="text-code-title">
              <Code className="h-5 w-5 text-primary" />
              Code Preview
            </CardTitle>
            {generatedCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {generatedCode ? (
                <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap break-words" data-testid="text-generated-code">
                  {generatedCode}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-placeholder">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p data-testid="text-placeholder-message">Generated code will appear here</p>
                    <p className="text-sm mt-1" data-testid="text-placeholder-hint">Enter a prompt and click "Build with Gemini"</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
