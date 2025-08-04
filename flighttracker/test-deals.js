const AutoFlightDiscovery = require('./auto-discovery');

console.log('🧪 Testing deal creation manually...');

const discovery = new AutoFlightDiscovery();

// Create a few test deals manually to verify the system works
const testDeal = {
    id: `deal-${Date.now()}-test`,
    timestamp: new Date().toISOString(),
    destination: 'Cyprus',
    origin: 'LHR',
    destinationCode: 'LCA',
    price: 1706,
    airline: 'Virgin Atlantic',
    departureDate: '2025-08-19',
    returnDate: '2025-08-24',
    duration: '5 days',
    budget: 1800,
    savings: 1800 - 1706,
    passengers: '2 adults + 2 children',
    flightDetails: {
        departureTime: '2025-07-29T09:50:16.000Z',
        arrivalTime: '2025-07-29T19:36:16.000Z',
        duration: 586,
        stops: 0,
        deepLink: 'https://example.com/book-flight-4'
    },
    status: 'new',
    isGoodDeal: true,
    dealScore: 8
};

// Add the deal directly to the discovered deals
discovery.discoveredDeals.push(testDeal);
discovery.saveDiscoveredDeals();

console.log('✅ Test deal created!');
console.log('📊 Deal details:', testDeal);

const stats = discovery.getStats();
console.log('📈 Stats:', stats);