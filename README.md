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

#### Option 1: Using Docker Compose (Build Locally)

```bash
# Clone the repository
git clone https://github.com/TheAndersMadsen/shopify-monitor.git
cd shopify-monitor

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option 2: Using Pre-built Image from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/theandersmadsen/shopify-monitor:latest

# Run the container
docker run -d \
  --name shopify-monitor \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  ghcr.io/theandersmadsen/shopify-monitor:latest
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

**Note**: All monitor configuration (sites, webhook URL, delay) is managed through the web dashboard and persisted in `./data/config.json`. No environment variables are needed for monitor settings.

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

## Docker Image

Pre-built Docker images are automatically built and pushed to [GitHub Container Registry](https://github.com/TheAndersMadsen/shopify-monitor/pkgs/container/shopify-monitor) on every push to the main branch and when tags are created.

### Available Tags

- `latest` - Latest build from main branch
- `main` - Build from main branch
- `v*` - Semantic version tags (e.g., `v2.0.0`)
- `main-<sha>` - Builds tagged with commit SHA

### Pull and Run

```bash
docker pull ghcr.io/theandersmadsen/shopify-monitor:latest
```

Or use the provided `docker-compose.ghcr.yml`:

```bash
docker-compose -f docker-compose.ghcr.yml up -d
```

## License

MIT License - see [LICENSE](LICENSE) file for details
