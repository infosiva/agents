const MultiTripTracker = require('./src/multiTripTracker');

// Create multi-trip tracker
const tracker = new MultiTripTracker();

console.log('🔍 Searching for ULTRA-CHEAP flights under £1000 TOTAL for family of 4...\n');

// Test budget scenarios
const scenarios = [
  // Very short trips
  { days: 1, name: 'day-trip' },
  { days: 2, name: 'weekend' },
  
  // Different times of August (avoiding peak periods)
  // Early August, mid-week
  { start: '2025-08-05', name: 'early-aug-tue' },  // Tuesday
  { start: '2025-08-06', name: 'early-aug-wed' },  // Wednesday
  { start: '2025-08-07', name: 'early-aug-thu' },  // Thursday
  
  // Mid August, mid-week  
  { start: '2025-08-12', name: 'mid-aug-tue' },    // Tuesday
  { start: '2025-08-13', name: 'mid-aug-wed' },    // Wednesday
  { start: '2025-08-14', name: 'mid-aug-thu' },    // Thursday
  
  // Late August (post-holiday)
  { start: '2025-08-26', name: 'late-aug-tue' },   // Tuesday  
  { start: '2025-08-27', name: 'late-aug-wed' },   // Wednesday
  { start: '2025-08-28', name: 'late-aug-thu' },   // Thursday
];

// Focus on budget-friendly destinations
const destinations = [
  // Europe - typically cheapest
  { id: 'spain', origin: 'LHR', dest: 'MAD', country: 'spain' },
  { id: 'spain-bcn', origin: 'LHR', dest: 'BCN', country: 'spain' }, // Barcelona
  
  // Try different UK airports (often cheaper)
  { id: 'spain-gatwick', origin: 'LGW', dest: 'MAD', country: 'spain' },
  { id: 'spain-stansted', origin: 'STN', dest: 'MAD', country: 'spain' },
  
  // Other affordable European options  
  { id: 'france', origin: 'LHR', dest: 'CDG', country: 'france' },
  { id: 'italy', origin: 'LHR', dest: 'FCO', country: 'italy' },
];

async function testUltraBudget(destination, startDate, endDate, configName) {
  const tripId = `ultra-${destination.id}-${configName}`;
  
  try {
    // Test with full family configuration
    tracker.addTrip(tripId, {
      origin: destination.origin,
      destination: destination.dest,
      departureDate: startDate,
      returnDate: endDate,
      adults: 2,
      children: 2,
      cabinClass: 'economy',
      includePackages: false, // Flights only for cheapest price
      enabled: true
    });

    // Check this trip once
    await tracker.checkTrip(tripId);
    
    // Remove trip to avoid clutter
    tracker.removeTrip(tripId);
    
  } catch (error) {
    console.error(`Error testing ${tripId}:`, error.message);
  }
}

async function findUltraCheapDeals() {
  const budgetFinds = [];
  
  console.log('🎯 Target: Under £1000 for family of 4 (2 adults + 2 children)\n');
  console.log('Testing ultra-budget scenarios...\n');
  
  for (const destination of destinations) {
    console.log(`✈️ Testing ${destination.id.toUpperCase()} from ${destination.origin}...`);
    
    // Test 1-2 day trips on different weekdays
    for (const scenario of scenarios) {
      if (scenario.start) {
        // Test 1-day and 2-day trips from specific dates
        const start = new Date(scenario.start);
        
        // 1-day trip  
        const end1 = new Date(start);
        end1.setDate(start.getDate() + 1);
        const endDate1 = end1.toISOString().split('T')[0];
        
        console.log(`  📅 ${scenario.start} → ${endDate1} (1 day, ${scenario.name})`);
        await testUltraBudget(destination, scenario.start, endDate1, `1day-${scenario.name}`);
        
        // 2-day trip
        const end2 = new Date(start); 
        end2.setDate(start.getDate() + 2);
        const endDate2 = end2.toISOString().split('T')[0];
        
        console.log(`  📅 ${scenario.start} → ${endDate2} (2 days, ${scenario.name})`);
        await testUltraBudget(destination, scenario.start, endDate2, `2day-${scenario.name}`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Completed ${destination.id}\n`);
  }
  
  console.log('🎯 Search complete!\n');
  console.log('💡 Additional money-saving tips:');
  console.log('   • Book separate one-way tickets instead of return');  
  console.log('   • Consider budget airlines (Ryanair, EasyJet for Europe)');
  console.log('   • Use alternative airports: LGW, STN, LTN instead of LHR');
  console.log('   • Travel Tuesday-Thursday (avoid Mon/Fri/weekends)');
  console.log('   • Book very early morning or late evening flights');
  console.log('   • Consider train + flight combinations for some destinations');
  console.log('   • Look for error fares and flash sales');
  console.log('\n💰 Budget breakdown needed for £1000 family total:');
  console.log('   • Adults: £125 each (£250 total)');
  console.log('   • Children: £187.50 each (£375 total)');  
  console.log('   • Target: £625 combined family price');
}

// Start the ultra-budget search
findUltraCheapDeals().catch(console.error);