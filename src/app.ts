

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import csvRoutes from './routes/csv.route';
import authRoutes from './routes/auth';
import messageRoutes from './routes/sendMessage';
import { connectDB } from './middleware/mongo';


const app = express();
app.use(cors({origin:["https://wtsapp-bulk-message-sender.vercel.app", "http://localhost:3000"],
  methods:["GET","POST","PUT","DELETE","PATCH"],
  credentials:true,
}));

app.options("*",cors());

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
