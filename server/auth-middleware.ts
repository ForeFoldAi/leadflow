import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

// Simple authentication middleware
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Get user information from headers, body, or query
    const userEmail = req.body.userEmail || req.query.userEmail || req.headers['x-user-email'];
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    if (!userEmail && !userId) {
      // Require authentication - no backward compatibility
      return res.status(401).json({ error: "Authentication required" });
    }
    
    let user;
    if (userEmail) {
      user = await storage.getUserByEmail(userEmail as string);
    } else if (userId) {
      user = await storage.getUser(userId as string);
    }
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: "User account is inactive" });
    }
    
    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
} 