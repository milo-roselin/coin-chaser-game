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

## July 24, 2025 - Fixed Victory Screen Global Leaderboard Score Submission
- **Session Persistence Fixed**: Implemented explicit session saving with `req.session.save()` to prevent session loss after login
- **Victory Screen Working**: Scores now properly save to global leaderboard from victory screen for authenticated users
- **Password Visibility Toggle**: Added eye/eye-off icon to login form allowing users to show/hide password while typing
- **Session Configuration Enhanced**: Added rolling sessions and improved cookie settings for better session management
- **Score Submission Verified**: Confirmed authenticated users can successfully save scores to database during gameplay
- **Authentication Stability**: Login sessions now persist properly throughout game sessions preventing 401 errors

## July 23, 2025 - Database-Integrated Score and Coin Bank System Complete
- **User-Specific Database Values**: Coin bank UI displays the authenticated user's personal coin bank from database, local storage for guests
- **Personalized Victory Screen**: Victory screen now asks "Are you a different person than [LastPlayerName]?" allowing players to either continue as the same player or enter a new name for both local and global leaderboards
- **Accurate Global Leaderboard**: Fixed global leaderboard to display users' total coin bank values (from users table) instead of individual game session coins, ensuring consistency with coin bank display
- **Cumulative Scoring System**: Changed leaderboard from showing highest individual game score to cumulative total of all scores, so each game adds to your total rather than replacing it
- **Database-Aware Score Tracking**: Modified score display system to prioritize database values for authenticated users:
  - useUserStats store fetches user's highest score, total coins, and highest level from database
  - StartScreen displays database scores/levels for logged-in users, local storage for guests
  - Continue button and keyboard shortcuts work with database-aware level progression
- **Enhanced API Endpoints**: Added GET /api/coinbank/max endpoint to retrieve maximum coin bank value across all users
- **Automatic Data Synchronization**: Score and coin bank data automatically syncs on login/logout/registration
- **Seamless User Experience**: System gracefully falls back to local storage when database unavailable

## July 23, 2025 - Cross-Device Authentication and Global Leaderboard System Complete
- **User Authentication System**: Implemented comprehensive login/registration system with:
  - Secure password hashing using bcrypt
  - Session-based authentication with express-session
  - User registration with validation (minimum 6 characters, unique usernames)
  - Persistent login sessions across browser sessions
  - Authentication state management with Zustand
- **Database Integration**: Connected PostgreSQL database with Drizzle ORM:
  - Users table with username, password, and timestamps
  - Scores table with user relationships, score data, and level information
  - Proper foreign key relationships and data integrity
  - Database pushed successfully with `npm run db:push`
- **Global Leaderboard**: Full-featured cross-device scoring system:
  - Real-time global leaderboard with player rankings
  - Automatic score submission for authenticated users
  - Global leaderboard accessible from start screen
  - Visual distinction between current user and others
  - Trophy icons for top 3 players with gold/silver/bronze styling
- **Victory Screen Enhancement**: Dual scoring system integration:
  - Maintains existing local leaderboard functionality
  - Automatic global score submission for logged-in users
  - Login prompt for unauthenticated users
  - Clear status indicators for both local and global score saving
- **Start Screen Integration**: Added global leaderboard access:
  - Split leaderboard buttons: Local [L] and Global [G]
  - Keyboard shortcuts for both leaderboard types
  - Authentication status checking on app initialization
- **API Endpoints**: Complete RESTful API with:
  - POST /api/auth/register - User registration
  - POST /api/auth/login - User login
  - POST /api/auth/logout - User logout
  - GET /api/auth/me - Current user status
  - POST /api/scores - Submit score (authenticated users only)
  - GET /api/leaderboard - Global leaderboard data
  - GET /api/scores/me - Personal score history
- **Security Features**: Proper authentication middleware and session management
- **Error Handling**: Comprehensive error states and user feedback
- **Mobile Responsive**: All authentication UI components work seamlessly on mobile devices

The game now supports cross-device score tracking, allowing players to compete globally while maintaining their local progress. Users can create accounts, login from any device, and see their scores persist across sessions.

## July 21, 2025 - Avatar Thumbnail System Complete
- **Avatar PNG Thumbnails**: Successfully implemented user-provided avatar images as thumbnails
  - Wario: Custom yellow square with purple mustache saved to `/client/public/images/wario-thumbnail.png`
  - Count Olaf: Existing thumbnail at `/client/public/images/count-olaf.png` now properly integrated
  - Tom Nook: New orange/brown tanuki design saved to `/client/public/images/tom-nook.png`
  - All animated avatar components replaced with clean PNG thumbnails for better performance
  - Added comprehensive error handling and success logging for all avatar image loading
  - Maintains consistent pixelated rendering style across all avatar thumbnails
- **Audio Settings Shortcut**: Changed keyboard shortcut from "A" to "O" to avoid WASD movement key conflicts
- **Coin Bank Display Enhancement**: Added coin bank totals to both leaderboard and victory screens for better visibility

## July 19, 2025 - Progressive Difficulty System
- **Progressive TNT Scaling**: Implemented level-based difficulty scaling with multiple multipliers:
  - Coin clusters increase every 2 levels instead of every level
  - Additional TNT scales with level multiplier (capped at 4x by level 16)
  - TNT movement speed increases 8-10% per level
  - Barrier TNT quantity scales with progressive multiplier (capped at 3x)
  - Circular TNT movement speed scales 8% per level
- **Balanced Progression**: Each level becomes noticeably more challenging with more TNT and faster movement
- **Performance Optimized**: All speed and quantity increases are capped to prevent performance issues
- **Comprehensive Scaling**: Affects all TNT types - circular, linear, barrier, and additional spawns

## July 18, 2025 - Final Polish Phase
- **Avatar System Completed**: Implemented 5 playable avatars with unique animated designs:
  - Mr. MoneyBags (Monopoly-themed leprechaun)
  - Count Olaf (theatrical villain with top hat and unibrow)
  - Tom Nook (Animal Crossing tanuki with apron)
  - Ebenezer Scrooge (flat geometric design matching thumbnail exactly)
  - Wario (greedy anti-hero with mustache and cap)
- **Avatar Selection**: All avatars are free to unlock with real-time switching during gameplay
- **Smooth Avatar Rendering**: Implemented clean, flat geometric rendering for Scrooge avatar
- **Live Avatar Updates**: Added dynamic avatar switching system that updates immediately when selected
- **Avatar Thumbnails**: Direct image usage for exact thumbnail representation

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