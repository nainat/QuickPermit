const express = require('express');
const cors = require('cors'); 
require('dotenv').config(); 
const summarizeRoute = require('./summarizeRoute');

const app = express();
const port = process.env.PORT || 5000; // Ensure this matches your frontend's fetch URL

app.use(express.json({ limit: '50mb' })); // Crucial for large Base64 strings, increase if needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For form data, good to have
app.use(cors());
app.use('/api', summarizeRoute); // All routes starting with /api will be handled by summarizeRoute

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
