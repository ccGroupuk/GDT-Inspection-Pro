import { ProductResult } from './types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function searchProductsWithGemini(query: string, limit: number = 5): Promise<ProductResult[]> {
  console.log(`[gemini-search] Searching for "${query}" with Gemini...`);
  
  if (!GEMINI_API_KEY) {
    console.error('[gemini-search] GEMINI_API_KEY not set');
    return [];
  }

  const prompt = `You are a UK trade supplies product database. When given a search query, return realistic product results that would be found at major UK trade suppliers like B&Q, Screwfix, Toolstation, Wickes, Travis Perkins.

Return ONLY valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "productName": "Full product name with brand and size",
    "brand": "Brand name or null",
    "price": 12.99,
    "currency": "GBP",
    "sizeValue": 5,
    "sizeUnit": "L",
    "sizeLabel": "5L",
    "storeName": "B&Q",
    "productUrl": "https://www.diy.com/departments/product-name/12345",
    "sku": "12345678",
    "inStock": true
  }
]

Rules:
- Return ${limit} products maximum
- Use realistic UK prices in GBP
- Include a mix of stores (B&Q, Screwfix, Toolstation, Wickes)
- Use real brand names common in UK (Dulux, Ronseal, UniBond, DeWalt, Stanley, etc.)
- Make product names specific and realistic
- Include size/quantity where applicable
- Sort by price (lowest first)

Search: ${query}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[gemini-search] API error:', error);
      return [];
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    let products: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[gemini-search] Failed to parse response:', parseError);
      return [];
    }

    const results: ProductResult[] = products.map(p => ({
      productName: p.productName || '',
      brand: p.brand || null,
      price: typeof p.price === 'number' ? p.price : null,
      currency: p.currency || 'GBP',
      sizeValue: p.sizeValue || null,
      sizeUnit: p.sizeUnit || null,
      sizeLabel: p.sizeLabel || null,
      storeName: p.storeName || 'Unknown',
      productUrl: p.productUrl || '',
      sku: p.sku || null,
      inStock: p.inStock ?? null,
      lastCheckedAt: new Date(),
    }));

    console.log(`[gemini-search] Found ${results.length} products for "${query}"`);
    return results;
  } catch (error) {
    console.error('[gemini-search] Error:', error);
    return [];
  }
}
