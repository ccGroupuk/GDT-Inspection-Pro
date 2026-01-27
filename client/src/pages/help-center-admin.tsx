import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, FolderOpen, Video, Eye, EyeOff } from "lucide-react";
import type { HelpCategory, HelpArticle, InsertHelpCategory, InsertHelpArticle } from "@shared/schema";

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "admin", label: "Admin Only" },
  { value: "client", label: "Clients Only" },
  { value: "partner", label: "Partners Only" },
];

const audienceColors: Record<string, string> = {
  all: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  client: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  partner: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function HelpCenterAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("articles");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HelpCategory | null>(null);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery<HelpCategory[]>({
    queryKey: ["/api/help-categories"],
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery<HelpArticle[]>({
    queryKey: ["/api/help-articles"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertHelpCategory) => {
      return apiRequest("POST", "/api/help-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHelpCategory> }) => {
      return apiRequest("PATCH", `/api/help-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/help-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: InsertHelpArticle) => {
      return apiRequest("POST", "/api/help-articles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-articles"] });
      setArticleDialogOpen(false);
      setEditingArticle(null);
      toast({ title: "Article created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create article", variant: "destructive" });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHelpArticle> }) => {
      return apiRequest("PATCH", `/api/help-articles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-articles"] });
      setArticleDialogOpen(false);
      setEditingArticle(null);
      toast({ title: "Article updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update article", variant: "destructive" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/help-articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-articles"] });
      toast({ title: "Article deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete article", variant: "destructive" });
    },
  });

  const openCategoryDialog = (category?: HelpCategory) => {
    setEditingCategory(category || null);
    setCategoryDialogOpen(true);
  };

  const openArticleDialog = (article?: HelpArticle) => {
    setEditingArticle(article || null);
    setArticleDialogOpen(true);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Help Center Management</h1>
          <p className="text-muted-foreground">Create and manage help articles, SOPs, and tutorials for all user types</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles" data-testid="tab-articles">
            <BookOpen className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openArticleDialog()} data-testid="button-new-article">
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>

          {loadingArticles ? (
            <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Articles Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first help article to get started</p>
                <Button onClick={() => openArticleDialog()} data-testid="button-create-first-article">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {articles.map((article) => (
                <Card key={article.id} data-testid={`card-article-${article.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-medium truncate">{article.title}</h3>
                          {article.videoUrl && (
                            <Badge variant="secondary" className="gap-1">
                              <Video className="h-3 w-3" />
                              Video
                            </Badge>
                          )}
                          <Badge className={audienceColors[article.audience]}>
                            {audienceOptions.find((a) => a.value === article.audience)?.label}
                          </Badge>
                          {article.isPublished ? (
                            <Badge variant="default" className="gap-1">
                              <Eye className="h-3 w-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{article.summary}</p>
                        <div className="text-xs text-muted-foreground">
                          Category: {getCategoryName(article.categoryId)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openArticleDialog(article)}
                          data-testid={`button-edit-article-${article.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this article?")) {
                              deleteArticleMutation.mutate(article.id);
                            }
                          }}
                          data-testid={`button-delete-article-${article.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()} data-testid="button-new-category">
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          {loadingCategories ? (
            <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Categories Yet</h3>
                <p className="text-muted-foreground mb-4">Create categories to organize your help articles</p>
                <Button onClick={() => openCategoryDialog()} data-testid="button-create-first-category">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const categoryArticles = articles.filter((a) => a.categoryId === category.id);
                return (
                  <Card key={category.id} data-testid={`card-category-${category.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{category.name}</CardTitle>
                          {category.description && (
                            <CardDescription className="text-sm mt-1">{category.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openCategoryDialog(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this category?")) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={audienceColors[category.audience]}>
                          {audienceOptions.find((a) => a.value === category.audience)?.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {categoryArticles.length} article{categoryArticles.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={(data) => {
          if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, data });
          } else {
            createCategoryMutation.mutate(data as InsertHelpCategory);
          }
        }}
        isPending={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      />

      <ArticleDialog
        open={articleDialogOpen}
        onOpenChange={setArticleDialogOpen}
        article={editingArticle}
        categories={categories}
        onSave={(data) => {
          if (editingArticle) {
            updateArticleMutation.mutate({ id: editingArticle.id, data });
          } else {
            createArticleMutation.mutate(data as InsertHelpArticle);
          }
        }}
        isPending={createArticleMutation.isPending || updateArticleMutation.isPending}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: HelpCategory | null;
  onSave: (data: Partial<InsertHelpCategory>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [icon, setIcon] = useState(category?.icon || "folder");
  const [audience, setAudience] = useState(category?.audience || "all");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder?.toString() || "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description: description || null,
      icon,
      audience,
      sortOrder: parseInt(sortOrder) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Getting Started"
              required
              data-testid="input-category-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category..."
              data-testid="input-category-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-audience">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id="cat-audience" data-testid="select-category-audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-sort">Sort Order</Label>
            <Input
              id="cat-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              data-testid="input-category-sort"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-category">
              {isPending ? "Saving..." : category ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArticleDialog({
  open,
  onOpenChange,
  article,
  categories,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: HelpArticle | null;
  categories: HelpCategory[];
  onSave: (data: Partial<InsertHelpArticle>) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(article?.title || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [content, setContent] = useState(article?.content || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || "none");
  const [audience, setAudience] = useState(article?.audience || "all");
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl || "");
  const [sortOrder, setSortOrder] = useState(article?.sortOrder?.toString() || "0");
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      summary: summary || null,
      content,
      categoryId: categoryId === "none" ? null : (categoryId || null),
      audience,
      videoUrl: videoUrl || null,
      sortOrder: parseInt(sortOrder) || 0,
      isPublished,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Edit Article" : "New Article"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="art-title">Title</Label>
            <Input
              id="art-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to track your job progress"
              required
              data-testid="input-article-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="art-summary">Summary</Label>
            <Textarea
              id="art-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary shown in article lists..."
              data-testid="input-article-summary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="art-category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="art-category" data-testid="select-article-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="art-audience">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger id="art-audience" data-testid="select-article-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="art-content">Content (Markdown)</Label>
            <Textarea
              id="art-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content using Markdown..."
              className="min-h-[200px] font-mono text-sm"
              required
              data-testid="input-article-content"
            />
            <p className="text-xs text-muted-foreground">
              Supports Markdown: **bold**, *italic*, # headings, - lists, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="art-video">Video URL (Optional)</Label>
            <Input
              id="art-video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              data-testid="input-article-video"
            />
            <p className="text-xs text-muted-foreground">
              Use YouTube embed URL or Loom share link
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="art-sort">Sort Order</Label>
              <Input
                id="art-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                data-testid="input-article-sort"
              />
            </div>

            <div className="flex items-center justify-between gap-2 rounded-md border p-4">
              <div>
                <Label htmlFor="art-published">Published</Label>
                <p className="text-xs text-muted-foreground">Make visible to users</p>
              </div>
              <Switch
                id="art-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                data-testid="switch-article-published"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-article">
              {isPending ? "Saving..." : article ? "Save Changes" : "Create Article"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
