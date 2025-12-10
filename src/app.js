
const express = require('express')
const dotenv = require('dotenv')
dotenv.config();
const fs = require('fs')
const path = require('path')
const csvRoutes = require('./routes/csv.route.js');
const authRoutes = require('./routes/auth.js');
const messageRoutes = require('./routes/sendMessage.js');
const {connectDB} = require('./middleware/mongo.js')


const app = express();

const allowedOrigins = [
  "https://wtsapp-bulk-message-sender.vercel.app",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

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

module.exports = app;
