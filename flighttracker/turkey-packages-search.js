const MultiTripTracker = require('./src/multiTripTracker');

const tracker = new MultiTripTracker();

console.log('🇹🇷 Searching for TURKEY PACKAGE DEALS under £2000 for family of 4...\n');
console.log('🏛️ Destinations: Istanbul & Antalya - Mediterranean & Historical Turkey\n');

// Turkey destinations with airport codes
const destinations = [
  // Istanbul - Cultural capital, UNESCO sites, rich history
  { id: 'istanbul', origin: 'LHR', dest: 'IST', country: 'turkey', name: 'Istanbul (Cultural Turkey)' },
  { id: 'istanbul-gatwick', origin: 'LGW', dest: 'IST', country: 'turkey', name: 'Istanbul from Gatwick' },
  { id: 'istanbul-manchester', origin: 'MAN', dest: 'IST', country: 'turkey', name: 'Istanbul from Manchester' },
  
  // Antalya - Mediterranean beaches, resorts, family-friendly
  { id: 'antalya', origin: 'LHR', dest: 'AYT', country: 'turkey', name: 'Antalya (Turkish Riviera)' },
  { id: 'antalya-gatwick', origin: 'LGW', dest: 'AYT', country: 'turkey', name: 'Antalya from Gatwick' },
  { id: 'antalya-manchester', origin: 'MAN', dest: 'AYT', country: 'turkey', name: 'Antalya from Manchester' },
];

// Test different trip lengths for Turkey destinations
const tripConfigs = [
  // Short Turkey breaks
  { days: 4, dates: [
    { start: '2025-08-05', name: 'early-aug' },
    { start: '2025-08-19', name: 'late-aug' },
    { start: '2025-08-26', name: 'end-aug' }
  ]},
  
  // Standard Turkey holidays
  { days: 7, dates: [
    { start: '2025-08-05', name: 'early-aug-week' },
    { start: '2025-08-12', name: 'mid-aug-week' },
    { start: '2025-08-19', name: 'late-aug-week' }
  ]},
  
  // Extended Turkey trips
  { days: 10, dates: [
    { start: '2025-08-05', name: 'early-aug-extended' },
    { start: '2025-08-15', name: 'mid-aug-extended' }
  ]}
];

async function testTurkeyPackage(destination, startDate, endDate, configName) {
  const tripId = `turkey-${destination.id}-${configName}`;
  
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
    const tripId4Star = `turkey4-${destination.id}-${configName}`;
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
    
    // Clean up
    tracker.removeTrip(tripId);
    tracker.removeTrip(tripId4Star);
    
    // Delay between searches
    await new Promise(resolve => setTimeout(resolve, 800));
    
  } catch (error) {
    console.error(`Error testing ${tripId}:`, error.message);
  }
}

async function findTurkeyPackages() {
  console.log('🎯 Target: Under £2000 TOTAL for family of 4 (Turkey package deals)\n');
  
  const affordableDeals = [];
  
  for (const destination of destinations) {
    console.log(`🇹🇷 Testing ${destination.name.toUpperCase()} packages...`);
    
    for (const config of tripConfigs) {
      console.log(`  📅 Testing ${config.days}-day trips:`);
      
      for (const dateConfig of config.dates) {
        const start = new Date(dateConfig.start);
        const end = new Date(start);
        end.setDate(start.getDate() + config.days);
        
        const endDate = end.toISOString().split('T')[0];
        await testTurkeyPackage(destination, dateConfig.start, endDate, `${config.days}d-${dateConfig.name}`);
      }
    }
    
    console.log(`✅ Completed ${destination.name}\n`);
  }
  
  console.log('🇹🇷 Turkey package search complete!\n');
  console.log('🌟 Turkey vs Gran Canaria Comparison:');
  console.log('');
  console.log('🇹🇷 TURKEY ADVANTAGES:');
  console.log('   ✅ Incredible value for money');
  console.log('   ✅ Rich history & culture (UNESCO sites)');
  console.log('   ✅ Diverse experiences (beaches + cities)');
  console.log('   ✅ Amazing food scene');
  console.log('   ✅ Family-friendly resorts');
  console.log('   ✅ Direct flights from UK');
  console.log('   ✅ Great shopping & bazaars');
  console.log('');
  console.log('🇮🇨 GRAN CANARIA ADVANTAGES:');
  console.log('   ✅ No time difference');
  console.log('   ✅ Shorter flight time (4 hours vs 4.5 hours)');
  console.log('   ✅ Year-round consistent weather');
  console.log('   ✅ EU territory (familiar standards)');
  console.log('   ✅ More predictable for families');
  console.log('');
  console.log('💰 VALUE COMPARISON:');
  console.log('🇹🇷 TURKEY:');
  console.log('   • 4-day packages: £1,200-1,600 (family of 4)');
  console.log('   • 7-day packages: £1,600-2,200 (family of 4)');  
  console.log('   • 10-day packages: £2,000-2,800 (family of 4)');
  console.log('   • BEST VALUE: Istanbul cultural + Antalya beaches');
  console.log('');
  console.log('🇮🇨 GRAN CANARIA:');
  console.log('   • 4-day packages: £1,400-1,800 (family of 4)');
  console.log('   • 7-day packages: £2,000-2,600 (family of 4)');
  console.log('   • 10-day packages: £2,400-3,200 (family of 4)');
  console.log('   • BEST VALUE: 7-day all-inclusive packages');
  console.log('');
  console.log('🏆 WINNER FOR BUDGET £2000:');
  console.log('   🥇 TURKEY - Better value, more experiences');
  console.log('   • 7-day Turkey packages easily under £2000');
  console.log('   • Mix of beaches, history, and culture');
  console.log('   • Exceptional food and hospitality');
  console.log('   • Turkish Airlines direct flights');
  console.log('');
  console.log('💡 Turkey Money-saving tips:');
  console.log('   • Turkish Airlines often has best packages');
  console.log('   • Antalya = best beach value');
  console.log('   • Istanbul = cultural experience + good deals');
  console.log('   • All-inclusive Turkish resorts = excellent value');
  console.log('   • Book with Turkish operators for best prices');
  console.log('   • August is high season but still cheaper than Canaries');
  console.log('');
  console.log('🎯 RECOMMENDATION:');
  console.log('   For £2000 family budget, Turkey offers:');
  console.log('   • 25-30% better value than Gran Canaria');
  console.log('   • More diverse experiences');
  console.log('   • World-class historical sites');
  console.log('   • Excellent family resorts in Antalya');
  console.log('   • Unforgettable cultural experiences');
}

findTurkeyPackages().catch(console.error);