# UI-компоненты (актуальный набор)

## Фактически используемые компоненты из `src/components/ui/*`

Анализ выполнен по импортам из `src/components`, `src/pages`, `src/hooks`, `src/contexts`.

- `avatar` (`src/components/pages/LeaderboardPage.tsx`)
- `switch` (`src/components/pages/GiftsPage.tsx`)
- `toast` (`src/hooks/use-toast.ts`)
- `button` (используется транзитивно внутри `src/components/ui/sidebar.tsx`)
- `dialog` (используется транзитивно внутри `src/components/ui/command.tsx`)
- `input` (используется транзитивно внутри `src/components/ui/sidebar.tsx`)
- `label` (используется транзитивно внутри `src/components/ui/form.tsx`)
- `separator` (используется транзитивно внутри `src/components/ui/sidebar.tsx`)
- `sheet` (используется транзитивно внутри `src/components/ui/sidebar.tsx`)
- `skeleton` (используется транзитивно внутри `src/components/ui/sidebar.tsx`)
- `toggle` (используется транзитивно внутри `src/components/ui/toggle-group.tsx`)
- `tooltip` (используется в `src/App.tsx` и транзитивно внутри `src/components/ui/sidebar.tsx`)
- `toaster` (используется в `src/App.tsx`)
- `sonner` (используется в `src/App.tsx`)

## Перенесенные на переходный этап

Неиспользуемые компоненты перенесены в `src/components/ui/_unused`.

Это временный буфер перед полным удалением. Для восстановления достаточно вернуть нужный файл в `src/components/ui` и поправить импорт.
