import { write } from "bun";
import { loadConfig } from "./config";
import { broadcastLog } from "./logger";

const DB_PATH = "./data/products_db.json";
interface Variant {
  id: number;
  title: string;
  price: string;
  available: boolean;
}

interface ProductImage {
  src: string;
}

interface Product {
  id: number;
  title: string;
  handle: string;
  updated_at: string;
  images: ProductImage[];
  variants: Variant[];
}

interface StoredProductData {
  title: string;
  updated_at: string;
  variants: Record<string, { price: string; available: boolean }>;
}

interface Database {
  [site: string]: Record<string, StoredProductData>;
}

async function loadDb(): Promise<Database> {
  try {
    const file = Bun.file(DB_PATH);
    if (await file.exists()) {
      return await file.json();
    }
  } catch (e) {
    broadcastLog("Database corrupted, starting fresh.", "error");
  }
  return {};
}

async function saveDb(db: Database) {
  await write(DB_PATH, JSON.stringify(db, null, 2));
}

async function getProducts(baseUrl: string, userAgent: string): Promise<Product[]> {
  const url = `${baseUrl}/products.json?limit=250`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent }
    });
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const data = await response.json() as any;
    return data.products || [];
  } catch (error) {
    broadcastLog(`Error fetching ${baseUrl}: ${error}`, "error");
    return [];
  }
}

async function sendWebhook(product: Product, site: string, webhookUrl: string, type: "NEW" | "UPDATE", changes?: string) {
  const color = type === "NEW" ? 3066993 : 16776960;
  const productUrl = `${site}/products/${product.handle}`;
  const imageUrl = product.images.length > 0 ? product.images[0].src : "";
  const domain = site.replace(/^https?:\/\//, "");

  let variantText = "";
  for (const v of product.variants) {
    const atc = `${site}/cart/${v.id}:1`;
    const icon = v.available ? "🟢" : "🔴";
    variantText += `${icon} **${v.title}** - $${v.price}\n[Add To Cart](${atc})\n\n`;
  }

  if (variantText.length > 1024) variantText = variantText.substring(0, 1020) + "...";

  const payload = {
    username: "Shopify Monitor",
    avatar_url: "https://cdn.shopify.com/s/files/1/0533/2089/files/shopify-icon.png",
    embeds: [{
      title: `[${type}] ${product.title}`,
      url: productUrl,
      color: color,
      description: changes ? `**Changes Detected:**\n${changes}` : undefined,
      thumbnail: { url: imageUrl },
      fields: [{ name: "Variants", value: variantText || "No variants", inline: false }],
      footer: { text: `Monitor • ${domain}`, icon_url: "https://cdn.shopify.com/s/files/1/0533/2089/files/shopify-icon.png" },
      timestamp: new Date().toISOString()
    }]
  };

  if (!webhookUrl || webhookUrl.trim() === "") {
    broadcastLog(`[Dry Run] Webhook for ${product.title} (Configure URL to send)`, "warning");
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    broadcastLog(`Sent webhook for ${product.title}`, "success");
  } catch (e) {
    broadcastLog(`Failed to send webhook: ${e}`, "error");
  }
}

let monitorRunning = false;
let monitorAbortController: AbortController | null = null;

export async function startMonitor() {
  if (monitorRunning) {
    broadcastLog("Monitor is already running", "warning");
    return;
  }

  monitorRunning = true;
  monitorAbortController = new AbortController();
  
  broadcastLog("Starting Bun Shopify Monitor v2025", "info");
  
  const db = await loadDb();
  let isFirstRun = true;

  while (!monitorAbortController.signal.aborted) {
    try {
      const config = await loadConfig();
      
      if (isFirstRun) {
        broadcastLog(`Monitoring ${config.sites.length} sites. Interval: ${config.delayMs}ms`, "info");
        isFirstRun = false;
      }

      for (const site of config.sites) {
        if (monitorAbortController.signal.aborted) break;
        
        if (!db[site]) db[site] = {};
        
        broadcastLog(`Checking ${site}...`, "info");
        const products = await getProducts(site, config.userAgent);

        for (const p of products) {
          if (monitorAbortController.signal.aborted) break;
          
          const pid = String(p.id);
          const currentVariants = p.variants.reduce((acc, v) => {
            acc[String(v.id)] = { price: v.price, available: v.available };
            return acc;
          }, {} as Record<string, { price: string; available: boolean }>);

          if (!db[site][pid]) {
            broadcastLog(`New Product: ${p.title}`, "success");
            if (Object.keys(db[site]).length > 0) {
              await sendWebhook(p, site, config.webhookUrl, "NEW");
            }
            
            db[site][pid] = {
              title: p.title,
              updated_at: p.updated_at,
              variants: currentVariants
            };
            continue;
          }

          const savedData = db[site][pid];
          const changes: string[] = [];

          for (const [vid, vData] of Object.entries(currentVariants)) {
            const oldV = savedData.variants[vid];
            if (!oldV) {
              changes.push(`New Variant: ID ${vid}`);
              continue;
            }
            if (vData.price !== oldV.price) {
              changes.push(`Price: $${oldV.price} -> $${vData.price}`);
            }
            if (vData.available !== oldV.available) {
              const status = vData.available ? "In Stock" : "Out of Stock";
              changes.push(`Stock: ${status} (Variant ${vid})`);
            }
          }

          if (changes.length > 0) {
            broadcastLog(`Update: ${p.title} - ${changes.join(", ")}`, "success");
            await sendWebhook(p, site, config.webhookUrl, "UPDATE", changes.join("\n"));
            
            db[site][pid].updated_at = p.updated_at;
            db[site][pid].variants = currentVariants;
          }
        }
      }

      await saveDb(db);
      
      const currentConfig = await loadConfig();
      await Bun.sleep(currentConfig.delayMs);
    } catch (error) {
      broadcastLog(`Monitor error: ${error}`, "error");
      await Bun.sleep(5000);
    }
  }
  
  monitorRunning = false;
  broadcastLog("Monitor stopped", "info");
}

export function stopMonitor() {
  if (monitorAbortController) {
    monitorAbortController.abort();
    monitorRunning = false;
    broadcastLog("Stopping monitor...", "info");
  }
}

export function restartMonitor() {
  stopMonitor();
  setTimeout(() => {
    startMonitor();
  }, 1000);
}