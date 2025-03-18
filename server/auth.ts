import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import express from 'express';
import session from 'express-session';
import { z } from 'zod';
import { storage } from './storage';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@shared/schema';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    return done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      done(new Error('User not found'));
      return;
    }
    done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    done(error);
  }
});

export function setupAuth(app: express.Express) {
  app.use(session({
    secret: 'your-secret-key', // In production, use a proper secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false to work with HTTP in all environments
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/api/admin/login', (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input", errors: result.error });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ message: 'Logged in successfully' });
      });
    })(req, res, next);
  });

  app.post('/api/admin/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/admin/session', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });
}

// Basic authentication middleware
export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Role-based authentication middleware
export function requireRole(roles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = (req.user as { role: UserRole }).role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}