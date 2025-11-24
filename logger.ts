import type { ServerWebSocket } from "bun";

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

const wsClients = new Set<ServerWebSocket>();

export function addWebSocketClient(ws: ServerWebSocket) {
  wsClients.add(ws);
}

export function removeWebSocketClient(ws: ServerWebSocket) {
  wsClients.delete(ws);
}

export function broadcastLog(message: string, type: "info" | "success" | "error" | "warning" = "info") {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    message,
    type
  };
  
  const data = JSON.stringify(logEntry);
  wsClients.forEach((ws) => {
    if (ws.readyState === 1) {
      try {
        ws.send(data);
      } catch (e) {
        console.error("Failed to send log to client:", e);
      }
    }
  });
  
  const prefix = type === "error" ? "[-]" : type === "success" ? "[+]" : type === "warning" ? "[!]" : "[*]";
  console.log(`${prefix} ${message}`);
}

