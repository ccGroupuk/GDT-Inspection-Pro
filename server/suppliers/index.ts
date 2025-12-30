import { ProductResult } from './types';
import { searchBnqProducts, isBnqConfigured } from './bnq-api';
import { searchProductsWithGemini } from './gemini-search';
import { searchProductsWithAI } from './ai-search';

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
  
  // Priority 1: B&Q Affiliate API (real product data with affiliate links)
  if (isBnqConfigured()) {
    console.log(`[suppliers] Using B&Q Affiliate API (real data)...`);
    results = await searchBnqProducts(query, limit);
  }
  
  // Priority 2: Gemini AI (free)
  if (results.length === 0 && process.env.GEMINI_API_KEY) {
    console.log(`[suppliers] Using Gemini (free) for search...`);
    results = await searchProductsWithGemini(query, limit);
  }
  
  // Priority 3: OpenAI via Replit (costs credits)
  if (results.length === 0) {
    console.log(`[suppliers] Falling back to OpenAI...`);
    results = await searchProductsWithAI(query, limit);
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
  }

  return results;
}

export function clearCache(): void {
  searchCache.clear();
}

export function getSearchSourceStatus(): { source: string; configured: boolean }[] {
  return [
    { source: 'B&Q Affiliate API', configured: isBnqConfigured() },
    { source: 'Gemini AI (Free)', configured: !!process.env.GEMINI_API_KEY },
    { source: 'OpenAI (Replit AI)', configured: true },
  ];
}

export type { ProductResult, SupplierAdapter } from './types';
