# Star Gifter — мини-приложение и Telegram-бот

Полноценная связка: веб-приложение (Vite + React) и Telegram-бот на aiogram, который открывает ваш домен по кнопке в `/start`.

## Требования

- Node.js 20+ (npm 10+). Для nvm добавлен файл `.nvmrc`, так что перед установкой можно выполнить `nvm use`.
- Python 3.10+ (для запуска Telegram-бота и проверки версии Node в скрипте `start.sh`).

## Настройка окружения (как в репозитории miniapp)

1. Скопируйте примеры переменных окружения:
   ```sh
   cp .env.example .env
   cp .env.local.example .env.local
   ```
2. Заполните `.env` (бот):
   - `BOT_TOKEN` — токен из @BotFather.
   - `WEB_APP_URL` — домен/URL вашего мини-приложения, который должен открываться из бота.
   - (опционально) `MINI_APP_URL` — если нужно открыть другую ссылку.
   - (опционально) `MINI_APP_BUTTON` — текст кнопки в `/start`.
3. Заполните `.env.local` (frontend, Vite):
   - `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`, если используете Supabase.

## Запуск

### Быстрый старт одной командой
```sh
./start.sh
```
Скрипт подхватит `.env`, установит зависимости и запустит одновременно Telegram-бота и дев-сервер Vite на `http://localhost:5173`.

### Разработка вручную
```sh
# Frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173

# Bot
python -m venv .venv && source .venv/bin/activate
pip install -r bot/requirements.txt
python bot/main.py
```

## Что где хранится

- `.env` — чувствительные данные бота (токен, домен мини-приложения).
- `.env.local` — переменные фронтенда, которые будут доступны в Vite (`VITE_...`).

## Стек

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- aiogram (бот)
