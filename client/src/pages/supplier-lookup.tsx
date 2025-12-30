import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, ExternalLink, Save, Package, Loader2, Store, Check, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PriceSource = 'serpapi' | 'bnq_api' | 'gemini_estimate' | 'ai_estimate' | 'manual';

interface ProductResult {
  productName: string;
  brand: string | null;
  price: number | null;
  currency: string;
  sizeValue: number | null;
  sizeUnit: string | null;
  sizeLabel: string | null;
  storeName: string;
  productUrl: string;
  sku: string | null;
  inStock: boolean | null;
  lastCheckedAt: string;
  imageUrl?: string | null;
  source?: PriceSource;
  isRealPrice?: boolean;
}

function getSourceLabel(source?: PriceSource): { label: string; isReal: boolean } {
  switch (source) {
    case 'serpapi':
      return { label: 'Google Shopping', isReal: true };
    case 'bnq_api':
      return { label: 'B&Q API', isReal: true };
    case 'gemini_estimate':
      return { label: 'AI Estimate', isReal: false };
    case 'ai_estimate':
      return { label: 'AI Estimate', isReal: false };
    case 'manual':
      return { label: 'Manual Entry', isReal: true };
    default:
      return { label: 'Unknown', isReal: false };
  }
}

interface SavedProduct {
  id: string;
  productName: string;
  brand: string | null;
  storeName: string;
  price: string;
  currency: string;
  sizeLabel: string | null;
  productUrl: string | null;
  externalSku: string | null;
  createdAt: string;
}

export default function SupplierLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: savedProducts = [] } = useQuery<SavedProduct[]>({
    queryKey: ["/api/products"],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/suppliers/search?query=${encodeURIComponent(query)}&limit=3`, {
        credentials: 'include',  // Send cookies for cross-origin requests
      });
      if (response.status === 401) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        window.location.href = "/employee-portal";
        throw new Error("Please log in again");
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Search failed");
      }
      return response.json() as Promise<ProductResult[]>;
    },
    onSuccess: (results) => {
      setSearchResults(results);
      setSavedProductIds(new Set());
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term",
        });
      }
    },
    onError: (error: Error) => {
      if (error.message !== "Please log in again") {
        toast({
          title: "Search failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const importMutation = useMutation({
    mutationFn: async (product: ProductResult) => {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
        credentials: 'include',  // Send cookies for cross-origin requests
      });
      if (response.status === 401) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        window.location.href = "/employee-portal";
        throw new Error("Please log in again");
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save product");
      }
      return response.json();
    },
    onSuccess: (_, product) => {
      setSavedProductIds(prev => new Set(prev).add(product.productUrl));
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product saved",
        description: `${product.productName} has been added to your product list`,
      });
    },
    onError: (error: Error) => {
      if (error.message !== "Please log in again") {
        toast({
          title: "Failed to save product",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery.trim());
  };

  const handleSave = (product: ProductResult) => {
    importMutation.mutate(product);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Supplier Product Lookup</h1>
        <p className="text-muted-foreground mt-1">
          Search trade suppliers for products and save them to your database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Suppliers
          </CardTitle>
          <CardDescription>
            Searches Google Shopping for real product prices. Falls back to AI estimates if unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g. decorators caulk, wood screws, silicone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              data-testid="input-search-query"
            />
            <Button 
              type="submit" 
              disabled={searchMutation.isPending}
              data-testid="button-search"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchMutation.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Searching suppliers...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </CardContent>
        </Card>
      )}

      {!searchMutation.isPending && searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Top {searchResults.length} Results</h2>
          {searchResults.map((product, index) => (
            <Card key={index} data-testid={`card-product-result-${index}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted/50 flex items-center justify-center border">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-medium" data-testid={`text-product-name-${index}`}>
                        {product.productName}
                      </h3>
                      {product.brand && (
                        <Badge variant="secondary" className="text-xs">
                          {product.brand}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {product.storeName}
                      </span>
                      {product.sizeLabel && (
                        <span>{product.sizeLabel}</span>
                      )}
                      {product.sku && (
                        <span>SKU: {product.sku}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold" data-testid={`text-product-price-${index}`}>
                        £{product.price?.toFixed(2) ?? "N/A"}
                      </div>
                      {(() => {
                        const sourceInfo = getSourceLabel(product.source);
                        return (
                          <Badge 
                            variant={sourceInfo.isReal ? "default" : "secondary"} 
                            className={`text-xs ${!sourceInfo.isReal ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : ''}`}
                          >
                            {sourceInfo.isReal ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {sourceInfo.label}
                          </Badge>
                        );
                      })()}
                      {product.inStock !== null && (
                        <Badge variant={product.inStock ? "outline" : "destructive"} className="text-xs ml-1">
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {product.productUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-view-${index}`}
                        >
                          <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSave(product)}
                        disabled={importMutation.isPending || savedProductIds.has(product.productUrl)}
                        data-testid={`button-save-${index}`}
                      >
                        {savedProductIds.has(product.productUrl) ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Saved
                          </>
                        ) : importMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {savedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Saved Products ({savedProducts.length})
            </CardTitle>
            <CardDescription>
              Products saved from supplier searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedProducts.slice(0, 10).map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  data-testid={`saved-product-${product.id}`}
                >
                  <div className="flex-1">
                    <span className="font-medium">{product.productName}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      from {product.storeName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">£{parseFloat(product.price).toFixed(2)}</span>
                    {product.sizeLabel && (
                      <span className="text-muted-foreground text-sm ml-2">
                        {product.sizeLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {savedProducts.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {savedProducts.length - 10} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
