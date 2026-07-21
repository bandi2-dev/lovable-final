# ResuMate — AI Resume Analyzer

An AI-powered resume analyzer with **ATS scoring**, **job-description matching**, and **AI-written improvement suggestions** powered by **Mistral AI**.

Built for an MTech major project. Runs entirely locally — no cloud backend, no external database, no vendor lock-in.

---

## Features

- **Animated landing page** with drifting gradient spheres, scroll animations, and a keyword marquee.
- **Local auth** (signup / login) with SHA-256 + salt hashing via Web Crypto. Users stored in browser `localStorage`. Demo-grade — see security notes.
- **Resume upload** — PDF, DOCX, or plain text. All parsing happens in the browser (`pdfjs-dist`, `mammoth`).
- **ATS score (0–100)** across six weighted categories: contact info, sections, length, formatting, action verbs & impact, JD keywords.
- **JD keyword match** — paste a job description, get overlap %, matched skills, and missing keywords.
- **AI suggestions** via Mistral AI — summary, per-section feedback, 5 rewritten bullets, and prioritized action items.
- **Animated results page** with score ring, Recharts breakdown, and copy-to-clipboard bullets.
- **4 environments** (local / dev / test / prod), Dockerfile + docker-compose, and full Kubernetes manifests via Kustomize.

---

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite 8, SSR-capable)
- Tailwind CSS v4 + shadcn/ui + Framer Motion
- Mistral AI (`@mistralai/mistralai`)
- `pdfjs-dist`, `mammoth` for in-browser file parsing
- `zustand` for state, `zod` + `react-hook-form` for forms
- Docker (multi-stage, distroless-ish node:20-alpine)
- Kubernetes (Kustomize base + 4 overlays)

---

## Quick Start (Local)

Prerequisites: **Node.js 20+** and **npm 10+**.

```bash
git clone <your-fork-url> resume-analyzer
cd resume-analyzer
npm install
cp .env.example .env.local
# Open .env.local and paste your Mistral key (get one at https://console.mistral.ai/api-keys)
npm run dev
```

Open http://localhost:8080 in your browser.

> **Note:** `VITE_*` variables are inlined into the client bundle at build time, so the Mistral key is exposed to the browser. This is acceptable for a local academic project. For production, proxy the Mistral call through a server route.

---

## Environment Matrix

| Variable | local | dev | test | prod | Purpose |
| --- | --- | --- | --- | --- | --- |
| `VITE_APP_ENV` | `local` | `dev` | `test` | `prod` | Drives env badge, logging |
| `VITE_APP_VERSION` | `0.1.0-local` | `0.1.0-dev` | `0.1.0-test` | `0.1.0` | Shown on `/api/version` |
| `VITE_API_BASE_URL` | `/api` | `/api` | `/api` | `/api` | Same origin |
| `VITE_MISTRAL_API_KEY` | *(your key)* | secret | *(unused)* | secret | Mistral API key |
| `VITE_MISTRAL_MODEL` | `devstral-2512` | `devstral-2512` | *(unused)* | `devstral-2512` | Model id |
| `VITE_ENABLE_AI` | `true` | `true` | `false` | `true` | Falls back to deterministic mock when `false` |

The **test** env uses baseline (mock) suggestions so CI runs are deterministic. All four envs share the same routes — behavior differences are gated in code, not URL structure.

---

## API Endpoints

All four environments expose the same set of endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/ready`  | Readiness probe |
| `GET` | `/api/version` | Env + version + commit |
| `GET` | `/api/config` | Safe runtime config (`env`, `aiEnabled`, `model`) |

App routes:

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/signup` | Create account |
| `/dashboard` | Upload resume + JD, analyze (auth-gated) |
| `/results` | Score, breakdown, AI suggestions (auth-gated) |

---

## Docker

Build any environment with the `APP_ENV` build arg:

```bash
docker build --build-arg APP_ENV=dev --build-arg APP_VERSION=0.1.0-dev -t resume-analyzer:dev .
docker run --rm -p 8080:8080 --env-file .env.dev resume-analyzer:dev
```

Run all four side-by-side with docker-compose:

