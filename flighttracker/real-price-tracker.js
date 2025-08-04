#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class RealPriceTracker {
  constructor() {
    this.dataDir = './data';
    this.realPricesFile = path.join(this.dataDir, 'real-prices.json');
    this.ensureDataDir();
    this.loadData();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.realPricesFile)) {
        const data = fs.readFileSync(this.realPricesFile, 'utf8');
        this.prices = JSON.parse(data);
      } else {
        this.prices = [];
      }
    } catch (error) {
      console.error('Error loading data:', error.message);
      this.prices = [];
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.realPricesFile, JSON.stringify(this.prices, null, 2));
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Error saving data:', error.message);
    }
  }

  addPrice(priceData) {
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...priceData
    };
    
    this.prices.push(entry);
    this.saveData();
    
    console.log(`✅ Added: ${entry.origin} → ${entry.destination} - £${entry.price} (${entry.source})`);
    return entry.id;
  }

  searchPrices(filters = {}) {
    let results = [...this.prices];

    if (filters.destination) {
      results = results.filter(p => 
        p.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.origin) {
      results = results.filter(p => 
        p.origin.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.source) {
      results = results.filter(p => 
        p.source.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    // Sort by price
    results.sort((a, b) => a.price - b.price);

    return results;
  }

  getBestDeals(limit = 10) {
    const sorted = [...this.prices].sort((a, b) => a.price - b.price);
    return sorted.slice(0, limit);
  }

  getByDestination() {
    const byDest = {};
    
    this.prices.forEach(price => {
      if (!byDest[price.destination]) {
        byDest[price.destination] = [];
      }
      byDest[price.destination].push(price);
    });

    // Sort each destination by price
    Object.keys(byDest).forEach(dest => {
      byDest[dest].sort((a, b) => a.price - b.price);
    });

    return byDest;
  }

  displayResults(results) {
    if (results.length === 0) {
      console.log('🔍 No flights found matching your criteria.');
      return;
    }

    console.log(`\n🎯 Found ${results.length} flight(s):\n`);
    
    results.forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.origin} → ${flight.destination}`);
      console.log(`   💰 £${flight.price} for ${flight.passengers || '4'} passengers`);
      console.log(`   📅 ${flight.departureDate} → ${flight.returnDate || 'One way'}`);
      console.log(`   ✈️  ${flight.airline || 'Unknown airline'}`);
      console.log(`   🌐 Found on: ${flight.source}`);
      console.log(`   📝 Notes: ${flight.notes || 'None'}`);
      console.log(`   ⏰ Added: ${new Date(flight.timestamp).toLocaleDateString()}`);
      console.log('');
    });
  }

  displayBestDeals() {
    console.log('\n🏆 TOP 10 CHEAPEST FLIGHTS:\n');
    const deals = this.getBestDeals(10);
    this.displayResults(deals);
  }

  displayByDestination() {
    const byDest = this.getByDestination();
    
    console.log('\n🌍 FLIGHTS BY DESTINATION:\n');
    
    Object.keys(byDest).sort().forEach(destination => {
      console.log(`🏝️  ${destination.toUpperCase()}:`);
      const flights = byDest[destination].slice(0, 3); // Top 3 per destination
      
      flights.forEach((flight, index) => {
        console.log(`   ${index + 1}. £${flight.price} from ${flight.origin} (${flight.source})`);
        console.log(`      📅 ${flight.departureDate} | ✈️ ${flight.airline || 'Unknown'}`);
      });
      console.log('');
    });
  }

  updatePrice(id, updates) {
    const index = this.prices.findIndex(p => p.id === id);
    if (index === -1) {
      console.log('❌ Flight not found');
      return false;
    }

    this.prices[index] = { ...this.prices[index], ...updates, updated: new Date().toISOString() };
    this.saveData();
    console.log('✅ Flight updated successfully');
    return true;
  }

  deletePrice(id) {
    const index = this.prices.findIndex(p => p.id === id);
    if (index === -1) {
      console.log('❌ Flight not found');
      return false;
    }

    const flight = this.prices[index];
    this.prices.splice(index, 1);
    this.saveData();
    console.log(`✅ Deleted: ${flight.origin} → ${flight.destination} - £${flight.price}`);
    return true;
  }
}

// CLI Interface
function showHelp() {
  console.log(`
🛫 REAL PRICE TRACKER - Track actual flight prices from booking websites

USAGE:
  node real-price-tracker.js <command> [options]

COMMANDS:
  add         Add a new flight price
  search      Search saved flights  
  best        Show top 10 cheapest flights
  destinations Show flights grouped by destination
  update      Update an existing flight
  delete      Delete a flight entry
  help        Show this help

EXAMPLES:
  # Add a new flight price
  node real-price-tracker.js add

  # Search for flights to Cyprus under £1500
  node real-price-tracker.js search --destination cyprus --max-price 1500

  # Show best deals
  node real-price-tracker.js best

  # Show flights by destination
  node real-price-tracker.js destinations
`);
}

function promptForFlightData() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    const flight = {};
    
    console.log('\n✈️  ADD NEW FLIGHT PRICE\n');
    
    rl.question('🛫 From (e.g., LHR, Heathrow, London): ', (origin) => {
      flight.origin = origin;
      
      rl.question('🛬 To (e.g., LCA, Cyprus, Tenerife): ', (destination) => {
        flight.destination = destination;
        
        rl.question('💰 Price £ (total for family): ', (price) => {
          flight.price = parseFloat(price);
          
          rl.question('👥 Passengers (e.g., 2 adults + 2 children): ', (passengers) => {
            flight.passengers = passengers;
            
            rl.question('📅 Departure date (e.g., 2025-08-01): ', (depDate) => {
              flight.departureDate = depDate;
              
              rl.question('📅 Return date (e.g., 2025-08-06, or press enter for one-way): ', (retDate) => {
                flight.returnDate = retDate || null;
                
                rl.question('✈️  Airline (e.g., British Airways, Emirates): ', (airline) => {
                  flight.airline = airline;
                  
                  rl.question('🌐 Source website (e.g., Skyscanner, Google Flights): ', (source) => {
                    flight.source = source;
                    
                    rl.question('📝 Notes (optional): ', (notes) => {
                      flight.notes = notes || null;
                      
                      rl.close();
                      resolve(flight);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

async function main() {
  const tracker = new RealPriceTracker();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'add':
      const flightData = await promptForFlightData();
      tracker.addPrice(flightData);
      break;

    case 'search':
      const filters = {};
      for (let i = 1; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        
        switch (flag) {
          case '--destination':
          case '-d':
            filters.destination = value;
            break;
          case '--origin':
          case '-o':
            filters.origin = value;
            break;
          case '--max-price':
          case '-p':
            filters.maxPrice = parseFloat(value);
            break;
          case '--source':
          case '-s':
            filters.source = value;
            break;
        }
      }
      
      const results = tracker.searchPrices(filters);
      tracker.displayResults(results);
      break;

    case 'best':
      tracker.displayBestDeals();
      break;

    case 'destinations':
      tracker.displayByDestination();
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RealPriceTracker;