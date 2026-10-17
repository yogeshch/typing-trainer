# Typing Trainer — Targeted Typing Practice

A resource-efficient typing practice tool that drills specific "weak" characters on your keyboard. Built for performance on low-resource VPS environments (1GB RAM).

## Features

- **Targeted Practice:** Select specific characters you struggle with and get custom-generated practice text
- **Smart Text Generation:** Algorithmic n-gram engine generates natural-sounding paragraphs focused on your weak keys
- **Real-time Metrics:** Live WPM, accuracy, and per-key error tracking
- **Weak Key Detection:** Automatically identifies your historically worst-performing keys
- **Zero External APIs:** All text generation runs locally — no paid APIs or LLMs
- **Memory Efficient:** Backend idles under 40MB RAM, designed for 1GB VPS deployment

## Tech Stack

- **Frontend:** Astro 7 + Preact + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript (ES Modules)
- **Persistence:** Client-side localStorage (no database required)
- **Production:** Nginx reverse proxy + PM2 process manager

## Quick Start

### Prerequisites

- Node.js v20+
- npm v10+

### Development

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Start the API server (from server/)
cd ../server && npm run dev

# In a separate terminal, start the client (from client/)
cd client && npm run dev
```

The client runs at `http://localhost:4321` and the API at `http://localhost:3001`.

### Production Build

```bash
# Build server
cd server && npm run build

# Build client
cd ../client && npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Public liveness check (`{ status: "ok" }`). Pass `?token=...` or `x-health-token` for full diagnostics |
| GET | `/api/generate?keys=x,z,q&words=75` | Generate practice text targeting specified keys |

### Generate Parameters

- `keys` (required): Comma-separated characters to target (1–10 chars)
- `words` (optional): Word count, 30–150 (default: 75)

## Production Deployment (Ubuntu VPS)

1. Run the VPS setup script:
   ```bash
   sudo bash deploy/setup-vps.sh
   ```

2. Install Node.js, PM2, and Nginx:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2
   ```

3. Build and deploy:
   ```bash
   cd server && npm install && npm run build
   cd ../client && npm install && npm run build
   ```

4. Start the API with PM2:
   ```bash
   cd server && pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

5. Configure Nginx:
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/typing-trainer
   sudo ln -s /etc/nginx/sites-available/typing-trainer /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx
   ```

## Memory Constraints

- Node.js heap limited to 150MB (`--max-old-space-size=150`)
- PM2 auto-restarts at 180MB RSS
- Typical idle memory: ~35–40MB
- Nginx configured with minimal buffer sizes

## License

MIT