```bash
docker compose up app-local  # -> http://localhost:8080
docker compose up app-dev    # -> http://localhost:8081
docker compose up app-test   # -> http://localhost:8082
docker compose up app-prod   # -> http://localhost:8083
```

Health check:
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/version
```

---

## Kubernetes

Manifests live under `k8s/` — a Kustomize base plus four overlays.

```
k8s/
├── base/                # deployment, service, ingress, configmap, secret, hpa, pdb, networkpolicy
└── overlays/
    ├── local/           # kind / minikube — 1 replica, NodePort-friendly
    ├── dev/             # 2 replicas, dev.resume-analyzer.example.com
    ├── test/            # 1 replica, ENABLE_AI=false, deterministic mock
    └── prod/            # 3 replicas, HPA 3–10, TLS via cert-manager
```

### 1. Create the Mistral secret (per env)

```bash
kubectl create namespace resume-analyzer-dev
kubectl -n resume-analyzer-dev create secret generic resume-analyzer-secrets \
  --from-literal=VITE_MISTRAL_API_KEY=your_mistral_key_here
```

Repeat for `resume-analyzer-local`, `resume-analyzer-prod`. (Test env doesn't need a real key — it uses the mock.)

### 2. Build and load the image

```bash
docker build --build-arg APP_ENV=dev -t resume-analyzer:dev .
# For kind:  kind load docker-image resume-analyzer:dev
# For minikube: minikube image load resume-analyzer:dev
# For a real cluster: push to your registry and update the image tag in overlays/<env>/kustomization.yaml
```

### 3. Apply the overlay

```bash
kubectl apply -k k8s/overlays/local
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/test
kubectl apply -k k8s/overlays/prod
```

Preview any overlay without applying:
```bash
kubectl kustomize k8s/overlays/prod
```

### 4. Verify

```bash
kubectl -n resume-analyzer-dev get pods
kubectl -n resume-analyzer-dev port-forward svc/resume-analyzer 8080:80
curl http://localhost:8080/api/health
curl http://localhost:8080/api/version
```

Included hardening:
- `runAsNonRoot`, `readOnlyRootFilesystem`, dropped all capabilities, `seccompProfile: RuntimeDefault`
- Liveness / readiness / startup probes on `/api/health` and `/api/ready`
- Rolling updates with `maxUnavailable: 0`
- HorizontalPodAutoscaler (CPU 70% + memory 80%)
- PodDisruptionBudget (`minAvailable: 1`)
- NetworkPolicy allowing ingress-nginx in, DNS + HTTPS out (for Mistral)

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx                     # Landing
│   ├── auth.login.tsx
│   ├── auth.signup.tsx
│   ├── _authenticated/
│   │   ├── route.tsx                 # Auth guard
│   │   ├── dashboard.tsx
│   │   └── results.tsx
│   └── api/
│       ├── health.ts
│       ├── ready.ts
│       ├── version.ts
│       └── config.ts
├── lib/
│   ├── env.ts                        # Zod-validated env loader
│   ├── auth-store.ts                 # Local auth (zustand + Web Crypto)
│   ├── analysis-store.ts
│   ├── resume/
│   │   ├── extract.ts                # PDF/DOCX/TXT extraction
│   │   ├── ats.ts                    # 100-point ATS scorer
│   │   └── jd-match.ts               # JD keyword match
│   └── ai/
│       └── mistral.ts                # Mistral AI client + fallback
└── components/ui/                    # shadcn primitives

k8s/
├── base/
└── overlays/{local,dev,test,prod}/

Dockerfile
docker-compose.yml
.env.example / .env.{local,dev,test,prod}
```

---

## Security Notes

- **Auth is demo-grade.** Passwords are SHA-256 + salted, but stored in `localStorage`. Do not reuse this for real users — swap in a real backend (Auth.js, Supabase Auth, Clerk, etc.).
- **`VITE_MISTRAL_API_KEY` ships to the browser.** Use a restricted / scoped Mistral key with tight rate limits. To hide it, add a server route (`src/routes/api/suggest.ts`) that reads `process.env.MISTRAL_API_KEY` and proxies the call, and remove the `VITE_` prefix.
- Resume text never leaves the browser except for the AI suggestions call (to Mistral).

---

## License

MIT — do whatever you want, no warranty.
