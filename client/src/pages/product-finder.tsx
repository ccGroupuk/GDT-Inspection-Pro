import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Search,
  ExternalLink,
  Package,
  ShoppingCart,
  Save,
  Trash2,
  Edit,
  Loader2,
  Building2,
  PoundSterling,
  Percent,
  Link2,
  Tag,
  Box,
  Bookmark,
  Copy,
  Check,
  Info,
} from "lucide-react";
import type { CapturedProduct, Supplier, Job } from "@shared/schema";

const TRADE_SUPPLIERS = [
  { name: "B&Q", website: "https://www.diy.com", color: "bg-orange-500" },
  { name: "Screwfix", website: "https://www.screwfix.com", color: "bg-amber-500" },
  { name: "Howdens", website: "https://www.howdens.com", color: "bg-blue-700" },
  { name: "Toolstation", website: "https://www.toolstation.com", color: "bg-red-600" },
  { name: "Travis Perkins", website: "https://www.travisperkins.co.uk", color: "bg-green-700" },
  { name: "Selco", website: "https://www.selcobw.com", color: "bg-blue-600" },
  { name: "Wickes", website: "https://www.wickes.co.uk", color: "bg-green-600" },
  { name: "Jewson", website: "https://www.jewson.co.uk", color: "bg-yellow-600" },
];

const captureProductSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, "Supplier name is required"),
  productTitle: z.string().min(1, "Product title is required"),
  sku: z.string().optional(),
  price: z.string().optional(),
  unit: z.string().default("each"),
  productUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  markupPercent: z.string().default("20"),
  quantity: z.string().default("1"),
});

type CaptureProductFormData = z.infer<typeof captureProductSchema>;

// Generate the bookmarklet code
const generateBookmarkletCode = (baseUrl: string) => {
  // This script runs on supplier websites to extract product data
  const script = `
(function() {
  var CRM_URL = '${baseUrl}';
  
  // Supplier detection patterns
  var suppliers = {
    'diy.com': 'B&Q',
    'screwfix.com': 'Screwfix',
    'howdens.com': 'Howdens',
    'toolstation.com': 'Toolstation',
    'travisperkins.co.uk': 'Travis Perkins',
    'selcobw.com': 'Selco',
    'wickes.co.uk': 'Wickes',
    'jewson.co.uk': 'Jewson'
  };
  
  // Detect supplier from URL
  var supplierName = 'Unknown';
  for (var domain in suppliers) {
    if (window.location.hostname.includes(domain)) {
      supplierName = suppliers[domain];
      break;
    }
  }
  
  // Generic product extraction
  function getText(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '';
  }
  
  function getPrice(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        var text = el.textContent.replace(/[^0-9.]/g, '');
        if (text) return text;
      }
    }
    return '';
  }
  
  // Common selectors for product data
  var titleSelectors = [
    'h1[data-testid*="title"]', 'h1.product-title', 'h1.product-name',
    '[data-testid="product-title"]', '.product-title h1', '#productTitle',
    'h1[itemprop="name"]', '.pdp-title h1', 'h1'
  ];
  
  var priceSelectors = [
    '[data-testid*="price"]', '.product-price', '.price-value',
    '[itemprop="price"]', '.pdp-price', '.price', '.current-price',
    '.product-price-amount', '.price-amount'
  ];
  
  var skuSelectors = [
    '[data-testid*="sku"]', '.product-code', '.sku', '.product-sku',
    '[itemprop="sku"]', '.item-code', '.part-number'
  ];
  
  var imageSelectors = [
    'img[data-testid*="product"]', '.product-image img', '.pdp-image img',
    '[itemprop="image"]', '.gallery-image img', '.product-gallery img'
  ];
  
  // Extract product data
  var product = {
    productTitle: getText(titleSelectors) || document.title.split('|')[0].trim(),
    price: getPrice(priceSelectors),
    sku: getText(skuSelectors).replace(/[^a-zA-Z0-9-]/g, ''),
    productUrl: window.location.href,
    supplierName: supplierName,
    unit: 'each',
    imageUrl: ''
  };
  
  // Try to get image
  for (var i = 0; i < imageSelectors.length; i++) {
    var img = document.querySelector(imageSelectors[i]);
    if (img && img.src) {
      product.imageUrl = img.src;
      break;
    }
  }
  
  // Show confirmation popup
  var confirmed = confirm(
    'Capture this product to CCC CRM?\\n\\n' +
    'Product: ' + product.productTitle.substring(0, 50) + '...\\n' +
    'Price: £' + (product.price || 'Not found') + '\\n' +
    'SKU: ' + (product.sku || 'Not found') + '\\n' +
    'Supplier: ' + product.supplierName
  );
  
  if (!confirmed) return;
  
  // Send to CRM
  fetch(CRM_URL + '/api/captured-products/bookmarklet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(product)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      alert('Product captured! Check the Product Finder in your CRM.');
    } else {
      alert('Error: ' + (data.message || 'Failed to capture product'));
    }
  })
  .catch(function(e) {
    alert('Error: Could not connect to CRM. Make sure you are logged in.');
  });
})();
  `.trim().replace(/\s+/g, ' ');
  
  return `javascript:${encodeURIComponent(script)}`;
};

