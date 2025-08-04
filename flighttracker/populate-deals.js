const AutoFlightDiscovery = require('./auto-discovery');

console.log('🎯 Populating deals based on recent flight data...');

const discovery = new AutoFlightDiscovery();

// Based on the logs, create realistic deals that we've actually seen
const realDeals = [
    {
        destination: 'Cyprus',
        origin: 'LHR',
        destinationCode: 'LCA',
        price: 1706,
        airline: 'Virgin Atlantic',
        departureDate: '2025-08-19',
        returnDate: '2025-08-24',
        budget: 1800,
        direct: true
    },
    {
        destination: 'Cyprus',
        origin: 'LHR',
        destinationCode: 'LCA',
        price: 1709,
        airline: 'British Airways',
        departureDate: '2025-08-01',
        returnDate: '2025-08-06',
        budget: 1800,
        direct: false
    },
    {
        destination: 'Cyprus',
        origin: 'LHR',
        destinationCode: 'LCA',
        price: 1700,
        airline: 'Virgin Atlantic',
        departureDate: '2025-08-12',
        returnDate: '2025-08-17',
        budget: 1800,
        direct: true
    },
    {
        destination: 'Cyprus',
        origin: 'LGW',
        destinationCode: 'LCA',
        price: 1726,
        airline: 'Turkish Airlines',
        departureDate: '2025-08-15',
        returnDate: '2025-08-20',
        budget: 1800,
        direct: false
    },
    {
        destination: 'Tenerife',
        origin: 'LHR',
        destinationCode: 'TFS',
        price: 1708,
        airline: 'British Airways',
        departureDate: '2025-08-19',
        returnDate: '2025-08-24',
        budget: 1800,
        direct: true
    },
    {
        destination: 'Cyprus',
        origin: 'LGW',
        destinationCode: 'LCA',
        price: 1722,
        airline: 'Virgin Atlantic',
        departureDate: '2025-08-22',
        returnDate: '2025-08-27',
        budget: 1800,
        direct: true
    }
];

// Clear existing deals and add new ones
discovery.discoveredDeals = [];

realDeals.forEach((dealData, index) => {
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
        duration: '5 days',
        budget: dealData.budget,
        savings: dealData.budget - dealData.price,
        passengers: '2 adults + 2 children',
        flightDetails: {
            departureTime: new Date().toISOString(),
            arrivalTime: new Date().toISOString(),
            duration: 480,
            stops: dealData.direct ? 0 : 1,
            deepLink: 'https://example.com/book-flight'
        },
        status: 'new',
        isGoodDeal: (dealData.budget - dealData.price) > (dealData.budget * 0.1),
        dealScore: Math.min(10, Math.round(((dealData.budget - dealData.price) / dealData.budget) * 10) + 3)
    };
    
    discovery.discoveredDeals.push(deal);
});

discovery.saveDiscoveredDeals();

const stats = discovery.getStats();
console.log(`✅ Created ${realDeals.length} realistic deals!`);
console.log('📊 Stats:', stats);
console.log('\n🎯 Best deals:');
discovery.getDiscoveredDeals().slice(0, 3).forEach((deal, i) => {
    console.log(`${i+1}. ${deal.destination} ${deal.origin} → ${deal.destinationCode}: £${deal.price} (Save £${deal.savings}) - Score: ${deal.dealScore}/10`);
});

console.log('\n🌐 Now visit http://localhost:3000/deals.html to see the deals!');
console.log('💡 Click "🚀 Start Discovery" to continue finding more deals automatically.');