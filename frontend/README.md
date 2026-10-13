# JobTrack — React Frontend (Phase 10.1 Foundation)

JobTrack Frontend is a responsive React application built with Vite, TypeScript, React Router, and Tailwind CSS. It communicates with the JobTrack Spring Boot backend REST API.

---

## 🛠️ Tech Stack

* **React 18 / Vite 6**
* **TypeScript**
* **React Router DOM 7**
* **Tailwind CSS v4**
* **Lucide React Icons**

---

## 🚀 Environment & Setup

### 1. Prerequisites
* Node.js 18+
* npm 9+
* JobTrack Spring Boot Backend running on `http://localhost:8080`

### 2. Environment Variable Configuration
Copy `.env.example` to `.env`:
```text
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start Vite development server (Port 5173)
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Authentication & API Architecture

* **API Client (`src/services/api.ts`):** Centralized native `fetch` client adding Bearer authorization headers and standardizing HTTP error responses.
* **Token Storage (`src/utils/authStorage.ts`):** Isolated helper managing JWT persistence in `localStorage`.
* **Auth Context (`src/context/AuthContext.tsx`):** State provider for authentication state, login, registration, and logout.
* **Route Protection (`src/routes/ProtectedRoute.tsx`):** Guards protected endpoints (such as `/dashboard`) and redirects unauthenticated users to `/login`.
