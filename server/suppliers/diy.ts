import { chromium, Browser, Page } from 'playwright';
import { ProductResult, SupplierAdapter } from './types';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browser;
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function parseSize(text: string): { value: number | null; unit: string | null; label: string | null } {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(ml|l|litre|ltr|g|kg|mm|m|cm|pack|each|sheet|roll)/i);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      label: `${match[1]}${match[2]}`,
    };
  }
  return { value: null, unit: null, label: null };
}

function extractBrand(productName: string): string | null {
  const knownBrands = [
    'No Nonsense', 'Soudal', 'Everbuild', 'UniBond', 'Ronseal', 'Dulux', 
    'Polycell', 'Evo-Stik', 'Gorilla', 'CT1', 'Geocel', 'Bond It',
    'Wickes', 'Diall', 'Mac Allister', 'Magnusson', 'Stanley', 'DeWalt'
  ];
  
  for (const brand of knownBrands) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}

export const diyAdapter: SupplierAdapter = {
  name: 'B&Q',
  domain: 'diy.com',

  async search(query: string, limit: number = 10): Promise<ProductResult[]> {
    const results: ProductResult[] = [];
    let page: Page | null = null;

    try {
      const browserInstance = await getBrowser();
      page = await browserInstance.newPage();
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en;q=0.9',
      });

      const searchUrl = `https://www.diy.com/search?term=${encodeURIComponent(query)}`;
      console.log(`[diy.com] Searching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      await page.waitForTimeout(2000);

      try {
        const cookieButton = await page.$('button[data-testid="cookie-accept-all"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
      }

      await page.waitForTimeout(2000);

      const productCards = await page.$$('[data-testid="product-card"], .product-card, [class*="ProductCard"], article[data-product-id]');
      console.log(`[diy.com] Found ${productCards.length} product cards`);

      for (let i = 0; i < Math.min(productCards.length, limit); i++) {
        try {
          const card = productCards[i];
          
          const nameEl = await card.$('h3, [data-testid="product-title"], [class*="title"], a[href*="/departments/"]');
          const productName = nameEl ? (await nameEl.textContent())?.trim() || '' : '';
          
          const priceEl = await card.$('[data-testid="product-price"], [class*="price"], [class*="Price"]');
          let priceText = priceEl ? (await priceEl.textContent())?.trim() || '' : '';
          const priceMatch = priceText.match(/£?([\d,]+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
          
          const linkEl = await card.$('a[href*="/departments/"]');
          const href = linkEl ? await linkEl.getAttribute('href') : null;
          const productUrl = href ? (href.startsWith('http') ? href : `https://www.diy.com${href}`) : '';
          
          const skuMatch = productUrl.match(/\/(\d+_BQ)\.prd/);
          const sku = skuMatch ? skuMatch[1] : null;

          if (productName && price !== null) {
            const size = parseSize(productName);
            const brand = extractBrand(productName);
            
            results.push({
              productName,
              brand,
              price,
              currency: 'GBP',
              sizeValue: size.value,
              sizeUnit: size.unit,
              sizeLabel: size.label,
              storeName: 'B&Q',
              productUrl,
              sku,
              inStock: null,
              lastCheckedAt: new Date(),
            });
          }
        } catch (cardError) {
          console.error(`[diy.com] Error parsing card ${i}:`, cardError);
        }
      }

    } catch (error) {
      console.error('[diy.com] Search error:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return results;
  },
};

process.on('exit', () => {
  closeBrowser();
});

process.on('SIGINT', () => {
  closeBrowser();
  process.exit();
});
