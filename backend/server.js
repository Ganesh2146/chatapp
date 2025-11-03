import path from 'path';
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRouter.js';
import messageRouter from './routes/messageRouter.js';
import userRouter from './routes/userRouter.js';
import connectToDB from './db/connectdb.js';

const app = express();
const server = createServer(app);
import authRouter from './routes/authRouter.js';
import messageRouter from './routes/messageRouter.js';
import userRouter from './routes/userRouter.js';
import connectToDB from './db/connectdb.js';

// Base setup
const __dirname = path.resolve();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chatapp-jet-gamma.vercel.app'
];

// Enable CORS for all routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '')
    );
    
    if (!isAllowed) {
      const msg = `CORS policy: ${origin} not allowed`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['*'],
  maxAge: 600 // Cache preflight request for 10 minutes
}));

// Handle preflight requests
app.options('*', cors());

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowedOrigin => 
        origin === allowedOrigin || 
        origin.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '')
      );
      
      if (!isAllowed) {
        const msg = `Socket.IO CORS policy: ${origin} not allowed`;
        console.error(msg);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['*'],
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 30000, // Increase timeout to 30 seconds
  pingInterval: 25000,
  cookie: false, // Disable Socket.IO cookies since we're using JWT
  path: '/socket.io/' // Ensure consistent path
});

// Export io for use in other files
app.set('io', io);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/users", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle CORS errors
  if (err.message.includes('CORS') || err.message.includes('allowed by CORS')) {
    return res.status(403).json({ 
      success: false,
      message: 'Not allowed by CORS policy',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});

// ❌ Remove static frontend serving — handled by Vercel now
// app.use(express.static(path.join(__dirname, "/frontend/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
// });

// Health and root endpoints for uptime checks
app.get('/', (req, res) => {
  res.status(200).send('Service is up');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
server.listen(port, (err) => {
  if (err) {
    console.log("Internal server error:", err);
  } else {
    connectToDB();
    console.log("✅ Server running on port:", port);
  }
});
