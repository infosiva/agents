const AutoFlightDiscovery = require('./auto-discovery');

console.log('🔍 Debugging deal processing...');

const discovery = new AutoFlightDiscovery();

// Simulate what happens when a trip result is processed
const mockConfig = {
    destinationName: 'Cyprus',
    origin: 'LHR',
    destination: 'LCA',
    departureDate: '2025-08-19',
    returnDate: '2025-08-24',
    adults: 2,
    children: 2,
    budget: 1800
};

const mockResult = {
    flights: [
        {
            price: 1726,
            airline: 'Turkish Airlines',
            departureTime: '2025-07-27T09:51:38.000Z',
            arrivalTime: '2025-07-27T18:50:38.000Z',
            duration: 539,
            stops: 2,
            deepLink: 'https://example.com/book-flight-2'
        }
    ]
};

console.log('📊 Mock config:', mockConfig);
console.log('📊 Mock result:', mockResult);

// Manually call processTripResult to see what happens
discovery.processTripResult(mockConfig, mockResult).then(() => {
    const stats = discovery.getStats();
    console.log('📈 Stats after processing:', stats);
    
    const deals = discovery.getDiscoveredDeals();
    console.log('🎯 Deals found:', deals.length);
    if (deals.length > 0) {
        console.log('🎉 First deal:', deals[0]);
    }
}).catch(error => {
    console.error('❌ Error processing:', error);
});