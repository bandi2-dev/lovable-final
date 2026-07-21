
## Goal

Polished AI Resume Analyzer, exportable, runs locally with **npm**, containerized with Docker, deployable to Kubernetes across **local / dev / test / prod**. AI provider: **Mistral AI** (replaces OpenAI everywhere in the previous plan). No Lovable Cloud.

## Stack

- TanStack Start + React 19 + Tailwind v4 + shadcn.
- npm only.
- Libraries: `framer-motion`, `pdfjs-dist`, `mammoth`, `@mistralai/mistralai` (official Mistral JS SDK), `zod`, `react-hook-form`, `zustand`, `recharts`.

## Mistral integration

- SDK: `@mistralai/mistralai`.
- Default model: `mistral-small-latest` (fast, cheap, good enough for suggestions). Configurable via env.
- Client-side call from the browser using the API key injected via `VITE_MISTRAL_API_KEY`. README explicitly notes this exposes the key to the browser (fine for a local academic project); provides a clear upgrade path (proxy through a server route) if you later want to hide it.
- `src/lib/ai/mistral.ts`:
  - Reads `env.MISTRAL_API_KEY`, `env.MISTRAL_MODEL`.
  - `getSuggestions({ resumeText, jdText, atsBreakdown })` → calls Mistral `chat.complete` with `response_format: { type: "json_object" }` and a strict system prompt that returns:
    ```json
    {
      "summary": "...",
      "sectionFeedback": { "experience": "...", "skills": "...", ... },
      "rewrittenBullets": ["...", "..."],
      "actionItems": ["..."]
    }
    ```
  - Robust parse (try/catch → fallback text).
  - Graceful degradation when key missing: returns `{ disabled: true, reason: "Set VITE_MISTRAL_API_KEY in your .env file" }`; UI shows a friendly banner instead of erroring.
  - When `VITE_ENABLE_AI=false` (test env), returns deterministic canned suggestions so CI is stable.

## App features (unchanged from prior plan)

- Landing: animated hero with drifting gradient spheres, feature grid, how-it-works, CTA.
- Auth (local-only, `localStorage` + Web Crypto SHA-256 hash; documented as demo).
- Dashboard: PDF/DOCX/TXT upload, JD paste, Analyze.
- ATS scoring: offline rule-based, 100-point breakdown.
- JD keyword match: overlap %, missing skills.
- Results: animated score ring, Recharts breakdown, strengths/issues, Mistral suggestions, rewritten bullets, copy-to-clipboard.

## Routes

```
src/routes/
  __root.tsx
  index.tsx                     -> Landing
  auth.login.tsx
  auth.signup.tsx
  _authenticated/
    route.tsx                   (guard)
    dashboard.tsx
    results.tsx
  api/
    health.ts                   GET /api/health   (liveness)
    ready.ts                    GET /api/ready    (readiness)
    version.ts                  GET /api/version  (env, version, commit)
    config.ts                   GET /api/config   (safe runtime config, e.g. { env, aiEnabled })
```

Same route set in every env — no per-env forking. Behavior differences are gated by `env.APP_ENV`.

## 4 environments (local / dev / test / prod)

### Env files
```
.env.example        (committed)
.env.local          (dev machine)
.env.dev            (dev cluster)
.env.test           (CI / test cluster; AI disabled)
.env.prod           (prod cluster)
```

Variables:
```
VITE_APP_ENV=local|dev|test|prod
VITE_APP_VERSION=<sha or semver>
VITE_API_BASE_URL=/api
VITE_MISTRAL_API_KEY=
VITE_MISTRAL_MODEL=mistral-small-latest
VITE_ENABLE_AI=true|false
```

`src/lib/env.ts` — Zod-validated loader, fails fast if invalid. `APP_ENV` drives env badge + logging verbosity.

### Per-env behavior
- **local** — `npm run dev` on `localhost:8080`, AI on if key present, source maps on.
- **dev** — `dev.<domain>`, AI on with dev Mistral key, "DEV" banner.
- **test** — `test.<domain>`, `VITE_ENABLE_AI=false` (deterministic canned suggestions), seeded demo user.
- **prod** — `<domain>`, minified, strict CSP, no banner.

## Containerization

Multi-stage `Dockerfile`:
```
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG APP_ENV=prod
ARG APP_VERSION=0.0.0
ENV VITE_APP_ENV=$APP_ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/.output ./.output
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 8080
USER node
CMD ["node", ".output/server/index.mjs"]
```

- `.dockerignore` excludes `node_modules`, `.git`, `.env*`, `.output`, `dist`.
- `docker-compose.yml` with 4 services (`app-local`, `app-dev`, `app-test`, `app-prod`), each `env_file` pointing to matching `.env.*`, ports `8080-8083`, so you can demo all four side-by-side.

## Kubernetes manifests (Kustomize)

```
k8s/
  base/
    namespace.yaml
    deployment.yaml       (probes -> /api/health, /api/ready; securityContext hardened)
    service.yaml          (ClusterIP :80 -> :8080)
    ingress.yaml
    configmap.yaml        (APP_ENV, MODEL, ENABLE_AI, VERSION)
    secret.yaml           (placeholder for MISTRAL_API_KEY)
    hpa.yaml
    pdb.yaml
    networkpolicy.yaml
    kustomization.yaml
  overlays/
    local/                (kind/minikube, NodePort, 1 replica)
    dev/                  (ns: resume-analyzer-dev, 2 replicas)
    test/                 (ns: resume-analyzer-test, ENABLE_AI=false)
    prod/                 (ns: resume-analyzer-prod, 3 replicas, HPA 3-10, TLS)
```

Each overlay: `kustomization.yaml`, `configmap-patch.yaml`, `deployment-patch.yaml`, `ingress-patch.yaml`, `secret.example.yaml` (documents `MISTRAL_API_KEY` — real value provided via `kubectl create secret` or SealedSecrets).

Deployment hardening: `runAsNonRoot`, `readOnlyRootFilesystem`, drop ALL caps, resource requests/limits, rolling update `maxSurge: 1 / maxUnavailable: 0`, liveness/readiness/startup probes.

Apply:
```
kubectl apply -k k8s/overlays/local
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/test
kubectl apply -k k8s/overlays/prod
```

## README (rewritten)

1. Features.
2. Getting your Mistral key from https://console.mistral.ai/api-keys.
3. Local: `npm install`, copy `.env.example` → `.env.local`, add key, `npm run dev`.
4. Env matrix table.
5. Docker: `docker build --build-arg APP_ENV=dev -t resume-analyzer:dev .`, `docker compose up app-dev`.
6. Kubernetes: create secret (`kubectl create secret generic resume-analyzer-secrets --from-literal=MISTRAL_API_KEY=…`), `kubectl apply -k …`, verify probes, port-forward.
7. Security notes: `VITE_` = browser-exposed; use restricted keys; auth is demo-only.

## Verification during build

- Hit `/api/health`, `/api/ready`, `/api/version`, `/api/config` via preview.
- Render manifests with `kubectl kustomize k8s/overlays/<env>` to catch YAML errors in the sandbox.
- Smoke-test Mistral call with a small resume + JD once key is in `.env.local`.

## Out of scope

- No Lovable Cloud / Supabase.
- No server-side Mistral proxy (kept client-side per your original constraint).
- No CI YAML (can add on request).
- No Helm chart (Kustomize chosen for demo clarity).

## Deliverable

Exportable repo with full app source, 4 env templates, Dockerfile + compose, Kustomize k8s base + 4 overlays, and README covering local, Docker, and k8s for every env.
