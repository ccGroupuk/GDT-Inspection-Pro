import { ProductResult, SupplierAdapter } from './types';
import { diyAdapter } from './diy';

const searchCache = new Map<string, { results: ProductResult[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

const adapters: SupplierAdapter[] = [
  diyAdapter,
];

export async function searchSuppliers(
  query: string,
  limit: number = 3,
  supplierFilter?: string[]
): Promise<ProductResult[]> {
  const cacheKey = `${query.toLowerCase()}_${limit}_${(supplierFilter || []).join(',')}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[suppliers] Cache hit for "${query}"`);
    return cached.results;
  }

  const activeAdapters = supplierFilter
    ? adapters.filter(a => supplierFilter.includes(a.name))
    : adapters;

  const allResults: ProductResult[] = [];

  for (const adapter of activeAdapters) {
    try {
      console.log(`[suppliers] Searching ${adapter.name} for "${query}"...`);
      const results = await adapter.search(query, limit * 2);
      allResults.push(...results);
    } catch (error) {
      console.error(`[suppliers] Error searching ${adapter.name}:`, error);
    }
  }

  const validResults = allResults
    .filter(r => r.price !== null && r.price > 0)
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, limit);

  searchCache.set(cacheKey, { results: validResults, timestamp: Date.now() });

  console.log(`[suppliers] Returning ${validResults.length} results for "${query}"`);
  return validResults;
}

export function clearCache(): void {
  searchCache.clear();
}

export { ProductResult } from './types';
