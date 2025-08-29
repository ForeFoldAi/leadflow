import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { config } from "dotenv";
import cors from "cors";
import session from "express-session";
import { storage } from "./storage.js";

// Import session store for production
let sessionStore: any;
if (process.env.NODE_ENV === 'production') {
  try {
    const pgSession = require('connect-pg-simple')(session);
    sessionStore = new pgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      },
      tableName: 'user_sessions'
    });
  } catch (error) {
    console.warn('Failed to initialize PostgreSQL session store, falling back to MemoryStore');
    sessionStore = undefined;
  }
}

// Simple rate limiting for production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

// Simple logging function
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Load environment variables from .env file
config();

// Validate required environment variables for production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables for production:', missingVars);
    process.exit(1);
  }
}

const app = express();

// Configure CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'https://leadflow-rho.vercel.app', // Add your Vercel frontend URL
      ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(',') : []),
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ].filter((origin): origin is string => Boolean(origin));
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email']
};

app.use(cors(corsOptions));

// Security headers and rate limiting for production
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS header for HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const clientData = rateLimitMap.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    } else {
      clientData.count++;
    }
    
    // Clean up old entries
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [ip, data] of rateLimitMap.entries()) {
        if (now > data.resetTime) {
          rateLimitMap.delete(ip);
        }
      }
    }
  }
  next();
});

// Configure session middleware with production optimizations
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  name: process.env.SESSION_NAME || 'leadconnect-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.leadsflowforefoldai.com' : undefined
  },
  // Production session store configuration
  store: sessionStore
}));

// Configure body parsers with larger limits for file uploads and imports
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Production logging - be more selective about what we log
      if (process.env.NODE_ENV === 'production') {
        // Only log errors and important operations in production
        if (res.statusCode >= 400 || path.includes('/auth') || path.includes('/leads')) {
          if (capturedJsonResponse && res.statusCode >= 400) {
            logLine += ` :: Error: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      } else {
        // Development logging - more verbose
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Health check endpoint for production monitoring
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const dbHealth = await storage.healthCheck();
      res.status(200).json({ 
        status: dbHealth.status, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: dbHealth.database
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: 'error'
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error handler:', err);
    
    // Handle specific error types
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ 
        error: "Request entity too large. Please reduce the file size or number of records." 
      });
    }
    
    if (err.message && err.message.includes('Connection terminated')) {
      return res.status(503).json({ 
        error: "Database connection issue. Please try again in a moment." 
      });
    }
    
    // Production error handling - don't expose internal errors
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? "Internal Server Error" : err.message || "An error occurred")
      : err.message || "Internal Server Error";

    res.status(status).json({ error: message });
  });

  // Server only serves API endpoints - client is deployed separately
  // No need to serve static files or setup Vite

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
})();
