# Aether Control Room

## Overview
Multi-agent AI orchestration dashboard where users ask a question and watch 6 specialized agents (Coordinator, Researcher, Skeptic, Coder, Writer, Summarizer) collaborate across multiple rounds in real-time via SSE streaming. Uses a provider-agnostic architecture with MockProvider for testing.

## Architecture
- **Frontend**: React + Vite + Tailwind + shadcn/ui + wouter routing
- **Backend**: Express API with SSE streaming
- **Database**: PostgreSQL with Drizzle ORM
- **Provider**: MockProvider (swap to real AI by editing server/providers/mockProvider.ts)

## Key Pages
- `/` - Control Room (3-column dashboard)
- `/admin` - Admin panel (Users, Prompt Studio, Triggers)

## Key Files
- `shared/schema.ts` - Data models (users, rooms, runs, messages, prompts, triggers)
- `server/routes.ts` - All API endpoints
- `server/orchestrator.ts` - Multi-agent round loop with SSE
- `server/providers/mockProvider.ts` - Mock AI responses
- `server/providers/types.ts` - Provider interface for swapping AI backends
- `client/src/pages/control-room.tsx` - Main dashboard
- `client/src/pages/admin.tsx` - Admin panel
- `client/src/lib/sse.ts` - SSE client connection

## API Routes
- POST /api/run/start - Start multi-agent run
- POST /api/run/stop - Stop/pause a run
- POST /api/run/continue - Continue with one more round
- GET /api/run/stream?runId= - SSE event stream
- GET/POST /api/rooms, /api/users, /api/prompts, /api/triggers
- GET /api/rooms/:id/messages

## Design
- Inter font, JetBrains Mono for code
- Electric blue primary (#0070F3), deep purple secondary
- 3-column layout: Left sidebar (rooms/users/settings), Center (timeline), Right (agent monitor)
