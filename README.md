# PR Real Estate — Dubai Prime Residences & Executive CRM Portal

> **Private Client Real Estate Advisory • Dubai, UAE**  
> Curators of ultra-prime ready residences and iconic architectural off-plan developments across Dubai's most prestigious enclaves. All property values and deals denominated in **AED**.

---

## 🌟 Key Highlights & Architectural Features

1. **Ultra-Luxury Dubai Developer Aesthetic**
   - Elegant typography pairing **Cormorant Garamond** (display headings) and **Inter** (precision interface text).
   - Bespoke brand palette: Charcoal (`#1A1A1A`), Off-White (`#F7F5F2`), Warm Gray (`#6B6B6B`), and Champagne Gold accents (`#B8975A`).
   - Seamless brand preloader with gold progress track and luxury status 404 page ("Residence or Page Not Found").

2. **Full Public Portfolio**
   - **Homepage**: Dubai Marina & Skyline hero, search by community, featured residences, featured off-plan towers, "Why Invest in Dubai" (0% tax, 8-10% rental yields, Golden Visa eligibility), and Register Interest modal.
   - **Ready Properties**: Multi-filter catalog (Community, Property Type, Price Range, Bedrooms) with rich property dossiers, image galleries, and dual-action viewing/enquiry forms.
   - **Off-Plan Projects**: Developer showcases, payment plans (e.g., 60/40, 70/30 post-handover), handover timelines, and brochure downloads.
   - **Mortgage Calculator**: Interactive slider-based financing simulator computing monthly installments, down payments, and mandatory 4% Dubai Land Department (DLD) transfer fees.
   - **Sell Your Property**: Confidential listing appraisal intake.
   - **Concierge & Contact**: DIFC Gate Precinct 4 office details with instant WhatsApp VIP & Call Me Back triggers.

3. **Executive CRM & Private Staff Management Portal**
   - **Lead Capture & Anti-Spam**: Universal client intake with honeypot protection and submission cooldown.
   - **Lead Scoring Engine (0–100)**: Real-time scoring assigning **HOT** (70+), **WARM** (40–69), and **COLD** labels based on liquid cash buyer status, purchasing timeline, budget bracket, phone verification, and specific property interest.
   - **Real-Time Notification Bell**: Live polling (refreshes every 60s) showing unread leads badge and priority dropdown.
   - **Executive Dashboard**: Key performance metrics (New Leads Today, Total Pipeline Deal Value, Viewings This Week, Sales Volume, and Brokerage Commission).
   - **Drag-and-Drop Pipeline Kanban**: Stages from *New* → *Contacted* → *Viewing Scheduled* → *Offer Made* → *Under Contract* → *Won* / *Lost*.
   - **Leads Directory & Excel Export**: Multi-column search, stage/temperature filters, and instant `.xlsx` spreadsheet download.
   - **Deal Closing Flow**: Automatically calculates **2% agency brokerage commission**, computes **4% DLD transfer fee**, and flips target property to **Sold**.
   - **Agent Leaderboard**: Tracks individual broker revenue and commissions against a 40M AED monthly quota.
   - **Stale Leads Radar**: Flags any client dossier inactive for 3+ days.
   - **Role-Based Access Control**:
     - **Director (`admin`)**: Comprehensive access across all agents, deals, pipeline, and full Property Inventory CRUD.
     - **Agents**: Strictly isolated to their own assigned client dossiers and scheduled viewings.

4. **Search Engine Optimization (Google Discovery) & Privacy Masking**
   - **Public Pages**: Fully discoverable by Google with descriptive title tags, meta descriptions, OpenGraph, Twitter Cards, canonical URL, and Schema.org `RealEstateAgent` JSON-LD structured data.
   - **Admin Portal**: Strictly shielded from Google indexing via `robots.txt` Disallow directives and dynamic client-side `meta[name="robots"]` set to `noindex, nofollow, noarchive`.
   - **Security**: Strict `.gitignore` prevents private keys, `.env`, and passwords from ever being committed to GitHub.

---

## 🔒 Staff Portal Credentials

