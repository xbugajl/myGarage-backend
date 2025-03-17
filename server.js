const express = require('express');
const app = express();

// Allow JSON data to be sent to the server
app.use(express.json());

// Fake "database" (just an array for now)
let garages = [];

// GET: See all garages
app.get('/api/garages', (req, res) => {
  res.json(garages);
});

// POST: Add a new garage
app.post('/api/garages', (req, res) => {
  const newGarage = {
    id: garages.length + 1,
    name: req.body.name,
    location: req.body.location,
  };
  garages.push(newGarage);
  res.status(201).json(newGarage);
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});