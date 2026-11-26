# Skillrora (React)

React + Vite + React Router version of the Skillrora designs.

    npm install
    npm run dev      # http://localhost:5173
    npm run build

Routes: `/` home · `/explore` · `/services/modern-saas-website` · `/login`

Each page's CSS lives in `src/styles/<page>.css`, scoped under `.page-<name>`.

## Deploy on Render (Static Site)

1. Push this folder to a GitHub repo.
2. In Render: **New → Static Site**, pick the repo.
3. Build command: `npm install && npm run build`  — Publish directory: `dist`
4. Under **Redirects/Rewrites** add: source `/*` → destination `/index.html`, action **Rewrite**
   (needed so routes like `/my-gigs` work on refresh). Or use **New → Blueprint** to apply `render.yaml` automatically.
