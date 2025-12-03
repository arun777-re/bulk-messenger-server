import express from 'express';
import cors from 'cors';
import path from 'path';
import csvRoutes from './routes/csv.route';
import authRoutes from './routes/auth';
import messageRoutes from './routes/sendMessage';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use((req, res, next) => {
  if (req.method === "GET") return next(); 
  return express.json()(req, res, next);
});

// Routes
app.use('/api/csv', csvRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/message',messageRoutes)

export default app;
