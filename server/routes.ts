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
      httpOnly: true,
      sameSite: 'lax'
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
      
      // Save session explicitly to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
      });
      
      console.log(`Registration successful for user ${user.username} (ID: ${user.id}), session ID: ${req.sessionID}`);
      
      res.json({ 
        user: { id: user.id, username: user.username, coinBank: user.coinBank || 0 },
        message: 'User registered successfully' 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle unique constraint violation as fallback
      if (error.code === '23505' && error.constraint === 'users_username_unique') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      
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
      
      // Save session explicitly to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
      });
      
      console.log(`Login successful for user ${user.username} (ID: ${user.id}), session ID: ${req.sessionID}`);
      
      res.json({ 
        user: { id: user.id, username: user.username, coinBank: user.coinBank || 0 },
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
  app.get('/api/auth/me', async (req, res) => {
    console.log(`Auth check - Session ID: ${req.sessionID}, User ID: ${req.session.userId}`);
    
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username,
          coinBank: user.coinBank || 0
        } 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
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

  // Update user's coin bank
  app.put('/api/coinbank', requireAuth, async (req, res) => {
    try {
      const { coinBank } = req.body;
      const userId = req.session.userId!;
      
      if (typeof coinBank !== 'number' || coinBank < 0) {
        return res.status(400).json({ error: 'Invalid coin bank value' });
      }

      await storage.updateUserCoinBank(userId, coinBank);
      res.json({ coinBank });
    } catch (error) {
      console.error('Coin bank update error:', error);
      res.status(500).json({ error: 'Failed to update coin bank' });
    }
  });

  // Add coins to user's coin bank
  app.post('/api/coinbank/add', requireAuth, async (req, res) => {
    try {
      const { coins } = req.body;
      const userId = req.session.userId!;
      
      if (typeof coins !== 'number' || coins <= 0) {
        return res.status(400).json({ error: 'Invalid coins value' });
      }

      const newCoinBank = await storage.addCoinsToBank(userId, coins);
      res.json({ coinBank: newCoinBank, coinsAdded: coins });
    } catch (error) {
      console.error('Add coins error:', error);
      res.status(500).json({ error: 'Failed to add coins' });
    }
  });

  // Get maximum coin bank value from all users
  app.get('/api/coinbank/max', async (req, res) => {
    try {
      const maxCoinBank = await storage.getMaxCoinBank();
      res.json({ maxCoinBank });
    } catch (error) {
      console.error('Get max coin bank error:', error);
      res.status(500).json({ error: 'Failed to get max coin bank' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
