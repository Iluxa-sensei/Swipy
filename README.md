# Swipy - Tinder for startups

## Supabase Setup

1. Create a project in Supabase and get your anon key and project URL.
2. Create a `.env` file in the project root with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Never commit real secrets. `.env` is ignored.
4. Apply SQL from `supabase/schema.sql` in the Supabase SQL editor.
5. Enable Email auth and optionally Google OAuth in Supabase Authentication settings. Whitelist `http://localhost:5173` and your production URL.

Security: All tables use Row Level Security with restrictive policies. Only authenticated users can access their own rows.

### Environment variables

Copy `.env.example` to `.env` and fill values:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

Run locally:

```
npm run dev
```