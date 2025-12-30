import { ProductResult } from './types';
import { getJson } from 'serpapi';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

export function isSerpApiConfigured(): boolean {
  return !!SERPAPI_KEY;
}

export async function searchProductsWithSerpApi(query: string, limit: number = 3): Promise<ProductResult[]> {
  console.log(`[serpapi] Searching Google Shopping for "${query}"...`);
  
  if (!SERPAPI_KEY) {
    console.error('[serpapi] SERPAPI_KEY not set');
    return [];
  }

  try {
    const response = await getJson({
      engine: "google_shopping",
      q: query,
      location: "United Kingdom",
      hl: "en",
      gl: "uk",
      api_key: SERPAPI_KEY,
      num: limit * 2,
    });

    const shoppingResults = response.shopping_results || [];
    
    if (shoppingResults.length === 0) {
      console.log(`[serpapi] No shopping results found for "${query}"`);
      return [];
    }

    const results: ProductResult[] = shoppingResults.slice(0, limit).map((item: any) => {
      const priceString = item.extracted_price || item.price;
      let price: number | null = null;
      
      if (typeof priceString === 'number') {
        price = priceString;
      } else if (typeof priceString === 'string') {
        const match = priceString.match(/[\d,.]+/);
        if (match) {
          price = parseFloat(match[0].replace(',', ''));
        }
      }

      const sizeMatch = item.title?.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|L|ml|kg|g|pk|pack)/i);
      
      return {
        productName: item.title || 'Unknown Product',
        brand: null,
        price: price,
        currency: 'GBP',
        sizeValue: sizeMatch ? parseFloat(sizeMatch[1]) : null,
        sizeUnit: sizeMatch ? sizeMatch[2] : null,
        sizeLabel: sizeMatch ? `${sizeMatch[1]}${sizeMatch[2]}` : null,
        storeName: item.source || 'Google Shopping',
        productUrl: item.link || item.product_link || '',
        sku: item.product_id || null,
        inStock: item.in_stock !== false,
        lastCheckedAt: new Date(),
        rating: item.rating || null,
        reviewCount: item.reviews || null,
        imageUrl: item.thumbnail || null,
      };
    });

    console.log(`[serpapi] Found ${results.length} real products for "${query}"`);
    return results;
  } catch (error) {
    console.error('[serpapi] Error:', error);
    return [];
  }
}
