const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const AutoFlightDiscovery = require('./auto-discovery');

const app = express();
const PORT = 3000;

// Simple in-memory storage for now
let flights = [];
let nextId = 1;

// Data persistence
const dataFile = './data/simple-flights.json';

function loadData() {
  try {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const parsed = JSON.parse(data);
      flights = parsed.flights || [];
      nextId = parsed.nextId || 1;
    }
  } catch (error) {
    console.log('Starting with empty data');
    flights = [];
    nextId = 1;
  }
}

function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify({ 
      flights, 
      nextId,
      lastUpdated: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();

// Initialize auto-discovery
const autoDiscovery = new AutoFlightDiscovery();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/flights', (req, res) => {
  try {
    let results = [...flights];
    
    // Apply filters
    if (req.query.destination) {
      results = results.filter(f => 
        f.destination.toLowerCase().includes(req.query.destination.toLowerCase())
      );
    }
    
    if (req.query.origin) {
      results = results.filter(f => 
        f.origin.toLowerCase().includes(req.query.origin.toLowerCase())
      );
    }
    
    if (req.query.maxPrice) {
      results = results.filter(f => f.price <= parseFloat(req.query.maxPrice));
    }
    
    if (req.query.source) {
      results = results.filter(f => 
        f.source && f.source.toLowerCase().includes(req.query.source.toLowerCase())
      );
    }
    
    // Sort by price
    results.sort((a, b) => a.price - b.price);
    
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
    
    const flight = {
      id: nextId.toString(),
      timestamp: new Date().toISOString(),
      ...flightData
    };
    
    flights.push(flight);
    nextId++;
    saveData();
    
    console.log(`✅ Added flight: ${flight.origin} → ${flight.destination} - £${flight.price}`);
    res.json({ success: true, id: flight.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/flights/best', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const sorted = [...flights].sort((a, b) => a.price - b.price);
    res.json(sorted.slice(0, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/flights/destinations', (req, res) => {
  try {
    const byDestination = {};
    
    flights.forEach(flight => {
      if (!byDestination[flight.destination]) {
        byDestination[flight.destination] = [];
      }
      byDestination[flight.destination].push(flight);
    });
    
    // Sort each destination by price
    Object.keys(byDestination).forEach(dest => {
      byDestination[dest].sort((a, b) => a.price - b.price);
    });
    
    res.json(byDestination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/flights/:id', (req, res) => {
  try {
    const index = flights.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    const deletedFlight = flights.splice(index, 1)[0];
    saveData();
    
    console.log(`🗑️  Deleted flight: ${deletedFlight.origin} → ${deletedFlight.destination}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-Discovery API Routes
app.post('/api/discovery/start', (req, res) => {
  try {
    autoDiscovery.startAutoDiscovery();
    res.json({ success: true, message: 'Auto-discovery started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/stop', (req, res) => {
  try {
    autoDiscovery.stopAutoDiscovery();
    res.json({ success: true, message: 'Auto-discovery stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/discovery/stats', (req, res) => {
  try {
    const stats = autoDiscovery.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/discovery/deals', (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    let deals;
    
    if (filter === 'new') {
      deals = autoDiscovery.getDealsByStatus('new');
    } else if (filter === 'saved') {
      deals = autoDiscovery.getDealsByStatus('saved');
    } else {
      deals = autoDiscovery.getDiscoveredDeals();
    }
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/deals/:id/save', (req, res) => {
  try {
    const success = autoDiscovery.updateDealStatus(req.params.id, 'saved');
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Deal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/deals/:id/dismiss', (req, res) => {
  try {
    const success = autoDiscovery.updateDealStatus(req.params.id, 'dismissed');
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Deal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/deals/:id/add-to-tracker', (req, res) => {
  try {
    const deals = autoDiscovery.getDiscoveredDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Convert deal to flight format and add to tracker
    const flight = {
      id: nextId.toString(),
      timestamp: new Date().toISOString(),
      origin: deal.origin,
      destination: deal.destination,
      price: deal.price,
      airline: deal.airline,
      departureDate: deal.departureDate,
      returnDate: deal.returnDate,
      passengers: deal.passengers,
      source: 'Auto Discovery',
      notes: `Auto-discovered deal from ${deal.destination} - Score: ${deal.dealScore}/10`
    };
    
    flights.push(flight);
    nextId++;
    saveData();
    
    // Mark deal as saved
    autoDiscovery.updateDealStatus(req.params.id, 'saved');
    
    res.json({ success: true, flightId: flight.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings API Routes
app.get('/api/discovery/settings', (req, res) => {
  try {
    const settings = autoDiscovery.settings;
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discovery/settings', (req, res) => {
  try {
    const newSettings = req.body;
    
    // Validate settings structure
    if (!newSettings.travelers || !newSettings.dates || !newSettings.budget || 
        !newSettings.destinations || !newSettings.airports) {
      return res.status(400).json({ 
        error: 'Invalid settings format. Required: travelers, dates, budget, destinations, airports' 
      });
    }
    
    // Save settings to auto-discovery
    const success = autoDiscovery.saveSettings(newSettings);
    
    if (success) {
      console.log('✅ Settings updated successfully');
      console.log(`👥 Travelers: ${newSettings.travelers.adults} adults + ${newSettings.travelers.children} children`);
      console.log(`📅 Date range: ${newSettings.dates.startDate} to ${newSettings.dates.endDate}`);
      console.log(`💰 Budget: £${newSettings.budget.perPerson} per person`);
      console.log(`🌍 Destinations: ${newSettings.destinations.length} selected`);
      console.log(`✈️ Airports: ${newSettings.airports.join(', ')}`);
      
      // Stop current discovery to restart with new settings
      if (autoDiscovery.isRunning) {
        console.log('🔄 Restarting auto-discovery with new settings...');
        autoDiscovery.stopAutoDiscovery();
        setTimeout(() => {
          autoDiscovery.startAutoDiscovery();
        }, 2000);
      }
      
      res.json({ 
        success: true, 
        message: 'Settings saved successfully. Discovery will restart with new preferences.',
        searchConfigs: autoDiscovery.searchConfigs.length
      });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger auto-discovery endpoint
app.post('/api/discovery/trigger', (req, res) => {
  try {
    if (autoDiscovery.isRunning) {
      autoDiscovery.triggerSearch();
      res.json({ success: true, message: 'Auto-discovery search triggered' });
    } else {
      res.json({ success: false, message: 'Auto-discovery is not running' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import deals endpoint
app.post('/api/discovery/import-deals', (req, res) => {
  try {
    // Get all new deals from auto-discovery
    const newDeals = autoDiscovery.getDealsByStatus('new');
    let imported = 0;
    
    newDeals.forEach(deal => {
      const flight = {
        id: nextId.toString(),
        timestamp: new Date().toISOString(),
        origin: deal.origin,
        destination: deal.destination,
        price: deal.price,
        passengers: deal.passengers,
        departureDate: deal.departureDate,
        returnDate: deal.returnDate,
        airline: deal.airline,
        source: 'Auto Discovery',
        notes: `Auto-discovered deal from ${deal.destination}. Score: ${deal.dealScore}/10, Savings: £${deal.savings}`
      };
      
      flights.push(flight);
      nextId++;
      imported++;
      
      // Mark deal as saved
      autoDiscovery.updateDealStatus(deal.id, 'saved');
    });
    
    // Save the updated flights database
    saveData();
    
    console.log(`✅ Imported ${imported} deals to main dashboard`);
    res.json({ 
      success: true, 
      imported,
      message: `Successfully imported ${imported} deals to your dashboard`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🛫 Flight Price Tracker running at http://localhost:${PORT}`);
  console.log(`📊 Database: ${flights.length} flights loaded`);
  console.log(`🎯 Auto-Discovery: http://localhost:${PORT}/deals.html`);
  console.log(`🌐 Open your browser and start tracking prices!`);
});