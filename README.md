# Coin Chaser Game

A web-based 2D coin collection game built with a modern full-stack TypeScript architecture. Players control a character, collect coins, avoid obstacles, and compete on a global leaderboard. The project features a custom game engine, real-time canvas rendering, and a scalable backend API.

## Project Overview

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand, Radix UI, custom shadcn/ui components
- **Game Engine:** Custom HTML5 Canvas-based 2D engine (see `client/src/lib/gameEngine.ts`)
- **Backend:** Express.js + TypeScript, Drizzle ORM, PostgreSQL (Neon Database)
- **State Management:** Zustand for game, audio, and leaderboard state
- **Leaderboard:** Global leaderboard with persistent score tracking

## Features

- Responsive, mobile-friendly UI with touch controls
- Multiple game screens: start, play, game over, victory, leaderboard
- Customizable avatars
- Real-time collision detection and game physics
- Audio system with background music and sound effects
- RESTful API backend, ready for cloud deployment
- Scalable, modular codebase with shared types

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Zustand, Radix UI, shadcn/ui
- **Game Engine:** Custom TypeScript, HTML5 Canvas
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon), TypeScript
- **Build Tools:** Vite, esbuild, tsx, Drizzle Kit

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (Neon or local)

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/coin-chaser-game.git
   cd coin-chaser-game
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your database:
   - Create a PostgreSQL database (e.g., on Neon)
   - Set the `DATABASE_URL` environment variable in your shell or `.env` file
4. Run database migrations:
   ```bash
   npm run db:push
   ```

## Development

- Start the backend and frontend in development mode:
  ```bash
  npm run dev
  ```
- The frontend runs on Vite dev server; backend runs with tsx for hot reload.

## Build & Deployment

- Build frontend and backend for production:
  ```bash
  npm run build
  ```
- Start the production server:
  ```bash
  npm start
  ```

## Directory Structure

- `client/` - React frontend and game engine
- `server/` - Express backend and API
- `shared/` - Shared types and schema

## License

MIT
