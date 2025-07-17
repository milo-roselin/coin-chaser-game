# Overview

This is a web-based 2D coin collection game built with a full-stack TypeScript architecture. The application features a React frontend with a canvas-based game engine, Express.js backend, and PostgreSQL database setup. The game allows players to control a character, collect coins, avoid obstacles, and compete on a leaderboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **3D Graphics**: React Three Fiber and React Three Drei (prepared for potential 3D features)
- **State Management**: Zustand with middleware support for game state, audio, and leaderboard
- **Game Engine**: Custom HTML5 Canvas-based 2D game engine

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Structure**: RESTful API with `/api` prefix
- **Development**: Hot reloading with Vite integration in development mode

## Build System
- **Frontend**: Vite with React plugin, GLSL shader support, and custom aliases
- **Backend**: esbuild for production builds with ESM output
- **TypeScript**: Shared configuration across client, server, and shared directories
- **Development**: tsx for running TypeScript directly in development

# Key Components

## Game Engine (`gameEngine.ts`)
- Custom 2D collision detection system
- Touch/mouse input handling with camera following
- Object management for player, coins, obstacles, and goals
- Callback system for game events (coin collection, obstacle hits, level completion)

## State Management
- **Game State** (`useCoinGame.tsx`): Manages game phases, score, player position
- **Audio State** (`useAudio.tsx`): Controls background music and sound effects with mute functionality
- **Leaderboard State** (`useLeaderboard.tsx`): Persistent local storage of high scores with inline editing support

## UI Components
- **Game Screens**: Start, playing, game over, victory, and leaderboard screens
- **Touch Controls**: Mobile-friendly interface with visual feedback
- **Canvas Game**: Real-time rendering with responsive design
- **Leaderboard**: Persistent score tracking with inline name editing functionality

## Database Schema
- **Users Table**: Basic user authentication structure with username/password
- **Storage Interface**: Abstracted CRUD operations with in-memory implementation for development

# Data Flow

1. **Game Initialization**: Audio assets loaded, game state reset to "start"
2. **Game Loop**: Canvas rendering, collision detection, state updates via Zustand
3. **Score Management**: Local score tracking with persistent leaderboard storage
4. **Audio System**: Conditional sound playback based on mute state
5. **Backend Communication**: Ready for API integration with existing storage interface

# External Dependencies

## Core Technologies
- **Database**: Neon Database (PostgreSQL) via environment variable `DATABASE_URL`
- **UI Framework**: Radix UI components for accessible interface elements
- **Fonts**: Inter font family via Fontsource
- **Audio**: HTML5 Audio API for game sounds

## Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **PostCSS**: CSS processing with Tailwind CSS
- **ESBuild**: Production build optimization
- **Replit Integration**: Runtime error overlay for development

# Deployment Strategy

## Development Mode
- Vite dev server for frontend with HMR
- tsx for running TypeScript backend directly
- Database migrations via `drizzle-kit push`

## Production Build
- Frontend: Vite build to `dist/public`
- Backend: esbuild bundle to `dist/index.js`
- Environment: NODE_ENV=production with static file serving

## Database Management
- Schema defined in `shared/schema.ts` for type safety
- Migrations in `./migrations` directory
- PostgreSQL dialect with Neon Database integration

The application is architected for scalability with clear separation between frontend game logic, backend API services, and database operations. The modular design allows for easy feature additions and maintains type safety across the full stack.

# Recent Changes

## January 17, 2025
- **Inline Leaderboard Editing**: Added ability to edit player names directly in the leaderboard by clicking on any name
- **Enhanced Mobile Detection**: Improved iPad and tablet detection for proper control panel display
- **TNT Movement Optimization**: Fixed TNT disappearing/reappearing issues and reduced clustering around coin clusters
- **Boundary Constraints**: Implemented comprehensive boundary checks to prevent game objects from overlapping control panel area
- **Mandatory Name Input**: Removed anonymous score submissions - players must enter a name to save their score to the leaderboard
- **Leaderboard Restrictions**: Players can only edit their own name (multiple edits allowed)
- **Audio System Updates**: Game now starts with audio unmuted by default, with mute controls available in home screen and during gameplay
- **TNT Flash Fix**: Added initialization flag to prevent rendering TNT obstacles before camera is properly positioned, eliminating visual flash at startup
- **Coin Bank System**: Added persistent coin bank that saves all coins collected across game sessions, with display on start screen and victory screen