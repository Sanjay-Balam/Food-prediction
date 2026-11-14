# Food Prediction (Turborepo)

Predicts how many portions of each menu item a Hyderabad restaurant will sell.

```
apps/
  api/          Python backend: FastAPI + LightGBM forecasting engine (see apps/api/README.md)
  demo-web/     Next.js frontend (App Router, TypeScript, Tailwind)
research/       stand-in datasets, notebooks and planning docs (not used by the apps)
package.json    workspace scripts, run through Turborepo
turbo.json      task pipeline: dev, build, lint, test
```

## Setup (once)

```
pnpm install                                      # Node packages for the whole workspace
python -m pip install -r apps/api/requirements.txt
copy apps\api\.env.example apps\api\.env          # then fill in the LLM settings
```

Needs Node 20+ with pnpm, and Python 3.11+.

## Commands (from the repo root)

| Command | Does |
|---|---|
| `pnpm dev` | starts both apps: API on http://127.0.0.1:8000, web on http://localhost:3000 |
| `pnpm test` | backend tests (pytest) |
| `pnpm lint` | lints the web app |
| `pnpm build` | production build of the web app |
| `pnpm --filter api dev` | only the API |
| `pnpm --filter demo-web dev` | only the web app |

Postman collection for the API: `apps/api/postman/Food-Forecast-API.postman_collection.json`.
