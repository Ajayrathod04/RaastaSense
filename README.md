# 🚦 RaastaSense: Anime-Themed Smart Road Safety Platform

RaastaSense is an interactive, visually stunning, and highly intuitive anime-themed road safety platform. It is engineered with a **deterministic-first** philosophy, ensuring complete offline utility for core features (rules search, incident reporting, emergency guides) while offering an optional AI chatbot enhancement through the Gemini API.

Developed in TypeScript across a high-performance **React frontend** and a streamlined **Express backend**, RaastaSense is pre-configured for a single-port production server deployment—perfect for fast-paced demos, hackathons, and serverless hosting like Google Cloud Run.

---

## 🎯 Problem Statement
Road accidents, lack of traffic rule awareness, delayed emergency coordinates reporting, and tedious reporting channels remain critical public safety hazards globally. Traditional civic platforms are often dry, slow, and overly bureaucratic, discouraging active civic engagement.

**RaastaSense** bridges this gap by introducing an ultra-immersive, character-driven gamified experience that:
1. Educates drivers through interactive visual dialogue rules lookups (**DriveLegal**).
2. Facilitates high-speed community road incident reporting with direct agency routing (**RoadWatch**).
3. Connects distressed users to local response teams instantly with live GPS simulation (**RoadSOS**).

---

## 🎨 Meet the Guardians (The Anime Visualization Layer)
Our character avatars guide the user seamlessly through the platform:
*   **🚦 Traffic Sensei**: A wise, authoritative, yet lighthearted mentor who breaks down traffic fines, speed parameters, and safety disciplines.
*   **🛡️ Road Guardian**: A valiant cybernetic street-knight who guards your tarmac pathways, coordinating community incident submissions directly to public works.
*   **👼 Rescue Spirit**: A soft, calming angelic presence who helps users stay grounded during medical stress, providing immediate emergency guidelines and dial links.

---

## ⚡ Technical Architecture
*   **Frontend**: React (Single Page Application), TypeScript, Vite (Bundler), Tailwind CSS (Cyberpunk-glassmorphism visuals), and Framer Motion (ultra-smooth anime character dialogues and panel transitions).
*   **Backend**: Node.js, Express, TypeScript (transpiling via `tsc`).
*   **AI Integration**: Google Generative AI (Gemini SDK) with automated regex deterministic local chatbot fallback when API keys are absent.
*   **Packaging & Deployment**: Multi-stage Docker configurations, serving compiled React assets directly from the Express server on a unified port (`PORT=8080`) for zero-config serverless deployments.

---

## 📁 File Structure
```
RaastaSense/
  ├── frontend/                 # React Client Application
  │    ├── src/
  │    │    ├── components/     # Visual Avatars & Interfaces
  │    │    ├── App.tsx         # Monolithic Hackathon Dashboard
  │    │    ├── index.css       # Tailwind Directives & Animations
  │    │    └── main.tsx        # React client entry point
  │    ├── index.html           # Base HTML layout
  │    ├── tailwind.config.js   # Custom Theme configurations
  │    └── vite.config.ts       # Development proxies & configurations
  │
  ├── backend/                  # Node + Express API Server
  │    ├── src/
  │    │    └── server.ts       # Consolidated Single-Entry API Server
  │    ├── tsconfig.json        # TypeScript compile directives
  │    └── package.json         # Server specifications
  │
  ├── package.json              # Monorepo Workspace settings
  ├── .env                      # Global configurations
  └── Dockerfile                # Multi-stage container setup
```

---

## 🚀 Setup & Launch Instructions

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### 1. Installation
In the root directory, install all workspace dependencies concurrently:
```bash
npm install
```

### 2. Configure Environment Variables
Locate or create a `.env` file in the root folder:
```env
PORT=8080
NODE_ENV=development
GEMINI_API_KEY=your_optional_gemini_api_key_here
```

### 3. Launch Development Environments
To run both the React client dev server and the Express API server concurrently (with hot-reloading active):
```bash
npm run dev
```
*   **Frontend Development Port**: `http://localhost:5173`
*   **Backend API Port**: `http://localhost:8080` (requests from the client to `/api/*` are dynamically proxied)

### 4. Build and Launch Production Server (Google Cloud Run Compatible)
Compile the React frontend bundle and build the TypeScript backend server:
```bash
npm run build
```
Start the production-ready server:
```bash
npm start
```
*   **Production Deployment Port**: `http://localhost:8080` (The single-port server hosts the React SPA static files and routes all backend APIs seamlessly!)

---

## 🏆 Future Scope
1.  **Real-Time Map Kit Integration**: Replace the mock coordinate mapping with Google Maps or Mapbox APIs for interactive road report markers.
2.  **Voice-Enabled Sensei**: Implement text-to-speech for character avatars, enabling real-time spoken driving instructions.
3.  **Local Community Leaderboard**: A gamified reward system granting XP or digital road badges to citizens who actively submit verified road hazards.