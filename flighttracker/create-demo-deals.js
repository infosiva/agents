const AutoFlightDiscovery = require('./auto-discovery');

console.log('🎯 Creating demo deals for dashboard integration...');

const discovery = new AutoFlightDiscovery();

// Clear all existing deals and create fresh ones
discovery.discoveredDeals = [];

// Create fresh deals based on realistic current pricing
const demoDeals = [
    {
        destination: 'Cyprus',
        origin: 'LHR',
        destinationCode: 'LCA',
        price: 1015,
        airline: 'Virgin Atlantic',
        departureDate: '2025-08-15',
        returnDate: '2025-08-22'
    },
    {
        destination: 'Cyprus',
        origin: 'LHR',
        destinationCode: 'LCA',
        price: 1020,
        airline: 'Qatar Airways',
        departureDate: '2025-08-22',
        returnDate: '2025-08-29'
    },
    {
        destination: 'Malta',
        origin: 'LHR',
        destinationCode: 'MLA',
        price: 1025,
        airline: 'British Airways',
        departureDate: '2025-08-28',
        returnDate: '2025-09-04'
    },
    {
        destination: 'Tenerife',
        origin: 'LHR',
        destinationCode: 'TFS',
        price: 1030,
        airline: 'Emirates',
        departureDate: '2025-09-01',
        returnDate: '2025-09-08'
    },
    {
        destination: 'Cyprus',
        origin: 'LGW',
        destinationCode: 'LCA',
        price: 1035,
        airline: 'Turkish Airlines',
        departureDate: '2025-09-05',
        returnDate: '2025-09-12'
    }
];

demoDeals.forEach((dealData, index) => {
    const deal = {
        id: `deal-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        destination: dealData.destination,
        origin: dealData.origin,
        destinationCode: dealData.destinationCode,
        price: dealData.price,
        airline: dealData.airline,
        departureDate: dealData.departureDate,
        returnDate: dealData.returnDate,
        duration: '7 days',
        budget: 1500,
        savings: 1500 - dealData.price,
        passengers: '3 adults + 1 child',
        flightDetails: {
            departureTime: new Date().toISOString(),
            arrivalTime: new Date().toISOString(),
            duration: 480,
            stops: Math.floor(Math.random() * 2),
            deepLink: 'https://example.com/book-flight'
        },
        status: 'new', // Keep as new so they can be imported
        isGoodDeal: (1500 - dealData.price) > (1500 * 0.1),
        dealScore: Math.min(10, Math.round(((1500 - dealData.price) / 1500) * 10) + 2)
    };
    
    discovery.discoveredDeals.push(deal);
});

discovery.saveDiscoveredDeals();

console.log(`✅ Created ${demoDeals.length} fresh demo deals!`);
console.log('📊 Price range: £1015-£1035 (excellent realistic prices)');
console.log('💰 Average savings: £470+ per family');
console.log('🆕 All deals marked as NEW status - ready for import!');
console.log('');
console.log('🌐 Now you can:');
console.log('   1. Visit http://localhost:3000 - go to "Auto Deals" tab');
console.log('   2. See the discovered deals with "Add to Tracker" buttons');
console.log('   3. Click "Import New Deals to Dashboard" to add them all');
console.log('   4. View them in "Best Deals" tab alongside your saved flights');