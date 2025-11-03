import path from 'path';
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { app, server } from './socket/socket.js';
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
  'http://localhost:5173', // Local development
  'https://your-vercel-app.vercel.app' // Replace with your Vercel URL after deployment
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['*', 'Authorization']
}));

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
