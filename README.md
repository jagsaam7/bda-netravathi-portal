# 🏢 BDA Netravathi Apartment — Flat Members Portal

A full-stack resident directory with Turso DB, Cloudinary photo uploads, NextAuth admin login, and Vercel deployment.

---

## 🗂️ Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Turso (libSQL — SQLite at the edge) |
| Auth | NextAuth.js v4 (credentials) |
| Photo Storage | Cloudinary |
| Styling | Tailwind CSS |
| Hosting | Vercel |

---

## 🚀 Step-by-Step Deployment Guide

### Step 1 — Clone / push to GitHub

```bash
# Create a new repo on github.com, then:
git init
git add .
git commit -m "Initial commit — BDA Netravathi portal"
git remote add origin https://github.com/YOUR_USERNAME/bda-netravathi-portal.git
git push -u origin main
```

---

### Step 2 — Create a Turso Database

1. Sign up free at **https://app.turso.tech**
2. Click **"New database"** → name it `bda-netravathi` → choose a region close to India (e.g. `sin1` Singapore)
3. Click your database → **"Connect"** → copy:
   - `TURSO_DATABASE_URL`  (looks like `libsql://bda-netravathi-xxx.turso.io`)
   - `TURSO_AUTH_TOKEN`    (a long JWT token)

---

### Step 3 — Set up Cloudinary (photo uploads)

1. Sign up free at **https://cloudinary.com**
2. Go to Dashboard → copy:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

### Step 4 — Deploy to Vercel

1. Go to **https://vercel.com** → **"Add New Project"**
2. Import your GitHub repo
3. In **"Environment Variables"**, add all 7 variables from `.env.local.example`:

```
TURSO_DATABASE_URL        = libsql://bda-netravathi-xxx.turso.io
TURSO_AUTH_TOKEN          = eyJh...
NEXTAUTH_SECRET           = (run: openssl rand -base64 32)
NEXTAUTH_URL              = https://your-project.vercel.app   ← your Vercel URL
CLOUDINARY_CLOUD_NAME     = your-cloud-name
CLOUDINARY_API_KEY        = 123456789012345
CLOUDINARY_API_SECRET     = xxxxxxxxxxxxxxxxxxxx
```

4. Click **Deploy** — Vercel builds and deploys automatically.

> ⚠️ **Important:** For `NEXTAUTH_URL`, use your actual Vercel deployment URL (you can update it after first deploy).

---

### Step 5 — Initialize the database

After deployment, open your terminal and run:

```bash
# Install deps locally first
npm install

# Copy env file
cp .env.local.example .env.local
# Fill in your real values in .env.local

# Initialize DB + create default admin
node lib/db-init.js
```

This creates the tables and a default admin account:
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **Change the password** after your first login! (Or edit `db-init.js` before running it.)

---

### Step 6 — All done! 🎉

Visit your Vercel URL:
- **Viewers** can browse resident photos and mobile numbers
- **Admins** click "Admin login" → sign in → add/edit/delete members with photo upload

---

## 🔁 Subsequent Updates

Every time you push to GitHub, Vercel auto-redeploys:

```bash
git add .
git commit -m "your change"
git push
```

---

## 📁 Project Structure

```
bda-portal/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js   ← Auth endpoint
│   │   ├── members/route.js              ← CRUD API
│   │   └── upload/route.js              ← Photo upload
│   ├── login/page.js                    ← Admin login page
│   ├── page.js                          ← Main portal (server)
│   ├── globals.css
│   └── layout.js
├── components/
│   ├── PortalClient.js                  ← Full UI (client)
│   └── SessionProvider.js
├── lib/
│   ├── auth.js                          ← NextAuth config
│   ├── db.js                            ← Turso client
│   ├── db-init.js                       ← One-time DB setup
│   └── flats.js                         ← Block/flat config
├── .env.local.example                   ← Copy → .env.local
└── README.md
```

---

## 🛡️ Security Notes

- Admin credentials stored with bcrypt (12 rounds) in Turso
- Photo upload only allowed for authenticated admins
- DOB and address hidden from viewer role
- All API routes validate session server-side

---

## 🆓 Free Tier Limits

| Service | Free Tier |
|---|---|
| Turso | 500 DBs, 9GB storage, 1B row reads/month |
| Cloudinary | 25GB storage, 25GB bandwidth/month |
| Vercel | Unlimited deployments, 100GB bandwidth/month |

All free — no credit card needed for this scale.
