import { write } from "bun";

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

export async function loadConfig(): Promise<MonitorConfig> {
  try {
    const configFile = Bun.file(CONFIG_PATH);
    if (await configFile.exists()) {
      const saved = await configFile.json() as Partial<MonitorConfig>;
      return {
        ...DEFAULT_CONFIG,
        ...saved,
        webhookUrl: saved.webhookUrl ?? DEFAULT_CONFIG.webhookUrl
      };
    }
  } catch (e) {
    console.error("[-] Config corrupted, using defaults.");
  }
  return DEFAULT_CONFIG;
}

export async function saveConfig(config: MonitorConfig): Promise<void> {
  await write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

