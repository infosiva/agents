#!/usr/bin/env node

const MultiTripTracker = require('./src/multiTripTracker');

async function searchTropicalFlightsOnly() {
  console.log('🏝️ TROPICAL FLIGHTS-ONLY SEARCH - FAMILY OF 4 (2A + 2C)');
  console.log('🎯 Target: Under £1500 total for 5-day trips in August 2025');
  console.log('✈️ FLIGHTS ONLY - No packages included\n');

  const tracker = new MultiTripTracker();

  // Tropical destinations with airport codes
  const tropicalDestinations = [
    // Canary Islands
    { name: 'Tenerife', code: 'TFS', country: 'Spain' },
    { name: 'Gran Canaria', code: 'LPA', country: 'Spain' },
    { name: 'Lanzarote', code: 'ACE', country: 'Spain' },
    
    // Turkey
    { name: 'Antalya', code: 'AYT', country: 'Turkey' },
    { name: 'Istanbul', code: 'IST', country: 'Turkey' },
    
    // Mediterranean
    { name: 'Cyprus', code: 'LCA', country: 'Cyprus' },
    { name: 'Athens', code: 'ATH', country: 'Greece' },
    { name: 'Crete', code: 'HER', country: 'Greece' },
    { name: 'Malta', code: 'MLA', country: 'Malta' },
    
    // North Africa
    { name: 'Casablanca', code: 'CMN', country: 'Morocco' },
    { name: 'Hurghada', code: 'HRG', country: 'Egypt' }
  ];

  // UK departure airports
  const ukAirports = [
    { name: 'London Heathrow', code: 'LHR' },
    { name: 'London Gatwick', code: 'LGW' },
    { name: 'London Stansted', code: 'STN' },
    { name: 'Manchester', code: 'MAN' }
  ];

  // August 2025 date ranges for 5-day trips
  const augustDateRanges = [
    { name: 'Early Aug (5d)', depart: '2025-08-05', return: '2025-08-10' },
    { name: 'Mid Aug (5d)', depart: '2025-08-12', return: '2025-08-17' },
    { name: 'Late Aug (5d)', depart: '2025-08-19', return: '2025-08-24' },
    { name: 'End Aug (5d)', depart: '2025-08-26', return: '2025-08-31' }
  ];

  console.log(`🏝️ Searching ${tropicalDestinations.length} tropical destinations from ${ukAirports.length} UK airports`);
  console.log(`📅 Testing ${augustDateRanges.length} different 5-day periods in August 2025`);
  console.log('👨‍👩‍👧‍👦 Family configuration: 2 Adults + 2 Children, Economy Class\n');

  let tripCounter = 0;
  const allResults = [];

  // Create trips for all combinations
  for (const destination of tropicalDestinations) {
    for (const ukAirport of ukAirports) {
      for (const dateRange of augustDateRanges) {
        const tripId = `tropical-flights-${destination.name.toLowerCase().replace(/\s+/g, '-')}-${ukAirport.code.toLowerCase()}-${dateRange.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        const tripConfig = {
          origin: ukAirport.code,
          destination: destination.code,
          adults: 2,
          children: 2,
          infants: 0,
          cabinClass: 'economy',
          departureDate: dateRange.depart,
          returnDate: dateRange.return,
          currency: 'GBP',
          includePackages: false, // FLIGHTS ONLY
          enabled: true
        };

        tracker.addTrip(tripId, tripConfig);
        tripCounter++;
      }
    }
  }

  console.log(`✅ Created ${tripCounter} flight-only search configurations`);
  console.log('🔍 Starting comprehensive tropical flights search...\n');

  // Execute all searches
  const promises = [];
  const tripIds = Array.from(tracker.trips.keys());

  for (const tripId of tripIds) {
    promises.push(
      tracker.checkTrip(tripId).then(() => {
        const trip = tracker.trips.get(tripId);
        const config = trip.config;
        
        // Get the latest results from the price tracker
        return trip.priceTracker.getLatestFlights().then(flights => {
          if (flights && flights.length > 0) {
            const cheapestFlight = flights[0]; // Already sorted by price
            const ukAirportName = ukAirports.find(a => a.code === config.origin)?.name || config.origin;
            const destName = tropicalDestinations.find(d => d.code === config.destination)?.name || config.destination;
            
            allResults.push({
              tripId,
              route: `${ukAirportName} → ${destName}`,
              origin: config.origin,
              destination: config.destination,
              departureDate: config.departureDate,
              returnDate: config.returnDate,
              duration: '5 days',
              passengers: `${config.adults}A + ${config.children}C`,
              price: cheapestFlight.totalPrice || cheapestFlight.price,
              airline: cheapestFlight.airline || 'Various',
              bookingUrl: cheapestFlight.deepLink || cheapestFlight.bookingUrl,
              flightDetails: cheapestFlight
            });
          }
        }).catch(() => {
          // Handle cases where price tracker doesn't have data yet
          // This might happen if the search just completed
        });
      }).catch(error => {
        console.error(`❌ Error checking ${tripId}:`, error.message);
      })
    );
  }

  // Wait for all searches to complete
  await Promise.allSettled(promises);

  // Sort results by price and filter under £1500
  const filteredResults = allResults
    .filter(result => result.price && result.price <= 1500)
    .sort((a, b) => a.price - b.price);

  console.log('\n' + '='.repeat(80));
  console.log('🏆 TROPICAL FLIGHTS-ONLY SEARCH RESULTS');
  console.log('🎯 Family of 4 (2A + 2C) - Under £1500 - 5 Days in August 2025');
  console.log('='.repeat(80));

  if (filteredResults.length === 0) {
    console.log('❌ No flights found under £1500 for family of 4');
    console.log('💡 Try increasing budget or checking different dates');
    
    // Show a few results above £1500 for reference
    const expensiveResults = allResults
      .filter(result => result.price && result.price > 1500)
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    if (expensiveResults.length > 0) {
      console.log('\n📊 Closest options (above £1500):');
      expensiveResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.route}`);
        console.log(`   💰 £${result.price} (${result.passengers}) - ${result.duration}`);
        console.log(`   📅 ${result.departureDate} → ${result.returnDate}`);
        console.log(`   ✈️  ${result.airline}`);
        console.log();
      });
    }
  } else {
    console.log(`✅ Found ${filteredResults.length} tropical flight options under £1500!\n`);

    // Group results by price ranges
    const priceRanges = {
      'Under £500': filteredResults.filter(r => r.price < 500),
      '£500-£750': filteredResults.filter(r => r.price >= 500 && r.price < 750),
      '£750-£1000': filteredResults.filter(r => r.price >= 750 && r.price < 1000),
      '£1000-£1250': filteredResults.filter(r => r.price >= 1000 && r.price < 1250),
      '£1250-£1500': filteredResults.filter(r => r.price >= 1250 && r.price <= 1500)
    };

    for (const [range, results] of Object.entries(priceRanges)) {
      if (results.length > 0) {
        console.log(`💰 ${range} (${results.length} options):`);
        results.slice(0, 5).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.route}`);
          console.log(`     💰 £${result.price} total for family of 4 (${result.passengers})`);
          console.log(`     📅 ${result.departureDate} → ${result.returnDate} (${result.duration})`);
          console.log(`     ✈️  ${result.airline}`);
          if (result.bookingUrl) {
            console.log(`     🔗 Book: ${result.bookingUrl}`);
          }
          console.log();
        });
        if (results.length > 5) {
          console.log(`     ... and ${results.length - 5} more options\n`);
        }
      }
    }

    // Show top 10 best deals
    console.log('\n🏆 TOP 10 BEST TROPICAL FLIGHT DEALS (Under £1500):');
    console.log('-'.repeat(60));
    filteredResults.slice(0, 10).forEach((result, index) => {
      const rank = index + 1;
      console.log(`${rank.toString().padStart(2)}. ${result.route}`);
      console.log(`    💰 £${result.price} total for family (${result.passengers})`);
      console.log(`    📅 ${result.departureDate} → ${result.returnDate}`);
      console.log(`    ✈️  ${result.airline}`);
      console.log(`    🎯 Savings potential: £${(1500 - result.price).toFixed(0)} under budget`);
      if (result.bookingUrl) {
        console.log(`    🔗 ${result.bookingUrl}`);
      }
      console.log();
    });

    // Destination analysis
    const destinationStats = {};
    filteredResults.forEach(result => {
      const dest = result.destination;
      if (!destinationStats[dest]) {
        destinationStats[dest] = { count: 0, minPrice: Infinity, routes: [] };
      }
      destinationStats[dest].count++;
      destinationStats[dest].minPrice = Math.min(destinationStats[dest].minPrice, result.price);
      destinationStats[dest].routes.push(result);
    });

    console.log('\n📊 DESTINATION ANALYSIS (Under £1500):');
    console.log('-'.repeat(50));
    Object.entries(destinationStats)
      .sort(([,a], [,b]) => a.minPrice - b.minPrice)
      .forEach(([dest, stats]) => {
        const destName = tropicalDestinations.find(d => d.code === dest)?.name || dest;
        console.log(`${destName} (${dest}): ${stats.count} options from £${stats.minPrice}`);
      });

    // UK airport analysis
    const airportStats = {};
    filteredResults.forEach(result => {
      const origin = result.origin;
      if (!airportStats[origin]) {
        airportStats[origin] = { count: 0, minPrice: Infinity };
      }
      airportStats[origin].count++;
      airportStats[origin].minPrice = Math.min(airportStats[origin].minPrice, result.price);
    });

    console.log('\n🛫 UK AIRPORT ANALYSIS (Under £1500):');
    console.log('-'.repeat(50));
    Object.entries(airportStats)
      .sort(([,a], [,b]) => a.minPrice - b.minPrice)
      .forEach(([origin, stats]) => {
        const airportName = ukAirports.find(a => a.code === origin)?.name || origin;
        console.log(`${airportName} (${origin}): ${stats.count} options from £${stats.minPrice}`);
      });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Tropical flights-only search complete!');
  console.log(`📊 Searched ${tripCounter} flight combinations`);
  console.log(`🎯 Found ${filteredResults.length} options under £1500`);
  console.log(`💰 Budget target: £1500 for family of 4 (2A + 2C)`);
  console.log('🏝️ Focus: 5-day tropical trips in August 2025');
  console.log('✈️ FLIGHTS ONLY - No accommodation included');
  console.log('='.repeat(80));

  // Clean up trips
  for (const tripId of tripIds) {
    tracker.removeTrip(tripId);
  }

  return filteredResults;
}

// Run the search
if (require.main === module) {
  searchTropicalFlightsOnly().catch(error => {
    console.error('❌ Search failed:', error.message);
    process.exit(1);
  });
}

module.exports = searchTropicalFlightsOnly;