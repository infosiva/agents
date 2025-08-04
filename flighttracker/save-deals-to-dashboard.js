const AutoFlightDiscovery = require('./auto-discovery');
const fs = require('fs');

console.log('💾 Importing discovered deals to main dashboard...');

const discovery = new AutoFlightDiscovery();

// Load current saved flights
const dataFile = './data/simple-flights.json';
let flightsData = { flights: [], nextId: 1 };

try {
    if (fs.existsSync(dataFile)) {
        flightsData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
} catch (error) {
    console.log('Starting with empty flights database');
}

// Get all new deals
const newDeals = discovery.getDealsByStatus('new');
console.log(`Found ${newDeals.length} new deals to import`);

// Convert deals to flight format and add to main database
newDeals.forEach((deal, index) => {
    const flight = {
        id: flightsData.nextId.toString(),
        timestamp: new Date().toISOString(),
        origin: deal.origin,
        destination: deal.destination,
        price: deal.price,
        passengers: deal.passengers,
        departureDate: deal.departureDate,
        returnDate: deal.returnDate,
        airline: deal.airline,
        source: 'Auto Discovery',
        notes: `Auto-discovered deal from ${deal.destination}. Original price: £${deal.price}, Budget: £${deal.budget}, Savings: £${deal.savings}. Score: ${deal.dealScore}/10`
    };
    
    flightsData.flights.push(flight);
    flightsData.nextId++;
    
    console.log(`✅ Added: ${flight.origin} → ${flight.destination} - £${flight.price} (${flight.airline})`);
});

// Save the updated flights database
flightsData.lastUpdated = new Date().toISOString();
fs.writeFileSync(dataFile, JSON.stringify(flightsData, null, 2));

// Mark the deals as saved in the discovery system
newDeals.forEach(deal => {
    discovery.updateDealStatus(deal.id, 'saved');
});

console.log(`\n🎉 Successfully imported ${newDeals.length} deals to the main dashboard!`);
console.log('📊 These deals are now available in:');
console.log('   • Main dashboard Best Deals tab');
console.log('   • Destinations view');
console.log('   • Search functionality');
console.log('\n🌐 Visit http://localhost:3000 to see them!');