Navigate to `/#/admin/login` or click **Staff Portal 🔒** in the footer:

| Name | Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Jay Director** | Director | `admin` | `admin` | Full Global Access & Inventory Management |
| **Tariq Al-Mansoor** | Senior Broker | `tariq.mansoor` | `agent123` | Assigned Leads & Viewings |
| **Layla Al-Hashemi** | Prime Specialist | `layla.hashemi` | `agent123` | Assigned Leads & Viewings |
| **Alexander Vance** | Penthouses & Off-Plan | `alex.vance` | `agent123` | Assigned Leads & Viewings |

---

## 🚀 Simple Instructions to Run the Website

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- A modern web browser (Chrome, Edge, Safari, Firefox)

### Step 1: Install Dependencies
Open your terminal inside this project folder and run:
```bash
npm install
```

### Step 2: Start the Website
Run both the frontend website and the backend API server with one command:
```bash
npm run dev:all
```

Or run them in separate terminal windows:
- **Frontend Website (Vite)**:
  ```bash
  npm run dev
  ```
  *Opens on `http://localhost:5173`*

- **Backend CRM & Database API (Express)**:
  ```bash
  npm run server
  ```
  *Runs on `http://localhost:3001`*

### Step 3: Open in Browser
- **Public Luxury Website**: [http://localhost:5173/](http://localhost:5173/)
- **Executive CRM Staff Login**: [http://localhost:5173/#/admin/login](http://localhost:5173/#/admin/login)

---

## 🗄️ Neon Serverless PostgreSQL Setup (Optional)

The application includes an in-memory high-speed dataset (15 ready properties, 6 off-plan projects, 5 developers, 3 agents, 40 sample leads, 10 viewings, and 5 closed sales).

To connect your live **Neon Serverless PostgreSQL** database:

1. Create a free database at [neon.tech](https://neon.tech).
2. Copy your connection string.
3. Open or create the `.env` file in the root folder (use `.env.example` as a guide).
4. Paste your connection string into `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Initialize the database schema and sample data:
   ```bash
   npm run db:setup
   ```
6. The green status pill in the footer will automatically display:
   `Neon: Connected (ep-cool-fog-123456.us-east-2.aws.neon.tech)`.

---

## 📦 How to Save and Push to GitHub

Follow these exact steps in your terminal to save your code to your own GitHub repository:

### 1. Create a New Repository on GitHub
1. Log into your account at [github.com](https://github.com).
2. Click the **+** icon in the top-right corner and select **New repository**.
3. Name your repository (e.g. `pr-real-estate-dubai`).
4. Keep it **Public** or **Private** according to your preference.
5. **Do NOT** initialize with a README, `.gitignore`, or license (we have already created them).
6. Click **Create repository**.
7. Copy the repository URL (e.g. `https://github.com/YOUR_USERNAME/pr-real-estate-dubai.git`).

### 2. Push Your Code from Your Computer
Run the following commands in your project folder (`c:\Users\renut\PR29Sep26RealEstateLearn`):

```bash
# 1. Add all project files (safe .gitignore prevents any secrets from being added)
git add .

# 2. Commit the codebase
git commit -m "feat: complete luxury Dubai real estate portal with executive CRM and SEO optimization"

# 3. Rename branch to main
git branch -M main

# 4. Link your GitHub repository (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/pr-real-estate-dubai.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🛡️ Security & Privacy Assurance

- **Credentials & API Keys Protected**: `.gitignore` strictly excludes `.env`, `*.env`, `*.pem`, `*.key`, and all local build/log files.
- **Search Engine Blocking**: `robots.txt` and dynamic client-side `meta[name="robots"]` directives instruct Googlebot and all search engines to never index or archive administrative or staff routes (`noindex, nofollow, noarchive`).
- **No External Email Leaks**: All lead captures, viewing requests, and deal closures are securely handled internally through the database API without sending unauthenticated outbound emails.

---

© 2026 PR Real Estate LLC. All Rights Reserved. Gate Precinct 4, DIFC, Dubai, UAE.
