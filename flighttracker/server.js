const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const RealPriceTracker = require('./real-price-tracker.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize price tracker
const tracker = new RealPriceTracker();

// API Routes
app.get('/api/flights', (req, res) => {
  try {
    const filters = {
      destination: req.query.destination,
      origin: req.query.origin,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      source: req.query.source
    };
    
    const results = tracker.searchPrices(filters);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/flights', (req, res) => {
  try {
    const flightData = req.body;
    
    // Validate required fields
    if (!flightData.origin || !flightData.destination || !flightData.price) {
      return res.status(400).json({ 
        error: 'Missing required fields: origin, destination, price' 
      });
    }
    
    const id = tracker.addPrice(flightData);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/flights/best', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const bestDeals = tracker.getBestDeals(limit);
    res.json(bestDeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/flights/destinations', (req, res) => {
  try {
    const byDestination = tracker.getByDestination();
    res.json(byDestination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/flights/:id', (req, res) => {
  try {
    const success = tracker.deletePrice(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Flight not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/flights/:id', (req, res) => {
  try {
    const success = tracker.updatePrice(req.params.id, req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Flight not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🛫 Flight Price Tracker UI running at http://localhost:${PORT}`);
  console.log(`📊 Add flights, view deals, and track prices in your browser!`);
});