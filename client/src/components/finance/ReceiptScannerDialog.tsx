import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Receipt,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FinancialCategory, FinancialTransaction, Job } from "@shared/schema";

interface ScannedReceiptData {
  vendor: string;
  date: string;
  amount: number;
  description: string;
  items: string[];
  category: string;
}

interface ReceiptScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function ReceiptScannerDialog({ open, onOpenChange, triggerButton }: ReceiptScannerProps) {
  const { toast } = useToast();
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReceiptData | null>(null);
  const [receiptJobId, setReceiptJobId] = useState<string>("none");

  const { data: categories = [] } = useQuery<FinancialCategory[]>({
    queryKey: ["/api/financial-categories"],
  });
  
  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  const { data: jobsData } = useQuery<{ jobs: Job[] }>({
    queryKey: ["/api/jobs"],
  });
  const allJobs = jobsData?.jobs || [];

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FinancialTransaction>) => {
      return apiRequest("POST", "/api/financial-transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      onOpenChange(false);
      resetReceiptScanner();
      toast({ title: "Transaction added" });
    },
    onError: () => {
      toast({ title: "Failed to add transaction", variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetReceiptScanner = () => {
    setReceiptImage(null);
    setScannedData(null);
    setIsScanning(false);
    setReceiptJobId("none");
  };

  const handleScanReceipt = async () => {
    if (!receiptImage) return;

    setIsScanning(true);
    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: receiptImage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to scan receipt");
      }

      setScannedData(result.data);
      toast({
        title: "Receipt Scanned",
        description: `Found £${result.data.amount} from ${result.data.vendor}`,
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Could not read the receipt. Try a clearer photo.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateFromScan = () => {
    if (!scannedData) return;

    const matchedCategory = expenseCategories.find(
      c => c.name.toLowerCase().includes(scannedData.category.toLowerCase().split(" ")[0])
    );

    createMutation.mutate({
      type: "expense",
      categoryId: matchedCategory?.id || null,
      amount: scannedData.amount.toString(),
      description: scannedData.description || `${scannedData.vendor} purchase`,
      date: scannedData.date ? new Date(scannedData.date) : new Date(),
      notes: scannedData.items?.length > 0 ? `Items: ${scannedData.items.join(", ")}` : null,
      sourceType: "receipt_scan",
      vendor: scannedData.vendor,
      receiptUrl: receiptImage,
      jobId: receiptJobId === "none" ? null : receiptJobId,
    });
  };

  const handleManualClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) resetReceiptScanner();
  };

  return (
    <Dialog open={open} onOpenChange={handleManualClose}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!receiptImage ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Take a photo or upload an image of your receipt. The AI will read it and create an expense entry automatically.
              </p>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Take Photo</span>
                  <span className="text-xs text-muted-foreground">Use your camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-receipt-camera"
                  />
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm">Upload from gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-receipt-upload"
                  />
                </label>
              </div>
            </div>
          ) : !scannedData ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={receiptImage}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">Reading receipt...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetReceiptScanner}
                  className="flex-1"
                  data-testid="button-retake-receipt"
                >
                  Retake
                </Button>
                <Button
                  onClick={handleScanReceipt}
                  disabled={isScanning}
                  className="flex-1"
                  data-testid="button-scan-now"
                >
                  {isScanning ? "Scanning..." : "Scan Receipt"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Extracted Data</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-medium">{scannedData.vendor}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">£{scannedData.amount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">{scannedData.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{scannedData.category}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Label htmlFor="receipt-job">Assign to Job (Optional)</Label>
                  <Select value={receiptJobId} onValueChange={setReceiptJobId}>
                    <SelectTrigger id="receipt-job" className="mt-1 bg-background">
                      <SelectValue placeholder="Select job..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific job</SelectItem>
                      {allJobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobNumber} - {job.serviceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setScannedData(null)}
                  data-testid="button-cancel-parsed"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateFromScan}
                  disabled={createMutation.isPending}
                  data-testid="button-save-receipt"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="mr-2 h-4 w-4" />
                  )}
                  Save Expense
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
