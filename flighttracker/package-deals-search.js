const MultiTripTracker = require('./src/multiTripTracker');

const tracker = new MultiTripTracker();

console.log('🏨 Searching for PACKAGE DEALS under £2000 TOTAL for family of 4...\n');

// Test different destinations and date combinations
const destinations = [
  // European destinations (typically cheapest packages)
  { id: 'spain-madrid', origin: 'LHR', dest: 'MAD', country: 'spain' },
  { id: 'spain-barcelona', origin: 'LHR', dest: 'BCN', country: 'spain' },
  { id: 'france-paris', origin: 'LHR', dest: 'CDG', country: 'france' },
  { id: 'italy-rome', origin: 'LHR', dest: 'FCO', country: 'italy' },
  
  // Try different UK airports for better deals
  { id: 'spain-gatwick', origin: 'LGW', dest: 'MAD', country: 'spain' },
  { id: 'spain-stansted', origin: 'STN', dest: 'MAD', country: 'spain' },
  
  // Exotic but potentially affordable
  { id: 'turkey-istanbul', origin: 'LHR', dest: 'IST', country: 'turkey' },
];

// Test different trip configurations
const tripConfigs = [
  // Weekend breaks
  { days: 2, dates: [
    { start: '2025-08-05', name: 'early-aug-tue' },
    { start: '2025-08-12', name: 'mid-aug-tue' },
    { start: '2025-08-26', name: 'late-aug-tue' }
  ]},
  
  // Short breaks  
  { days: 3, dates: [
    { start: '2025-08-05', name: 'early-aug-3day' },
    { start: '2025-08-19', name: 'late-aug-3day' },
    { start: '2025-08-26', name: 'end-aug-3day' }
  ]},
  
  // 4-day trips
  { days: 4, dates: [
    { start: '2025-08-12', name: 'mid-aug-4day' },
    { start: '2025-08-26', name: 'late-aug-4day' }
  ]}
];

async function testPackageDeal(destination, startDate, endDate, configName) {
  const tripId = `pkg-${destination.id}-${configName}`;
  
  try {
    // Test with full family, focus on packages
    tracker.addTrip(tripId, {
      origin: destination.origin,
      destination: destination.dest,
      departureDate: startDate,
      returnDate: endDate,
      adults: 2,
      children: 2,
      cabinClass: 'economy',
      includePackages: true, // Enable packages!
      hotelRating: 3, // Start with budget 3-star
      hotelRatings: [3], 
      rooms: 2, // Family needs 2 rooms
      enabled: true
    });

    console.log(`  📦 Testing ${destination.id}: ${startDate} → ${endDate}`);
    await tracker.checkTrip(tripId);
    
    // Also test 4-star options
    const tripId4Star = `pkg4-${destination.id}-${configName}`;
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

    console.log(`  ⭐ Testing 4-star: ${destination.id}: ${startDate} → ${endDate}`);
    await tracker.checkTrip(tripId4Star);
    
    // Clean up
    tracker.removeTrip(tripId);
    tracker.removeTrip(tripId4Star);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error(`Error testing ${tripId}:`, error.message);
  }
}

async function findPackageDeals() {
  console.log('🎯 Target: Under £2000 TOTAL for family of 4 (flight + hotel package)\n');
  console.log('💰 Budget breakdown for £2000:');
  console.log('   • Adults: £250 each (£500 total)');
  console.log('   • Children: £187.50 each (£375 total)'); 
  console.log('   • Target package price: £875 combined\n');
  
  const affordableDeals = [];
  
  for (const destination of destinations) {
    console.log(`✈️ Testing ${destination.id.toUpperCase()} packages...`);
    
    for (const config of tripConfigs) {
      console.log(`  📅 Testing ${config.days}-day trips:`);
      
      for (const dateConfig of config.dates) {
        const start = new Date(dateConfig.start);
        const end = new Date(start);
        end.setDate(start.getDate() + config.days);
        
        // Make sure we stay in August/early September
        if (end.getMonth() <= 8) {
          const endDate = end.toISOString().split('T')[0];
          await testPackageDeal(destination, dateConfig.start, endDate, `${config.days}d-${dateConfig.name}`);
        }
      }
    }
    
    console.log(`✅ Completed ${destination.id}\n`);
  }
  
  console.log('🎯 Package deal search complete!\n');
  console.log('💡 Money-saving package tips:');
  console.log('   • Book flight+hotel together for automatic discounts');
  console.log('   • 3-star hotels often offer 90% of 4-star quality at 60% of price');
  console.log('   • Tuesday-Thursday departures = cheaper package rates');
  console.log('   • All-inclusive can be better value than room-only + meals');
  console.log('   • Last-minute package deals (1-2 weeks before) often 30-50% off');
  console.log('   • Consider apartment rentals vs hotels for families');
  console.log('\n🏨 Alternative booking strategies:');
  console.log('   • TUI, Jet2Holidays, British Airways Holidays');
  console.log('   • Booking.com Packages, Expedia, Lastminute.com');
  console.log('   • Travel agent deals (sometimes beat online prices)');
}

findPackageDeals().catch(console.error);