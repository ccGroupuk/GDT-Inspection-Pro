import { ProductResult } from './types';
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
  
  // Try Gemini first (free), fallback to OpenAI (costs credits)
  let results: ProductResult[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    console.log(`[suppliers] Using Gemini (free) for search...`);
    results = await searchProductsWithGemini(query, limit);
  }
  
  // Fallback to OpenAI if Gemini not configured or failed
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

export type { ProductResult, SupplierAdapter } from './types';
