# Repository Guidelines: Frontend Service (`test_frontend`)

This repository contains the single-page web client for the Project Tracker application. All agents, automation harnesses, and engineers must adhere to the conventions and guardrails defined below.

---

## 1. Tech Stack & Architecture

* **Framework**: React 19 (`react`, `react-dom`)
* **Build Tool & Dev Server**: Vite 7
* **Language**: TypeScript 5.8 (Strict Mode enabled)
* **Styling**: Tailwind CSS & CSS variables
* **Data Fetching & State**: `@tanstack/react-query`
* **Icons**: `lucide-react`
* **Linter**: ESLint (v9 flat config with `typescript-eslint` and `react-hooks`)

---

## 2. Directory Structure

```
test_frontend/
├── src/
│   ├── api.ts              # Strongly typed API client and resource helpers
│   ├── App.tsx             # Main dashboard UI component, filters, and cards
│   ├── main.tsx            # Application entrypoint and React root mount
│   ├── styles.css          # Tailwind CSS directives and custom styling
│   └── types.ts            # Centralized TypeScript domain interfaces and types
├── index.html              # Single page entry HTML
├── nginx.conf.template     # Production reverse-proxy and static asset server
├── package.json            # Node.js dependencies and script definitions
├── tsconfig.json           # Root TypeScript configuration
├── tsconfig.app.json       # App source TypeScript configuration
├── tsconfig.node.json      # Node/Vite build TypeScript configuration
└── vite.config.ts          # Vite bundler, proxy, and allowed hosts config
```

---

## 3. Mandatory Coding Rules & Guardrails

### 3.1 TypeScript & Type Safety
1. **Zero `any` Policy**: Never use `any`. Explicitly type all component props, state hooks, and API responses.
2. **Centralized Domain Models**: All entities (Project, Task, Member, Label, Status enums) MUST be defined in `src/types.ts`. Keep these in exact parity with backend Pydantic schemas.
3. **Strict Null Checks**: Always handle optional and nullable fields (e.g. `due_date: string | null`, `assignee_id: number | null`) with proper optional chaining or guards.

### 3.2 API Integration & Networking
1. **Use Centralized Client**: All network requests to the backend must go through `src/api.ts` (e.g. `api.projects.list()`, `api.tasks.create(...)`).
2. **Relative Endpoints Only**: Never hardcode `http://localhost:8000` or raw hostnames inside components. API calls must always target `/api/...`, which is automatically routed:
   * In development: via Vite's dev proxy to the backend container.
   * In production: via Nginx upstream routing.
3. **Optimistic Updates & Query Invalidation**: When using `@tanstack/react-query`, invalidate related queries (e.g. `queryClient.invalidateQueries({ queryKey: ["tasks"] })`) on mutation success.

### 3.3 UI, Styling & Accessibility
1. **Utility-First Styling**: Use Tailwind CSS utility classes. Never use inline `style={{ ... }}` except for dynamically calculated dimensions or positions.
2. **Theme Consistency**: Maintain visual consistency with existing components:
   * Modern rounded cards (`rounded-xl`, `border`, `bg-white`).
   * Color-coded status badges (`bg-blue-50 text-blue-700`, `bg-emerald-50 text-emerald-700`).
   * Accessible focus states and interactive hover transitions (`transition-colors duration-150`).
3. **Iconography**: Use icons exclusively from `lucide-react`.

### 3.4 Dynamic Host & Preview Compatibility
1. **Allowed Hosts**: `vite.config.ts` must maintain `server.allowedHosts: true` under `server:`. This allows the Vite development server to serve dynamic preview subdomains (e.g. `https://p18000.<ip>.sslip.io` and custom domains) without getting blocked by host security headers.
2. Never revert `allowedHosts` to a static localhost array.

---

## 4. Pre-Completion Verification Commands

Before completing any task or declaring work ready for pull request, execute the following commands and ensure zero errors:

```bash
# 1. ESLint checks (must exit with code 0)
npm run lint

# 2. TypeScript strict type checking (must exit with code 0)
npx tsc -b

# 3. Production asset build verification (must exit with code 0)
npm run build
```

