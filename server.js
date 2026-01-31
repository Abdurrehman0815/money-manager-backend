const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load config
dotenv.config();

// Connect to Database (We will create this file next)
connectDB(); 

const app = express();

// Middleware
app.use(cors({
  origin: ['https://money-manager-frontend-steel.vercel.app', 'https://money-manager-frontend-bjsj188te.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json()); // Allows us to accept JSON data in the body
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('Money Manager API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});