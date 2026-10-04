# Codenova

A free, modern online coding learning platform where users progress through structured levels (Beginner, Intermediate, Expert) in their chosen language (Python, Java, C++, JavaScript). Admins manage content, assessments, and platform data via a secure admin panel.

## Features

- **Student flow**: Register → Login → Select language → 10-question placement quiz → Assigned level (Beginner / Intermediate / Expert) → Dashboard with level progress → Modules (theory + quizzes + coding) → Coding IDE with Run/Submit via OneCompiler API.
- **Levels**: Beginner (70% theory, 30% practice), Intermediate (50/50), Expert (80% coding, 20% theory). Each level has 10 modules and a final assessment.
- **Admin**: Secure login, dashboard stats, manage users (block/delete/reset password), manage courses/levels/modules, manage assessments and coding problems, results & reports.
- **Tech**: MongoDB Atlas (Mongoose), JWT auth, rate limiting, OneCompiler API for code execution (key in env).

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- OneCompiler API key (optional; for code run/submit)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, JWT_ADMIN_SECRET, ONECOMPILER_API_KEY (optional)
npm install
npm run seed   # creates default admin (admin@codenova.com / admin123) and courses + placement quiz
npm run dev    # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api if different
npm install
npm run dev    # http://localhost:5173
```

### 3. Environment variables

**Backend (`.env`):**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for student JWT |
| `JWT_ADMIN_SECRET` | Secret for admin JWT |
| `ONECOMPILER_API_KEY` | OneCompiler API key (for run/submit) |
| `PORT` | Server port (default 5000) |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. http://localhost:5173) |

**Frontend (`.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. http://localhost:5000/api) |

## Scripts

- **Backend**: `npm run dev` (watch), `npm start`, `npm run seed`
- **Frontend**: `npm run dev`, `npm run build`, `npm run preview`

## Default admin

After `npm run seed`: **admin@codenova.com** / **admin123**. Change in production.

## Security

- Student and admin JWT; admin routes protected.
- Passwords hashed with bcrypt.
- Rate limiting on auth and code execution.
- OneCompiler key and MongoDB URI in env only.

## License

MIT.
