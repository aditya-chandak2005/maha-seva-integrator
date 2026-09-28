# 🚀 Maha-Seva Integrator — Deployment & Sharing Guide

This guide explains how to run, test on mobile/laptop, share an instant live link with your friends, and deploy to cloud platforms.

---

## ⚡ 1. Both Servers are Currently Running!

Both the Backend API and Frontend are **actively running** on your machine:

| Component | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [`http://localhost:5173`](http://localhost:5173) | Main user interface (Citizens, Officers, Admins) |
| **Mobile LAN Access** | [`http://192.168.0.100:5173`](http://192.168.0.100:5173) | Open on your phone connected to the same Wi-Fi |
| **Backend API Docs** | [`http://localhost:8000/docs`](http://localhost:8000/docs) | Interactive Swagger API Documentation |
| **FastAPI Backend** | [`http://localhost:8000`](http://localhost:8000) | REST API endpoints & database connection |

> **To Start Anytime in Future**: Simply double-click **`start.bat`** in the project root folder.  
> **To Stop Anytime**: Double-click **`stop.bat`** to gracefully terminate both servers.

---

## 🌐 2. Share with Your Friend Right Now (Instant Live Link)

An instant public HTTPS tunnel is currently live and connected directly to your local application:

- **Public Live Link:**  
  👉 **`https://mahaseva-portal-demo.loca.lt`**
- **Tunnel Password / IP (Required on 1st visit):**  
  👉 **`103.133.158.129`**

### How Your Friend Can Access:
1. Send them the link: `https://mahaseva-portal-demo.loca.lt`
2. When the Localtunnel friendly safety prompt asks for a "Tunnel Password / Endpoint IP", they enter: `103.133.158.129` and click **Submit**.
3. The Maha-Seva portal loads completely with all features (schemes catalog, smart AI assistant, DigiLocker sync, document uploads, application tracking, multi-language EN/MR/HI support).

> **To regenerate or start a new public link anytime**:  
> Double-click **`share-online.bat`** in your project folder. It will fetch your current IP and generate a fresh HTTPS link automatically.

---

## 📱 3. Dynamic & Mobile-Responsive Design

The website has been specifically optimized to provide an adaptive, dynamic experience across all devices:

1. **Smart Viewport & Fluid Layouts**:
   - Uses Tailwind CSS responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
   - Fluid typography and responsive button layouts.
2. **Mobile Navigation Drawer**:
   - Collapsible slide-down menu with quick-toggle language selector (English, मराठी, हिन्दी).
   - Dedicated mobile categories for statutory certificates and DBT schemes.
3. **Full-Width Citizen Profile Drawer**:
   - Slides smoothly over the screen on phones without horizontal overflow (`pl-0 sm:pl-10`).
   - Clean tabs for Citizen Profile, Uploaded Documents, and DigiLocker Vault.
4. **Responsive Data Tables**:
   - Applications tables and officer queues are wrapped in `overflow-x-auto` to allow smooth horizontal scrolling on smaller screens without breaking page bounds.
5. **Responsive AI Assistant**:
   - Conversational AI modal scales from 320px mobile screens up to 4K displays.
   - Grounded across all 28 States, 8 UTs, and Central Government welfare schemes.
6. **Vite Reverse Proxy**:
   - All frontend calls route to `/api/v1` through the internal dev server proxy, ensuring mobile devices and external friends never experience CORS or local IP resolution errors.

---

## ☁️ 4. Permanent Cloud Production Deployment

If you want a 24/7 permanent hosted URL on the web:

### Part A: Deploy Frontend to Vercel (100% Free & Fast)
1. Push your latest code to your GitHub repository:
   ```powershell
   git add .
   git commit -m "Configure mobile responsiveness, proxy, and deployment files"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import `aditya-chandak2005/maha-seva-integrator`.
4. Configure Project Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://your-backend-service.onrender.com/api/v1`
6. Click **Deploy**. Vercel will give you a permanent `https://maha-seva-xxx.vercel.app` link with free SSL!

*(A pre-configured `frontend/vercel.json` has already been added to ensure client-side SPA routing works without 404s).*

---

### Part B: Deploy Backend & Database to Render (or Railway)
1. Go to [Render Dashboard](https://render.com/).
2. **Create a Managed PostgreSQL Database**:
   - Click **New +** -> **PostgreSQL**.
   - Name: `mahaseva-db`.
   - Copy the **Internal Database URL** or **External Database URL**.
3. **Create the Backend Web Service**:
   - Click **New +** -> **Web Service**.
   - Select your GitHub repo: `maha-seva-integrator`.
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, configure:
   - `DATABASE_URL` = *(Your Render PostgreSQL connection string)*
   - `JWT_SECRET` = `maha-seva-production-secret-2026`
   - `GEMINI_API_KEY` = *(Your Google Gemini API Key if using Gemini)*
5. Click **Create Web Service**. Render will deploy your FastAPI service with a public URL like `https://maha-seva-api.onrender.com`.
6. Run database seed on Render:
   - Open Render Shell in the dashboard:
     ```bash
     python -m database.seed_data
     ```
7. Paste this backend URL + `/api/v1` into your Vercel `VITE_API_BASE_URL` environment variable.

