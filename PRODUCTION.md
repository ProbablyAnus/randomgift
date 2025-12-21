# Production (Caddy + Telegram Mini App)

## 1) Env
Create `.env` in repo root:

```env
BOT_TOKEN=123456:AAAA...
WEB_APP_URL=https://your-domain.com

# Supabase (keep yours):
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."
```

## 2) Caddy
Copy example and edit domain/path:

```bash
sudo cp ./Caddyfile.prod.example /etc/caddy/Caddyfile
sudo caddy reload --config /etc/caddy/Caddyfile
```

The example Caddyfile also proxies `/api/*` to the bot's API server on port 8080.
If you changed `API_PORT`, update the `reverse_proxy` target accordingly.

## 3) Run
```bash
./start.sh
```

Caddy serves the built фронт from `dist/`.
The bot runs in the foreground (good for systemd/pm2).
