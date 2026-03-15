# Project Structure

## Root-Level Files

- `README.md`: main project overview and judge-friendly local spin-up
- `HACKATHON_SUBMISSION.md`: top-level submission index
- `DEPLOY.md`: deployment guide
- `deploy-app.ps1`: app-only redeploy script
- `deploy-infra.ps1`: infra-only Terraform script
- `deploy-app.sh`: Bash app-only redeploy script
- `deploy-infra.sh`: Bash infra-only Terraform script
- `REDEPLOY_COMMANDS.ps1`: launcher for app, infra, or both
- `REDEPLOY_COMMANDS.sh`: Bash launcher for app, infra, or both
- `Dockerfile`: production container build
- `package.json`: scripts and dependencies
- `next.config.js`: Next.js config for Turbopack and Webpack fallback

## Main Source Areas

- `src/app/`: Next.js app routes, landing page, editor UI, and API routes
- `src/components/`: reusable UI components and editor panels
- `src/hooks/`: client hooks for animation, generation, and conversation flows
- `src/lib/`: integrations including Gemini and Google Cloud Storage
- `src/remotion/`: Remotion compositions, preview wiring, and showcase components
- `src/helpers/`: utility helpers for API shaping, rendering, and media transforms
- `src/skills/`: prompt-time skills and modular guidance injected into generation
- `src/types/`: shared types and schemas
- `src/examples/`: example prompts and code references

## Infra and Deployment

- `infra/terraform/`: Terraform infrastructure definitions
- `deploy.mjs`: deployment-related scripting
- `DEPLOY.md`: infrastructure deployment notes

## Media and Static Assets

- `public/`: static assets served by Next.js, including generated audio files

## Suggested Repo Tour For Judges

1. Start with `README.md`
2. Review `src/app/page.tsx` and `src/remotion/ShowcaseComp.tsx`
3. Inspect `src/app/api/agent/` routes
4. Inspect `src/lib/gcs.ts`
5. Review `infra/terraform/`
