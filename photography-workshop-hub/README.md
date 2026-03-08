# Photography Workshop Hub (React + Supabase)

Starter project for a workshop app hub with:
- A central hub page
- Separate folder/page for each workshop app
- Supabase client setup

## 1) Install dependencies

```bash
npm install
```

## 2) Add environment variables

Copy `.env.example` to `.env` and fill in your Supabase values.

```bash
cp .env.example .env
```

## 3) Run locally

```bash
npm run dev
```

## Folder structure

```text
src/
  apps/
    workshop-planner/
  components/
  lib/
  pages/
    hub/
```

## Next steps

- Add Supabase Auth (email magic link or Google)
- Add role-based routes (teamleader/photographer)
- Add more workshop apps inside `src/apps/`
