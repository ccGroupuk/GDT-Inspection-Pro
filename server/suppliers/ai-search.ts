import OpenAI from 'openai';
import { ProductResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function searchProductsWithAI(query: string, limit: number = 5): Promise<ProductResult[]> {
  console.log(`[ai-search] Searching for "${query}" with AI...`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a UK trade supplies product database. When given a search query, return realistic product results that would be found at major UK trade suppliers like B&Q, Screwfix, Toolstation, Wickes, Travis Perkins.

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
    "inStock": true,
    "category": "paint"
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
- Include a category for each product (paint, wood, screws, tools, adhesive, sealant, electrical, plumbing, flooring, hardware)`
        },
        {
          role: 'user',
          content: `Search: ${query}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Parse JSON from response
    let products: any[] = [];
    try {
      // Handle potential markdown wrapping
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[ai-search] Failed to parse AI response:', parseError);
      return [];
    }

    // Map to ProductResult format
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

    console.log(`[ai-search] Found ${results.length} products for "${query}"`);
    return results;
  } catch (error) {
    console.error('[ai-search] Error:', error);
    return [];
  }
}
