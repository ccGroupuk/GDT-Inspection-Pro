export type PriceSource = 'serpapi' | 'bnq_api' | 'gemini_estimate' | 'ai_estimate' | 'manual';

export interface ProductResult {
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
  lastCheckedAt: Date;
  rating?: number | null;
  reviewCount?: number | null;
  pricePerUnit?: number | null;
  imageUrl?: string | null;
  source?: PriceSource;
  isRealPrice?: boolean;
}

export interface SupplierAdapter {
  name: string;
  domain: string;
  search(query: string, limit?: number): Promise<ProductResult[]>;
  parseProduct?(url: string): Promise<ProductResult | null>;
}