export default function ProductFinder() {
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [addToQuoteDialogOpen, setAddToQuoteDialogOpen] = useState(false);
  const [saveToCatalogDialogOpen, setSaveToCatalogDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CapturedProduct | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [showBookmarkletInstructions, setShowBookmarkletInstructions] = useState(false);
  const [productToDelete, setProductToDelete] = useState<CapturedProduct | null>(null);
  
  const { toast } = useToast();

  const { data: capturedProducts = [], isLoading } = useQuery<CapturedProduct[]>({
    queryKey: ["/api/captured-products"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/product-categories"],
  });

  const form = useForm<CaptureProductFormData>({
    resolver: zodResolver(captureProductSchema),
    defaultValues: {
      supplierName: "",
      productTitle: "",
      sku: "",
      price: "",
      unit: "each",
      productUrl: "",
      imageUrl: "",
      markupPercent: "20",
      quantity: "1",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CaptureProductFormData) => {
      return apiRequest("POST", "/api/captured-products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captured-products"] });
      setCaptureDialogOpen(false);
      form.reset();
      toast({ title: "Product captured successfully" });
    },
    onError: () => {
      toast({ title: "Failed to capture product", variant: "destructive" });
    },
  });

  const addToQuoteMutation = useMutation({
    mutationFn: async ({ productId, jobId }: { productId: string; jobId: string }) => {
      return apiRequest("POST", `/api/captured-products/${productId}/add-to-quote`, { jobId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captured-products"] });
      setAddToQuoteDialogOpen(false);
      setSelectedProduct(null);
      setSelectedJobId("");
      toast({ title: "Product added to quote successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add to quote", variant: "destructive" });
    },
  });

  const saveToCatalogMutation = useMutation({
    mutationFn: async ({ productId, categoryId }: { productId: string; categoryId?: string }) => {
      return apiRequest("POST", `/api/captured-products/${productId}/save-to-catalog`, { categoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captured-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog-items"] });
      setSaveToCatalogDialogOpen(false);
      setSelectedProduct(null);
      setSelectedCategoryId("");
      toast({ title: "Product saved to catalog successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save to catalog", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/captured-products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captured-products"] });
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      toast({ title: "Product discarded" });
    },
    onError: () => {
      toast({ title: "Failed to discard product", variant: "destructive" });
    },
  });

  const openCaptureDialog = (supplierName?: string) => {
    form.reset({
      supplierName: supplierName || "",
      productTitle: "",
      sku: "",
      price: "",
      unit: "each",
      productUrl: "",
      imageUrl: "",
      markupPercent: "20",
      quantity: "1",
    });
    
    if (supplierName) {
      const dbSupplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
      if (dbSupplier) {
        form.setValue("supplierId", dbSupplier.id);
      }
    }
    
    setSelectedSupplier(supplierName || null);
    setCaptureDialogOpen(true);
  };

  const pendingProducts = capturedProducts.filter(p => p.status === "pending");
  const processedProducts = capturedProducts.filter(p => p.status !== "pending");

  const calculateMarkupPrice = (price: string | null, markup: string | null) => {
    const basePrice = parseFloat(price || "0");
    const markupPercent = parseFloat(markup || "20");
    return (basePrice * (1 + markupPercent / 100)).toFixed(2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Supplier Product Finder</h1>
          <p className="text-muted-foreground">Capture products from trade supplier websites to add to quotes</p>
        </div>
        <Button onClick={() => openCaptureDialog()} data-testid="button-capture-product">
          <Plus className="mr-2 h-4 w-4" />
          Capture Product
        </Button>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Trade Suppliers</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Products
            {pendingProducts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingProducts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" data-testid="tab-processed">Processed</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* One-Click Bookmarklet Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                One-Click Product Capture
              </CardTitle>
              <CardDescription>
                Install this bookmarklet in your browser to capture products with a single click from any supplier website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={generateBookmarkletCode(window.location.origin)}
                  onClick={(e) => e.preventDefault()}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/uri-list", generateBookmarkletCode(window.location.origin));
                    e.dataTransfer.setData("text/plain", generateBookmarkletCode(window.location.origin));
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium cursor-grab active:cursor-grabbing"
                  data-testid="link-bookmarklet"
                >
                  <Package className="h-4 w-4" />
                  CCC Product Capture
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generateBookmarkletCode(window.location.origin));
                    setBookmarkletCopied(true);
                    setTimeout(() => setBookmarkletCopied(false), 2000);
                    toast({ title: "Bookmarklet code copied to clipboard" });
                  }}
                  data-testid="button-copy-bookmarklet"
                >
                  {bookmarkletCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {bookmarkletCopied ? "Copied" : "Copy Code"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowBookmarkletInstructions(!showBookmarkletInstructions)}
                  data-testid="button-show-instructions"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {showBookmarkletInstructions ? "Hide Instructions" : "How to Install"}
                </Button>
              </div>
              
              {showBookmarkletInstructions && (
                <div className="rounded-md bg-muted p-4 space-y-3 text-sm">
                  <h4 className="font-medium">Installation Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li><strong>Drag the button</strong> above to your browser's bookmarks bar, OR</li>
                    <li>Click "Copy Code", then right-click your bookmarks bar and select "Add page" or "Add bookmark"</li>
                    <li>Give it a name like "CCC Capture" and paste the code as the URL</li>
                  </ol>
                  <h4 className="font-medium mt-4">How to Use:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to any supplier product page (Screwfix, B&Q, Toolstation, etc.)</li>
                    <li>Click the bookmarklet in your bookmarks bar</li>
                    <li>Confirm the captured details in the popup</li>
                    <li>The product will appear in your Pending Products tab</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-3">
                    Note: Make sure you're logged into the CRM in another tab for this to work.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Quick Access Trade Suppliers
              </CardTitle>
              <CardDescription>
                Click a supplier to open their website, then use the bookmarklet or manually capture product details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TRADE_SUPPLIERS.map((supplier) => (
                  <Card key={supplier.name} className="hover-elevate cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-md ${supplier.color} flex items-center justify-center`}>
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-medium text-sm">{supplier.name}</span>
                      <div className="flex gap-2 flex-wrap justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(supplier.website, "_blank")}
                          data-testid={`button-open-${supplier.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Browse
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openCaptureDialog(supplier.name)}
                          data-testid={`button-capture-${supplier.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Capture
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {suppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Registered Suppliers</CardTitle>
                <CardDescription>
                  Suppliers you've added to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {suppliers.filter(s => s.isActive).map((supplier) => (
                    <Card key={supplier.id} className="hover-elevate cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-medium text-sm text-center">{supplier.name}</span>
                        {supplier.isPreferred && (
                          <Badge variant="secondary">Preferred</Badge>
                        )}
                        <div className="flex gap-2 flex-wrap justify-center">
                          {supplier.website && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(supplier.website!, "_blank")}
                              data-testid={`button-open-supplier-${supplier.id}`}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Browse
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => openCaptureDialog(supplier.name)}
                            data-testid={`button-capture-supplier-${supplier.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Capture
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No pending products"
              description="Capture products from supplier websites to see them here"
              action={{
                label: "Capture Product",
                onClick: () => openCaptureDialog(),
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Markup</TableHead>
                      <TableHead>Sell Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{product.productTitle}</span>
                            {product.sku && (
                              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                            )}
                            {product.productUrl && (
                              <a
                                href={product.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <Link2 className="h-3 w-3" />
                                View on website
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.supplierName || "Unknown"}</TableCell>
                        <TableCell>
                          {product.price ? `£${parseFloat(product.price).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>{product.markupPercent}%</TableCell>
                        <TableCell className="font-medium">
                          £{calculateMarkupPrice(product.price, product.markupPercent)}
                        </TableCell>
                        <TableCell>{product.quantity} {product.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setAddToQuoteDialogOpen(true);
                              }}
                              data-testid={`button-add-to-quote-${product.id}`}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Add to Quote
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setSaveToCatalogDialogOpen(true);
                              }}
                              data-testid={`button-save-to-catalog-${product.id}`}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save to Catalog
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setProductToDelete(product);
                                setDeleteConfirmOpen(true);
                              }}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedProducts.length === 0 ? (
            <EmptyState
              icon={Box}
              title="No processed products"
              description="Products you've added to quotes or saved to catalog will appear here"
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Captured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-processed-${product.id}`}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{product.productTitle}</span>
                            {product.sku && (
                              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.supplierName || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === "added_to_quote" ? "default" : "secondary"}>
                            {product.status === "added_to_quote" ? "Added to Quote" : 
                             product.status === "saved_to_catalog" ? "In Catalog" : 
                             product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.price ? `£${parseFloat(product.price).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {product.capturedAt ? new Date(product.capturedAt).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Capture Product Dialog */}
      <Dialog open={captureDialogOpen} onOpenChange={setCaptureDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Capture Product</DialogTitle>
            <DialogDescription>
              {selectedSupplier 
                ? `Enter product details from ${selectedSupplier}`
                : "Enter product details from a supplier website"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Screwfix" {...field} data-testid="input-supplier-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DeWalt 18V Combi Drill" {...field} data-testid="input-product-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Product Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345" {...field} data-testid="input-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="0.00" {...field} data-testid="input-price" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="metre">Metre</SelectItem>
                          <SelectItem value="sqm">Sq Metre</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="litre">Litre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="0.01" {...field} data-testid="input-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="markupPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Markup %</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" min="0" step="1" {...field} data-testid="input-markup" />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="productUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-product-url" />
                    </FormControl>
                    <FormDescription>Link to the product on the supplier's website</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCaptureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-capture">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Capture Product
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add to Quote Dialog */}
      <Dialog open={addToQuoteDialogOpen} onOpenChange={setAddToQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Quote</DialogTitle>
            <DialogDescription>
              Select a job to add this product to its quote
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium">{selectedProduct.productTitle}</p>
                <p className="text-sm text-muted-foreground">
                  Cost: £{parseFloat(selectedProduct.price || "0").toFixed(2)} + 
                  {selectedProduct.markupPercent}% markup = 
                  <span className="font-medium text-foreground ml-1">
                    £{calculateMarkupPrice(selectedProduct.price, selectedProduct.markupPercent)}
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Job</label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger data-testid="select-job">
                    <SelectValue placeholder="Choose a job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.filter(j => j.status !== "completed" && j.status !== "cancelled").map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.jobNumber} - {job.serviceType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedProduct && selectedJobId) {
                  addToQuoteMutation.mutate({ productId: selectedProduct.id, jobId: selectedJobId });
                }
              }}
              disabled={!selectedJobId || addToQuoteMutation.isPending}
              data-testid="button-confirm-add-to-quote"
            >
              {addToQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save to Catalog Dialog */}
      <Dialog open={saveToCatalogDialogOpen} onOpenChange={setSaveToCatalogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Catalog</DialogTitle>
            <DialogDescription>
              Save this product to your permanent product catalog
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium">{selectedProduct.productTitle}</p>
                {selectedProduct.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Price: £{parseFloat(selectedProduct.price || "0").toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category (optional)</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveToCatalogDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedProduct) {
                  saveToCatalogMutation.mutate({ 
                    productId: selectedProduct.id, 
                    categoryId: selectedCategoryId || undefined 
                  });
                }
              }}
              disabled={saveToCatalogMutation.isPending}
              data-testid="button-confirm-save-to-catalog"
            >
              {saveToCatalogMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save to Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard "{productToDelete?.productTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
