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

// CORS configuration for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chatapp-jet-gamma.vercel.app'
];

// CORS middleware with debug logging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('HTTP Request Origin:', origin);
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Enhanced CORS configuration for all routes
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Handle preflight requests
app.options('*', cors());

// Socket.IO configuration with enhanced CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.some(allowedOrigin => 
        origin === allowedOrigin || 
        origin.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '')
      )) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Export io for use in other files
app.set('io', io);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/users", userRouter);

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
