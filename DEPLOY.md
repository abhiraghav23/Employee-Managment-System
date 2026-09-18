# Deploying this Next.js app to a free URL (Vercel)

This repository is ready to be deployed to Vercel (recommended for Next.js). Follow these steps to get a free URL.

1) Create a GitHub repository and push this project

   ```bash
   git init
   git add .
   git commit -m "Initial"
   git branch -M main
   # create a remote repo on GitHub and push
   git remote add origin git@github.com:<your-username>/<repo>.git
   git push -u origin main
   ```

2) Create a Vercel account and import the GitHub repository

   - Go to https://vercel.com and import your GitHub repo.
   - Vercel will detect Next.js and use the default build (`npm run build`).

3) Set environment variables in Vercel (Project Settings → Environment Variables)

   Required environment variables:
   - `DATABASE_URL` — Postgres connection string (or other DB provider). For a free DB, consider Supabase or Railway.
   - `NEXTAUTH_URL` — https://<your-vercel-url>
   - `NEXTAUTH_SECRET` — a long random string

   If you use Prisma with migrations, add:
   - `PRISMA_TELEMETRY_DISABLED=1`

4) (Optional) Use GitHub Actions to auto-deploy

   This repo includes `.github/workflows/deploy-to-vercel.yml`. To use it, add the following GitHub repository secrets:

   - `VERCEL_TOKEN` — create from Vercel Account Settings → Tokens
   - `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID` — from your Vercel project settings (Advanced)

   Pushing to `main` (or `master`) will trigger the workflow which deploys to Vercel via the token.

5) Migrations & seeding

   - If you use Postgres in production, run migrations once (locally or via a temporary runner):

     ```bash
     npx prisma migrate deploy
     # or use `prisma db push` to push schema without migrations
     ```

   - Seed the DB (run `npx ts-node prisma/seed.ts` or add a seed step in CI). For Vercel, you typically run Prisma migrate + seed as part of a deployment script or run it manually against the production DB.

6) Notes

   - Vercel provides a free subdomain like `your-project.vercel.app`.
   - For a custom domain, set it in Vercel and add the DNS records.

If you'd like, I can create a `Dockerfile` + `docker-compose.yml` for deploying on a VM or other provider, or provision a free Postgres instance on Supabase and add instructions to wire it up.
