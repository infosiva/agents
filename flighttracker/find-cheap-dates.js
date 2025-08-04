const MultiTripTracker = require('./src/multiTripTracker');

// Create multi-trip tracker
const tracker = new MultiTripTracker();

console.log('🔍 Searching for August dates under £1000 per person...\n');

// Generate date combinations across August 2025
const augustDates = [];
for (let day = 1; day <= 31; day++) {
  const date = `2025-08-${day.toString().padStart(2, '0')}`;
  augustDates.push(date);
}

// Test different trip lengths and date combinations
const testConfigs = [
  // Weekend trips (2-3 days)
  { days: 2, name: 'weekend' },
  { days: 3, name: 'long-weekend' },
  
  // Short breaks (4-5 days)  
  { days: 4, name: 'short-break' },
  { days: 5, name: 'work-week' },
  
  // Week-long trips
  { days: 7, name: 'weekly' },
];

const destinations = [
  { id: 'mauritius', origin: 'LHR', dest: 'MRU', country: 'mauritius' },
  { id: 'maldives', origin: 'LHR', dest: 'MLE', country: 'maldives' },
  { id: 'spain', origin: 'LHR', dest: 'MAD', country: 'spain' },
];

async function testDateRange(destination, startDate, endDate, configName) {
  const tripId = `${destination.id}-${configName}-${startDate}`;
  
  try {
    // Add trip with reduced passenger count to get base pricing
    tracker.addTrip(tripId, {
      origin: destination.origin,
      destination: destination.dest,
      departureDate: startDate,
      returnDate: endDate,
      adults: 1, // Single person pricing to compare against £1000
      children: 0,
      cabinClass: 'economy',
      hotelRating: 3,
      hotelRatings: [3],
      rooms: 1,
      includePackages: false // Just flights to find cheapest base price
    });

    // Check this trip once
    await tracker.checkTrip(tripId);
    
    // Remove trip to avoid clutter
    tracker.removeTrip(tripId);
    
  } catch (error) {
    console.error(`Error testing ${tripId}:`, error.message);
  }
}

async function findCheapDates() {
  const results = [];
  
  console.log('Testing different date combinations...\n');
  
  for (const destination of destinations) {
    console.log(`🏝️ Testing ${destination.id.toUpperCase()} dates...`);
    
    for (const config of testConfigs) {
      // Test different start dates in August
      const testDates = [
        '2025-08-05', // Early August
        '2025-08-12', // Mid August  
        '2025-08-19', // Late August
        '2025-08-26'  // End of August
      ];
      
      for (const startDate of testDates) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + config.days);
        
        // Make sure we stay within August or early September
        if (end.getMonth() <= 8) { // August = 7, September = 8
          const endDate = end.toISOString().split('T')[0];
          
          console.log(`  Testing ${startDate} → ${endDate} (${config.days} days)`);
          await testDateRange(destination, startDate, endDate, config.name);
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`✅ Completed testing ${destination.id}\n`);
  }
  
  console.log('🎯 Search complete! Check the results above for prices under £1000');
  console.log('\n💡 Tips for cheaper flights:');
  console.log('   • Tuesday/Wednesday departures are usually cheaper');
  console.log('   • Avoid bank holiday weekends (August 25 in UK)');
  console.log('   • Consider flying late August (after school holidays)');
  console.log('   • Book connecting flights vs direct flights');
  console.log('   • Consider nearby airports (LGW, STN, LTN vs LHR)');
}

// Start the search
findCheapDates().catch(console.error);