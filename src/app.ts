

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import csvRoutes from './routes/csv.route';
import authRoutes from './routes/auth';
import messageRoutes from './routes/sendMessage';
import { connectDB } from './middleware/mongo';


const app = express();

const allowedOrigins = [
  "https://wtsapp-bulk-message-sender.vercel.app",
  "http://localhost:3000",
];

// middleware to setHeaders in place ofcourse
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }else{
    res.setHeader("Access-Control-Allow-Origin","");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});


// db connection 
connectDB();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Routes
app.use('/api/csv', csvRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/message',messageRoutes)

export default app;
