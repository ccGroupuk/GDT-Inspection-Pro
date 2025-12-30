import { ProductResult } from './types';
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
  
  // Use AI-powered search - simple, reliable, fast
  const results = await searchProductsWithAI(query, limit);

  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
  }

  return results;
}

export function clearCache(): void {
  searchCache.clear();
}

export type { ProductResult, SupplierAdapter } from './types';
