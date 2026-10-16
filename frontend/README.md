# Agent Control Tower (ACT) — Frontend

> Real-time orchestration, monitoring, lineage DAG, and governance dashboard for multi-agent systems running on LangChain, AutoGen, and CrewAI.

## Tech Stack
- **Framework**: Next.js 14 (App Router, Standalone mode, TypeScript strict)
- **Styling**: TailwindCSS, CSS Variables, dark-first 'air-traffic control room' theme
- **UI Components**: shadcn/ui (New York zinc), Radix UI primitives, Lucide Icons
- **State & Stream Management**: Zustand with bounded event buffers, native WebSockets
- **DAG Lineage**: `@xyflow/react` (React Flow v12) + `@dagrejs/dagre`
- **Charts & Metrics**: Recharts
- **Toasts**: Sonner
- **Testing**: Vitest + React Testing Library + jsdom

## Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Configured variables:
- `NEXT_PUBLIC_API_URL`: Backend FastAPI HTTP endpoint (default `http://localhost:8000`)
- `NEXT_PUBLIC_WS_URL`: Backend WebSocket endpoint (default `ws://localhost:8000`)
- `NEXT_PUBLIC_USE_MOCK`: Enable mock data simulation if backend is offline (`true` / `false`)

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Control Tower.

### 4. Code Quality & Testing
```bash
npm run lint       # Run Next.js ESLint
npm run typecheck  # Run strict TypeScript compiler check (tsc --noEmit)
npm run test       # Run Vitest test suite
npm run build      # Create production standalone build
```

## Docker Service
Build and run with Docker:
```bash
docker build -t agent-control-tower-frontend .
docker run -p 3000:3000 agent-control-tower-frontend
```
