# Kushbas Quiz Pro

Интерактивный quiz-платформер для оценки лидерских компетенций. Ведущий создает игру, участники подключаются, отвечают на вопросы, а результаты отображаются в live-формате.

## Для кого

Проект рассчитан на офлайн/онлайн мероприятия для директоров, школьных команд и образовательных программ. Формат похож на live-quiz: есть host, игроки, QR/подключение, вопросы, баллы и итоговый рейтинг.

## Ключевые функции

- создание игры ведущим;
- lobby для участников;
- подключение игрока;
- игровой экран host;
- игровой экран player;
- подсчет результатов;
- TOP-лидерборд;
- admin panel для управления вопросами;
- звуки и визуальная обратная связь;
- Supabase backend.

## Стек

- Vite;
- React 18;
- TypeScript;
- React Router;
- Supabase;
- Tailwind CSS;
- shadcn/ui;
- qrcode.react;
- canvas-confetti;
- Vitest.

## Архитектура

Routes описаны в `src/App.tsx`: `/host`, `/host/game/:gameId`, `/join`, `/play/:gameId/:playerId` и `/admin`. Типы игры находятся в `src/lib/game-types.ts`, игровая логика — в `src/lib/game-utils.ts`, UI результатов — в `src/components/game`.

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run dev
```

## Переменные окружения

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## Проверки

```bash
npm run lint
npm run build
npm run test
```

## Статус

Публичный MVP live-quiz продукта. Перед большим мероприятием нужно проверить RLS, лимиты realtime-подписок и сценарий восстановления игры.

## Что демонстрирует в портфолио

- multiplayer/event flow в браузере;
- работу с host/player ролями;
- stateful realtime-продукт поверх Supabase;
- интерактивный EdTech/leadership формат.
