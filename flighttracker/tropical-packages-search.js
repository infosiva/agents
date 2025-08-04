const MultiTripTracker = require('./src/multiTripTracker');

const tracker = new MultiTripTracker();

console.log('🏝️ Searching for TROPICAL PACKAGE DEALS under £2000 for family of 4...\n');
console.log('🌴 Destinations: Canary Islands, Maldives, Mauritius\n');

// Tropical destinations with airport codes
const destinations = [
  // Canary Islands (Spain territory - often cheaper packages)
  { id: 'tenerife', origin: 'LHR', dest: 'TFS', country: 'spain', name: 'Tenerife (Canary Islands)' },
  { id: 'gran-canaria', origin: 'LHR', dest: 'LPA', country: 'spain', name: 'Gran Canaria (Canary Islands)' },
  { id: 'lanzarote', origin: 'LHR', dest: 'ACE', country: 'spain', name: 'Lanzarote (Canary Islands)' },
  
  // Try different UK airports for Canaries (often much cheaper)
  { id: 'tenerife-gatwick', origin: 'LGW', dest: 'TFS', country: 'spain', name: 'Tenerife from Gatwick' },
  { id: 'tenerife-manchester', origin: 'MAN', dest: 'TFS', country: 'spain', name: 'Tenerife from Manchester' },
  
  // Maldives - Premium destination
  { id: 'maldives', origin: 'LHR', dest: 'MLE', country: 'maldives', name: 'Maldives' },
  { id: 'maldives-gatwick', origin: 'LGW', dest: 'MLE', country: 'maldives', name: 'Maldives from Gatwick' },
  
  // Mauritius - Indian Ocean paradise  
  { id: 'mauritius', origin: 'LHR', dest: 'MRU', country: 'mauritius', name: 'Mauritius' },
  { id: 'mauritius-gatwick', origin: 'LGW', dest: 'MRU', country: 'mauritius', name: 'Mauritius from Gatwick' },
];

// Test different trip lengths for tropical destinations
const tripConfigs = [
  // Short tropical breaks
  { days: 4, dates: [
    { start: '2025-08-05', name: 'early-aug' },
    { start: '2025-08-19', name: 'late-aug' },
    { start: '2025-08-26', name: 'end-aug' }
  ]},
  
  // Standard tropical holidays
  { days: 7, dates: [
    { start: '2025-08-05', name: 'early-aug-week' },
    { start: '2025-08-12', name: 'mid-aug-week' },
    { start: '2025-08-19', name: 'late-aug-week' }
  ]},
  
  // Extended tropical trips
  { days: 10, dates: [
    { start: '2025-08-05', name: 'early-aug-extended' },
    { start: '2025-08-15', name: 'mid-aug-extended' }
  ]}
];

async function testTropicalPackage(destination, startDate, endDate, configName) {
  const tripId = `tropical-${destination.id}-${configName}`;
  
  try {
    // Test with full family - 3-star first
    tracker.addTrip(tripId, {
      origin: destination.origin,
      destination: destination.dest,
      departureDate: startDate,
      returnDate: endDate,
      adults: 2,
      children: 2,
      cabinClass: 'economy',
      includePackages: true,
      hotelRating: 3,
      hotelRatings: [3],
      rooms: 2,
      enabled: true
    });

    console.log(`  🏖️ ${destination.name}: ${startDate} → ${endDate} (3⭐)`);
    await tracker.checkTrip(tripId);
    
    // Test 4-star for comparison
    const tripId4Star = `tropical4-${destination.id}-${configName}`;
    tracker.addTrip(tripId4Star, {
      origin: destination.origin,
      destination: destination.dest,
      departureDate: startDate,
      returnDate: endDate,
      adults: 2,
      children: 2,
      cabinClass: 'economy',
      includePackages: true,
      hotelRating: 4,
      hotelRatings: [4],
      rooms: 2,
      enabled: true
    });

    console.log(`  ⭐ ${destination.name}: ${startDate} → ${endDate} (4⭐)`);
    await tracker.checkTrip(tripId4Star);
    
    // Test 5-star for Maldives/Mauritius (luxury destinations)
    if (destination.country === 'maldives' || destination.country === 'mauritius') {
      const tripId5Star = `tropical5-${destination.id}-${configName}`;
      tracker.addTrip(tripId5Star, {
        origin: destination.origin,
        destination: destination.dest,
        departureDate: startDate,
        returnDate: endDate,
        adults: 2,
        children: 2,
        cabinClass: 'economy',
        includePackages: true,
        hotelRating: 5,
        hotelRatings: [5],
        rooms: 2,
        enabled: true
      });

      console.log(`  💎 ${destination.name}: ${startDate} → ${endDate} (5⭐ luxury)`);
      await tracker.checkTrip(tripId5Star);
      tracker.removeTrip(tripId5Star);
    }
    
    // Clean up
    tracker.removeTrip(tripId);
    tracker.removeTrip(tripId4Star);
    
    // Delay between searches
    await new Promise(resolve => setTimeout(resolve, 800));
    
  } catch (error) {
    console.error(`Error testing ${tripId}:`, error.message);
  }
}

async function findTropicalPackages() {
  console.log('🎯 Target: Under £2000 TOTAL for family of 4 (tropical package deals)\n');
  
  const affordableDeals = [];
  
  for (const destination of destinations) {
    console.log(`🌴 Testing ${destination.name.toUpperCase()} packages...`);
    
    for (const config of tripConfigs) {
      console.log(`  📅 Testing ${config.days}-day trips:`);
      
      for (const dateConfig of config.dates) {
        const start = new Date(dateConfig.start);
        const end = new Date(start);
        end.setDate(start.getDate() + config.days);
        
        const endDate = end.toISOString().split('T')[0];
        await testTropicalPackage(destination, dateConfig.start, endDate, `${config.days}d-${dateConfig.name}`);
      }
    }
    
    console.log(`✅ Completed ${destination.name}\n`);
  }
  
  console.log('🏝️ Tropical package search complete!\n');
  console.log('🌟 Destination Comparison:');
  console.log('🇮🇨 CANARY ISLANDS:');
  console.log('   • Year-round warm weather (20-28°C)');
  console.log('   • No time difference from UK');  
  console.log('   • Short 4-hour flights');
  console.log('   • Great value packages (Spanish territory)');
  console.log('   • Family-friendly beaches & activities');
  console.log('');
  console.log('🇲🇻 MALDIVES:');
  console.log('   • Luxury tropical paradise');
  console.log('   • Crystal clear waters & coral reefs');
  console.log('   • Premium resort experiences');
  console.log('   • 10+ hour flights (worth it for longer stays)');
  console.log('   • Best for romantic/luxury family trips');
  console.log('');
  console.log('🇲🇺 MAURITIUS:');  
  console.log('   • Diverse activities (beaches, mountains, culture)');
  console.log('   • Great family resorts with kids clubs');
  console.log('   • Direct flights available');
  console.log('   • Good value luxury destination');
  console.log('   • Mix of relaxation and adventure');
  console.log('\n💡 Money-saving tips:');
  console.log('   • Canary Islands = best value for tropical weather');
  console.log('   • Gatwick/Manchester often cheaper than Heathrow');
  console.log('   • 7-day packages usually best value per night');
  console.log('   • All-inclusive can be great value for families');
  console.log('   • Book 6-8 weeks ahead for best package prices');
}

findTropicalPackages().catch(console.error);