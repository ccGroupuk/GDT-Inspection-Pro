import { ProductResult } from './types';
import { searchBnqProducts, isBnqConfigured } from './bnq-api';
import { searchProductsWithGemini } from './gemini-search';
import { searchProductsWithAI } from './ai-search';
import { searchProductsWithSerpApi, isSerpApiConfigured } from './serpapi-search';

const searchCache = new Map<string, { results: ProductResult[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function searchSuppliers(
  query: string,
  limit: number = 5,
  supplierFilter?: string[]
): Promise<ProductResult[]> {
  const cacheKey = `${query.toLowerCase()}_${limit}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[suppliers] Cache hit for "${query}"`);
    return cached.results;
  }

  console.log(`[suppliers] Searching for "${query}" (limit: ${limit})...`);
  
  let results: ProductResult[] = [];
  
  // Priority 1: SerpApi Google Shopping (real prices from actual stores)
  if (isSerpApiConfigured()) {
    console.log(`[suppliers] Using SerpApi Google Shopping (real prices)...`);
    results = await searchProductsWithSerpApi(query, limit);
    results = results.map(r => ({ ...r, source: 'serpapi' as const, isRealPrice: true }));
  }
  
  // Priority 2: B&Q Affiliate API (real product data with affiliate links)
  if (results.length === 0 && isBnqConfigured()) {
    console.log(`[suppliers] Using B&Q Affiliate API (real data)...`);
    results = await searchBnqProducts(query, limit);
    results = results.map(r => ({ ...r, source: 'bnq_api' as const, isRealPrice: true }));
  }
  
  // Priority 3: Gemini AI (free but estimated prices)
  if (results.length === 0 && process.env.GEMINI_API_KEY) {
    console.log(`[suppliers] Using Gemini (free) for search - ESTIMATED PRICES...`);
    results = await searchProductsWithGemini(query, limit);
    results = results.map(r => ({ ...r, source: 'gemini_estimate' as const, isRealPrice: false }));
  }
  
  // Priority 4: OpenAI via Replit (costs credits, estimated prices)
  if (results.length === 0) {
    console.log(`[suppliers] Falling back to OpenAI - ESTIMATED PRICES...`);
    results = await searchProductsWithAI(query, limit);
    results = results.map(r => ({ ...r, source: 'ai_estimate' as const, isRealPrice: false }));
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
  }

  return results;
}

export function clearCache(): void {
  searchCache.clear();
}

export function getSearchSourceStatus(): { source: string; configured: boolean; isRealPrice: boolean }[] {
  return [
    { source: 'SerpApi Google Shopping', configured: isSerpApiConfigured(), isRealPrice: true },
    { source: 'B&Q Affiliate API', configured: isBnqConfigured(), isRealPrice: true },
    { source: 'Gemini AI (Estimates)', configured: !!process.env.GEMINI_API_KEY, isRealPrice: false },
    { source: 'OpenAI (Estimates)', configured: true, isRealPrice: false },
  ];
}

export type { ProductResult, SupplierAdapter, PriceSource } from './types';
