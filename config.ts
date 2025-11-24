import { write } from "bun";
import { z } from "zod";

export interface MonitorConfig {
  sites: string[];
  webhookUrl: string;
  delayMs: number;
  userAgent: string;
}

const CONFIG_PATH = "./data/config.json";

const DEFAULT_CONFIG: MonitorConfig = {
  sites: [],
  webhookUrl: "",
  delayMs: 60000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
};

export const ConfigSchema = z.object({
  sites: z.array(z.string().url().startsWith("http")),
  webhookUrl: z.string().url().startsWith("https").or(z.literal("")).optional().default(""),
  delayMs: z.number().int().min(10000).max(3600000),
  userAgent: z.string().min(1)
});

export async function loadConfig(): Promise<MonitorConfig> {
  try {
    const configFile = Bun.file(CONFIG_PATH);
    if (await configFile.exists()) {
      const saved = await configFile.json();
      const parsed = ConfigSchema.partial().safeParse(saved);
      if (parsed.success) {
        const merged = {
          ...DEFAULT_CONFIG,
          ...parsed.data,
          webhookUrl: parsed.data.webhookUrl ?? DEFAULT_CONFIG.webhookUrl
        } satisfies MonitorConfig;
        return merged;
      }
    }
  } catch (e) {
    console.error("[-] Config corrupted, using defaults.");
  }
  return DEFAULT_CONFIG;
}

export async function saveConfig(config: MonitorConfig): Promise<void> {
  await write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

