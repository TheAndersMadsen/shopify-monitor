const wsClients = new Set<any>();

export function addWebSocketClient(ws: any) {
  wsClients.add(ws);
}

export function removeWebSocketClient(ws: any) {
  wsClients.delete(ws);
}

export function broadcastLog(message: string, type: "info" | "success" | "error" | "warning" = "info") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    type
  };
  
  const data = JSON.stringify(logEntry);
  wsClients.forEach((ws: any) => {
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

