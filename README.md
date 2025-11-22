# Shopify Monitor

A web-based dashboard for monitoring Shopify stores for new products and updates, with real-time logs via WebSocket.

## Features

- 🎛️ **Web Dashboard**: Manage configuration through a beautiful web interface
- 📊 **Real-time Logs**: View monitoring activity in real-time via WebSocket
- 🔔 **Discord Notifications**: Get alerts for new products and updates
- 🐳 **Docker Support**: Easy deployment with Docker Compose
- ⚡ **Built with Bun**: Fast and efficient runtime

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0.0 or later)
- Docker (optional, for containerized deployment)

## Installation

### Using Bun

```bash
# Clone the repository
git clone https://github.com/TheAndersMadsen/shopify-monitor.git
cd shopify-monitor

# Install dependencies
bun install

# Start the server
bun run start
```

The dashboard will be available at `http://localhost:3000`

### Using Docker

```bash
# Clone the repository
git clone https://github.com/TheAndersMadsen/shopify-monitor.git
cd shopify-monitor

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

The dashboard will be available at `http://localhost:3000`

## Configuration

1. Open the dashboard at `http://localhost:3000`
2. Add Shopify store URLs to monitor (one per line)
3. Set your Discord webhook URL (optional)
4. Configure the check interval (in milliseconds)
5. Click "Save Configuration"

Configuration is automatically saved to `./data/config.json` and the monitor will restart with the new settings.

**Note**: The `data/` directory is excluded from git to protect your configuration and product database.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `WEBHOOK_URL`: Default Discord webhook URL (can be overridden in dashboard)

## What It Monitors

- **New Products**: Detects when new products are added to monitored stores
- **Price Changes**: Alerts when product prices are updated
- **Stock Changes**: Notifies when items go in/out of stock
- **New Variants**: Detects when new product variants are added

## Project Structure

```
shopify-monitor/
├── server.ts          # Main server with HTTP and WebSocket support
├── monitor.ts         # Core monitoring logic
├── config.ts          # Configuration management
├── logger.ts          # WebSocket log broadcasting
├── dashboard.html     # Web dashboard interface
├── Dockerfile         # Docker container configuration
├── docker-compose.yml # Docker Compose configuration
└── data/              # Runtime data (excluded from git)
    ├── config.json    # User configuration
    └── products_db.json # Product tracking database
```

## Development

```bash
# Run in development mode
bun run dev

# The server will automatically reload on file changes
```

## License

MIT License - see [LICENSE](LICENSE) file for details
