import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for authentication
  app.use(session({
    secret: process.env.SESSION_SECRET || 'coin-game-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Register user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.insertUser({ username, password: hashedPassword });
      
      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({ 
        user: { id: user.id, username: user.username },
        message: 'User registered successfully' 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({ 
        user: { id: user.id, username: user.username },
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout user
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current user
  app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ 
      user: { 
        id: req.session.userId, 
        username: req.session.username 
      } 
    });
  });

  // Submit score (requires authentication)
  app.post('/api/scores', requireAuth, async (req, res) => {
    try {
      const { score, coins, level } = req.body;
      const userId = req.session.userId;

      if (typeof score !== 'number' || typeof coins !== 'number' || typeof level !== 'number') {
        return res.status(400).json({ error: 'Invalid score data' });
      }

      const newScore = await storage.insertScore({ 
        userId: userId!, 
        score, 
        coins, 
        level 
      });
      
      res.json({ 
        score: newScore,
        message: 'Score saved successfully' 
      });
    } catch (error) {
      console.error('Score submission error:', error);
      res.status(500).json({ error: 'Failed to save score' });
    }
  });

  // Get global leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopScores(limit);
      res.json({ leaderboard });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Get user's personal scores
  app.get('/api/scores/me', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const scores = await storage.getUserScores(userId);
      res.json({ scores });
    } catch (error) {
      console.error('Personal scores error:', error);
      res.status(500).json({ error: 'Failed to fetch personal scores' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
