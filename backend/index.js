const express = require('express');
const cors = require('cors'); 
require('dotenv').config(); 
const summarizeRoute = require('./summarizeRoute');

const app = express();
const port = process.env.PORT || 5000; 

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 
app.use(cors());
app.use('/api', summarizeRoute); 

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
