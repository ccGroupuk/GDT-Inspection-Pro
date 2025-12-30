import { ProductResult } from './types';

const BNQ_API_BASE = 'https://api.impact.com/Mediapartners';

export async function searchBnqProducts(
  query: string,
  limit: number = 5
): Promise<ProductResult[]> {
  const apiKey = process.env.BNQ_API_KEY;
  const accountSid = process.env.BNQ_ACCOUNT_SID;
  const campaignId = process.env.BNQ_CAMPAIGN_ID;

  if (!apiKey || !accountSid) {
    console.log('[bnq-api] B&Q API credentials not configured');
    return [];
  }

  try {
    console.log(`[bnq-api] Searching B&Q for "${query}"...`);

    const auth = Buffer.from(`${accountSid}:${apiKey}`).toString('base64');
    
    const searchParams = new URLSearchParams({
      Query: query,
      PageSize: limit.toString(),
      CampaignId: campaignId || '',
    });

    const response = await fetch(
      `${BNQ_API_BASE}/${accountSid}/Catalogs/ItemSearch.json?${searchParams}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[bnq-api] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.Items || !Array.isArray(data.Items)) {
      console.log('[bnq-api] No items in response');
      return [];
    }

    const results: ProductResult[] = data.Items.slice(0, limit).map((item: any) => ({
      productName: item.Name || item.ProductName || 'Unknown Product',
      brand: item.Manufacturer || item.Brand || null,
      price: parseFloat(item.CurrentPrice || item.Price || '0') || null,
      currency: 'GBP',
      sizeValue: null,
      sizeUnit: null,
      sizeLabel: item.Size || null,
      storeName: 'B&Q',
      productUrl: item.TrackingLink || item.Url || item.ProductUrl || '',
      sku: item.CatalogItemId || item.Sku || null,
      inStock: item.StockAvailability !== 'OutOfStock',
      lastCheckedAt: new Date(),
      imageUrl: item.ImageUrl || item.Image || null,
      rating: null,
      reviewCount: null,
    }));

    console.log(`[bnq-api] Found ${results.length} products from B&Q`);
    return results;

  } catch (error) {
    console.error('[bnq-api] Error:', error);
    return [];
  }
}

export function isBnqConfigured(): boolean {
  return !!(process.env.BNQ_API_KEY && process.env.BNQ_ACCOUNT_SID);
}
