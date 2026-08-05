# Warehouse Wallet
 
A tiny site that stores your Costco (or any warehouse club) membership card details — name, member number, type, expiration — and shows them back as a card with a scannable barcode. Static frontend, Supabase for auth + storage, deployable on GitHub Pages for free.
 
This is a personal utility, not affiliated with or endorsed by Costco.
 
## 1. Create a Supabase project
 
1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Once it's created, open **SQL Editor** and run everything in `supabase-schema.sql` from this folder. This creates the `membership_cards` table and locks it down with row-level security, so each user can only ever read or write their own row.
3. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
## 2. Configure the site
 
Open `config.js` and paste in your values:
 
```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```
 
The anon key is safe to ship in client-side code — it can only do what your row-level security policies allow, which is "read/write your own card, nothing else."
 
By default, Supabase requires users to confirm their email before signing in. You can turn this off for a personal project under **Authentication → Providers → Email → Confirm email**, or leave it on for a bit more security.
 
## 3. Try it locally (optional)
 
Just open `index.html` in a browser, or serve the folder:
 
```bash
python3 -m http.server 8000
```
 
then visit `http://localhost:8000`.
 
## 4. Deploy on GitHub Pages
 
1. Create a new GitHub repo and push this folder to it:
```bash
   git init
   git add .
   git commit -m "Warehouse Wallet"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. GitHub gives you a URL like `https://YOUR-USERNAME.github.io/YOUR-REPO/` within a minute or two.
That's it — no build step, no server to maintain.
 
## Notes
 
- Barcode format is Code 39, rendered client-side with [JsBarcode](https://github.com/lindell/JsBarcode) from your membership number — the same symbology printed on most warehouse club cards, so it should scan at self-checkout if your store reads it off a screen.
- The schema is set up for one card per account. If you want to track multiple cards (e.g. a family), drop the `unique (user_id)` constraint in `supabase-schema.sql` and extend the frontend to list multiple cards instead of one.
- Config values live in a plain JS file rather than an env var because GitHub Pages only serves static files — there's no build step to inject secrets at. The anon key being public is expected and safe given the RLS policies.
