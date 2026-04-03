# whatsurprob — Go Live Guide

## What you need
- A computer with Node.js installed (https://nodejs.org — download the LTS version)
- A free GitHub account (github.com)
- That's it. Everything else is free.

---

## Step 1: Set up the database (5 min)

1. Go to **https://supabase.com** → Sign up free
2. Click **"New Project"**
   - Name: `whatsurprob`
   - Password: anything (save it somewhere)
   - Region: pick one close to you
3. Wait ~2 min for it to finish
4. Click **"SQL Editor"** in the left sidebar
5. Click **"New Query"**
6. Open the file `schema.sql` from this project, copy ALL of it, paste it in
7. Click **"Run"** → should say "Success"
8. Now go to **"Settings"** → **"API"** in the left sidebar
9. You'll see two things you need:
   - **Project URL** — looks like `https://abcdef.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`
10. Open `src/supabase.js` in any text editor and paste them in:
    ```
    const SUPABASE_URL = 'https://abcdef.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJ...'
    ```
    Save the file.

---

## Step 2: Test it locally (2 min)

Open a terminal/command prompt in this project folder and run:

```
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the map!

Try submitting a problem — it should save to your database.

---

## Step 3: Put it on the internet (5 min)

1. Go to **https://github.com** → create a new repository called `whatsurprob`
2. In your terminal, run these commands:
   ```
   git init
   git add .
   git commit -m "first"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/whatsurprob.git
   git push -u origin main
   ```
3. Go to **https://vercel.com** → Sign up with your GitHub account
4. Click **"Add New Project"** → find your `whatsurprob` repo → click **"Import"**
5. Click **"Deploy"**
6. In ~1 minute you'll get a live URL like `whatsurprob.vercel.app`

---

## Step 4: Custom domain (optional)

1. Buy `whatsurprob.com` at namecheap.com (~$10/year)
2. In Vercel → your project → Settings → Domains → add `whatsurprob.com`
3. Follow the DNS instructions they show you
4. Done — HTTPS is automatic

---

## Important note

Right now the app uses seed/demo data baked into the code.
When you go live, you'll want to:
1. Remove the SEED array in `src/App.jsx` (search for `const SEED=`)
2. Replace it with `const SEED=[];`
3. Wire up the API calls in `src/api.js` to load real data

That's a next-step thing — for now the demo data lets you show people how it works.
