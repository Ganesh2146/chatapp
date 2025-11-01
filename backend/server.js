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

// ✅ Allow your Vercel frontend to access backend
app.use(cors({
  origin: ['https://your-frontend-name.vercel.app'], // 🔁 replace this
  credentials: true,
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

// Start server
server.listen(port, (err) => {
  if (err) {
    console.log("Internal server error:", err);
  } else {
    connectToDB();
    console.log("✅ Server running on port:", port);
  }
});
