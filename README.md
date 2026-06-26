# 🌳 SkillTree — Gamified Learning Platform

> Build RPG-style skill trees, earn XP, unlock badges, and level up your learning journey.

![SkillTree Banner](https://img.shields.io/badge/SkillTree-Gamified%20Learning-7c5cfc?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Flask-Python-000?style=flat-square&logo=flask)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## ✨ Features

- 🗺️ **Custom SVG Skill Trees** — Design non-linear RPG-style learning paths with drag-and-drop nodes
- 🔗 **Link Mode** — Draw prerequisite connections between nodes visually
- ⚡ **XP & Level System** — Complete nodes to earn XP and level up your profile
- 🏅 **7 Badge Types** — Automatic badge unlocks (First Step, Rising Scholar, XP Champion & more)
- 📊 **Progress Tracking** — Real-time progress per tree stored in MongoDB
- 🏆 **Leaderboard** — Compete with top learners ranked by XP
- 👤 **Profile Page** — View your level, XP, and full badge collection
- 🔐 **JWT Authentication** — Secure Flask backend with protected routes
- 🌐 **Public/Private Trees** — Control who can view your skill trees
- 🐳 **Docker Ready** — One command to spin up the entire stack

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/skilltree.git
cd skilltree
docker-compose up --build
```

Open **http://localhost:3000** in your browser.

---

### Option 2: Manual Setup

**Backend (Python 3.11+)**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Edit with your MongoDB URI and JWT secret
python app.py
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

### 🌱 Seed Demo Data

```bash
cd backend
python scripts/seed.py
```

**Demo Login:** `demo@skilltree.dev` / `demo1234`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Framer Motion, Axios |
| Backend | Flask, Flask-JWT-Extended, Flask-CORS, bcrypt |
| Database | MongoDB (pymongo) |
| Infrastructure | Docker, Docker Compose |

---

## 📁 Project Structure

```
skilltree/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Home page with animated SVG demo
│   │   │   ├── Dashboard.jsx      # Skill tree management + stats
│   │   │   ├── SkillTreeEditor.jsx # Interactive SVG editor
│   │   │   ├── Profile.jsx        # User XP, level, badges
│   │   │   ├── Leaderboard.jsx    # Top users ranked by XP
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT auth state
│   │   └── utils/
│   │       └── api.js             # Axios instance
│   └── vite.config.js
│
├── backend/
│   ├── app.py                     # Flask app entry point
│   ├── database.py                # MongoDB connection
│   ├── routes/
│   │   ├── auth.py                # Register, login, /me
│   │   ├── skills.py              # CRUD for skill trees
│   │   ├── progress.py            # Node completion + XP
│   │   └── badges.py              # Badge unlock + leaderboard
│   └── scripts/
│       └── seed.py                # Demo data seeder
│
└── docker-compose.yml
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/skills/` | Get my skill trees |
| POST | `/api/skills/` | Create a skill tree |
| GET | `/api/skills/templates` | Starter templates |
| PUT | `/api/skills/:id` | Update a skill tree |
| DELETE | `/api/skills/:id` | Delete a skill tree |
| GET | `/api/progress/:tree_id` | Get tree progress |
| POST | `/api/progress/:tree_id/complete-node` | Mark node complete |
| GET | `/api/badges/` | My earned badges |
| GET | `/api/badges/leaderboard` | Top 10 users |

---

## ⚙️ Environment Variables

Create a `.env` file in `/backend` (see `.env.example`):

```env
JWT_SECRET_KEY=your-super-secret-key-here
MONGO_URI=mongodb://localhost:27017
DB_NAME=skilltree_db
FLASK_ENV=development
```

---

## 🏅 Badge System

| Badge | Trigger |
|-------|---------|
| 🥇 First Step | Complete your first node |
| 📚 Rising Scholar | Complete 5 nodes |
| 🌳 Tree Finisher | Complete an entire skill tree |
| ⚡ XP Champion | Reach 1000 XP |
| 🏆 Legend | Reach Level 10 |
| 🔗 Connector | Create a tree with 10+ linked nodes |
| 🌐 Creator | Make a public skill tree |

---

## 👨‍💻 Author

Built as an internship showcase project demonstrating full-stack development with React, Flask, MongoDB, and Docker.

---

## 📄 License

MIT License — feel free to fork and build on top of this!
