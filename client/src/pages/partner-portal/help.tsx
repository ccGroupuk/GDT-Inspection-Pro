import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { ArrowLeft, Search, BookOpen, Video, ChevronRight, FolderOpen } from "lucide-react";
import type { HelpCategory, HelpArticle } from "@shared/schema";

interface HelpData {
  categories: HelpCategory[];
  articles: HelpArticle[];
}

export default function PartnerPortalHelp() {
  const { isAuthenticated } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data, isLoading } = useQuery<HelpData>({
    queryKey: ["/api/partner-portal/help"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const categories = data?.categories || [];
  const articles = data?.articles || [];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = searchQuery.length < 2 || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.summary && article.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const uncategorizedArticles = filteredArticles.filter((a) => !a.categoryId);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedArticle(null)}
              data-testid="button-back-to-help"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{selectedArticle.title}</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              {selectedArticle.videoUrl && (
                <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={selectedArticle.videoUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <article className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content) }} />
              </article>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/partner-portal/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back-to-portal">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Help & Guides</h1>
            <p className="text-sm text-muted-foreground">Find answers to common questions</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-help-search"
          />
        </div>

        {selectedCategory && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-clear-category"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              All Categories
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading help content...</div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Help Articles Available</h3>
              <p className="text-muted-foreground">Check back later for guides and tutorials.</p>
            </CardContent>
          </Card>
        ) : !selectedCategory ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => {
              const categoryArticleCount = articles.filter((a) => a.categoryId === category.id).length;
              if (categoryArticleCount === 0) return null;
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`card-category-${category.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {categoryArticleCount} article{categoryArticleCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
            {uncategorizedArticles.length > 0 && (
              <Card
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedCategory("uncategorized")}
                data-testid="card-category-uncategorized"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">Other Articles</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uncategorizedArticles.length} article{uncategorizedArticles.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(selectedCategory === "uncategorized" ? uncategorizedArticles : filteredArticles.filter((a) => a.categoryId === selectedCategory)).map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedArticle(article)}
                data-testid={`card-article-${article.id}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    {article.videoUrl ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{article.title}</h3>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
    .replace(/\n/gim, '<br/>');
}
