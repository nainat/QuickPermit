const express = require('express');
const cors = require('cors'); // Make sure cors is imported
require('dotenv').config(); // If you use dotenv for environment variables
const summarizeRoute = require('./summarizeRoute'); // Your summarization routes

const app = express();
const port = process.env.PORT || 5000; // Ensure this matches your frontend's fetch URL

// Middleware
app.use(express.json({ limit: '50mb' })); // Crucial for large Base64 strings, increase if needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For form data, good to have

// CORS Configuration - THIS IS LIKELY THE PROBLEM AREA
// Option 1: Allow all origins (for development - BE CAREFUL IN PRODUCTION)
app.use(cors());

// Option 2: Allow specific origin (BETTER for development, REQUIRED for production)
/*
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's actual URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
*/

// Use your routes
app.use('/api', summarizeRoute); // All routes starting with /api will be handled by summarizeRoute

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});