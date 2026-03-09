<div align="center">
  <img src="https://kanban.kaueramone.dev/favicon.ico" alt="KanbanK Logo" width="80" height="80">
  <h1>KanbanK 🟢</h1>
  <p><strong>A Modern Project Management & Live Tracking Dashboard</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

  <p>
    <a href="https://kanban.kaueramone.dev">View Live Demo</a>
    ·
    <a href="https://github.com/kaueramone/kanban/issues">Report Bug</a>
  </p>
</div>

---

## 🚀 Overview

**KanbanK** is a dual-purpose web application built to streamline digital project management while serving as a transparent, gamified public portfolio.

1. **The Public Engine (`/`)**: A sleek, conversion-focused landing page where visitors can track the real-time development progress of active projects (anonymized), view recent activity logs, and explore dynamically fetched GitHub Open Source contributions.
2. **The Private Core (`/admin`)**: A fully authenticated, full-stack Kanban board for the administrator to manage clients, track tasks in columns (Backlog, In Progress, Review, Completed), and log activity. 

Born from a need to replace heavy WordPress plugins, this V2 was rebuilt from the ground up using **Next.js (App Router)** and **Supabase** for maximum edge performance and a premium "Razer Green" identity.

---

## ✨ Key Features

- **Public Live Tracking:** Showcases active projects with a calculated Progress Bar based on completed Kanban cards.
- **Data Anonymization:** Native database flags (`is_public`, `public_name`) ensure client privacy on the public dashboard while retaining real data in the admin.
- **GitHub API Integration:** Automatically fetches and displays the developer's GitHub profile stats and latest repositories.
- **Drag-and-Drop Kanban Board:** Built using `@hello-pangea/dnd` for fluid task management across custom columns.
- **Activity Feed & Diagnostics:** Every task moved or client created is logged and broadcasted (anonymously) to the public feed.
- **Edge Authentication:** Simple, blazingly fast middleware-based route protection for the `/admin` zones.
- **Localization (i18n):** Native English interface combined with an optimized `GTranslate` widget for seamless Spanish and Portuguese dynamic translations.
- **Razer Green Aesthetic:** A dark-mode first design with `#22c55e` neon accents for a modern, hacker-friendly UI.

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React Server Components, App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling:** Vanilla CSS Variables (Global Theme System)
- **Drag & Drop:** `@hello-pangea/dnd`
- **Icons:** [Lucide React](https://lucide.dev/) (SVG Inline)
- **Deployment:** [Vercel](https://vercel.com/)

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/kaueramone/kanban.git
cd kanban
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)
Execute the SQL schemas located in the root of the project inside your Supabase SQL Editor:
1. Run `supabase-schema.sql` to build the core tables (Clients, Projects, Activity Log, etc.).
2. Run `supabase-v2.sql` to append the V2 features (Public Anonymization fields `is_public`, `industry_name`, etc.).

### 5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.
- **Public Dashboard:** `http://localhost:3000/`
- **Admin Gateway:** `http://localhost:3000/login`

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── admin/           # Protected Admin Routes (Layout, Dashboard, Kanban)
│   ├── login/           # Authentication Gateway
│   ├── globals.css      # Core Design Tokens (Razer Green Identity)
│   ├── layout.tsx       # Root Layout (GTranslate Injection)
│   └── page.tsx         # Public Landing Page (GitHub API & Live Tracking)
├── components/          # Reusable UI (Sidebar, Modals, Toast)
├── lib/
│   └── supabase.ts      # Supabase Client Initialization
└── middleware.ts        # Edge Authentication Router (Guards /admin/*)
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <p>Built with 🍵 by <a href="https://kaueramone.dev">Kaue Ramone</a></p>
</div>
