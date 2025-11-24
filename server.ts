import { z } from "zod";
import { loadConfig, saveConfig, type MonitorConfig, ConfigSchema } from "./config";
import { startMonitor, restartMonitor } from "./monitor";
import { addWebSocketClient, removeWebSocketClient, broadcastLog } from "./logger";

async function ensureDataDir() {
  try {
    await Bun.write("./data/.gitkeep", "");
  } catch (e) {
  }
}

async function startServer() {
  await ensureDataDir();
  
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  startMonitor();
  
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      
      const origin = req.headers.get("origin") ?? "*";
      const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      };
      
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
      
      if (url.pathname === "/ws") {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response("WebSocket upgrade failed", { status: 400 });
        }
        return undefined;
      }
      
      if (url.pathname === "/health") {
        return Response.json({ status: "ok" }, { headers: corsHeaders });
      }

      if (url.pathname === "/api/config") {
        if (req.method === "GET") {
          const config = await loadConfig();
          return Response.json(config, { headers: corsHeaders });
        }

        if (req.method === "POST" || req.method === "PUT") {
          try {
            const payload = await req.json();
            const parsed = ConfigSchema.partial().safeParse(payload);
            if (!parsed.success) {
              return Response.json({ success: false, error: parsed.error.flatten() }, {
                status: 400,
                headers: corsHeaders
              });
            }
            const newConfig = parsed.data as Partial<MonitorConfig>;
            const currentConfig = await loadConfig();
            const updatedConfig: MonitorConfig = {
              ...currentConfig,
              ...newConfig,
              sites: newConfig.sites ?? currentConfig.sites,
              delayMs: newConfig.delayMs ?? currentConfig.delayMs,
              webhookUrl: newConfig.webhookUrl ?? currentConfig.webhookUrl,
              userAgent: newConfig.userAgent ?? currentConfig.userAgent
            };
            await saveConfig(updatedConfig);
            broadcastLog("Configuration updated - restarting monitor...", "success");
            setTimeout(() => restartMonitor(), 500);
            return Response.json({ success: true, config: updatedConfig }, { headers: corsHeaders });
          } catch (e) {
            return Response.json({ success: false, error: String(e) }, { 
              status: 400,
              headers: corsHeaders 
            });
          }
        }
      }
      
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const dashboard = await Bun.file("./dashboard.html").text();
        return new Response(dashboard, {
          headers: {
            "Content-Type": "text/html",
            ...corsHeaders
          }
        });
      }
      
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    },
    websocket: {
      message(_ws, message) {
        try {
          const CommandSchema = z.object({ type: z.literal("restart_monitor") });
          const maybe = CommandSchema.safeParse(JSON.parse(message.toString()));
          if (maybe.success) {
            restartMonitor();
          }
        } catch (e) {
        }
      },
      open(ws) {
        addWebSocketClient(ws);
        broadcastLog("Client connected", "info");
      },
      close(ws) {
        removeWebSocketClient(ws);
        broadcastLog("Client disconnected", "info");
      }
    }
  });
  
  console.log(`[*] Server running on http://localhost:${port}`);
  console.log(`[*] Dashboard available at http://localhost:${port}`);
  broadcastLog(`Server started on port ${port}`, "success");
}

startServer().catch(console.error);

