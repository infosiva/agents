#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function analyzeTropicalFlights() {
  console.log('📊 ANALYZING TROPICAL FLIGHTS-ONLY RESULTS');
  console.log('🎯 Target: Family of 4 (2A + 2C) - Under £1500 - 5 Days August 2025');
  console.log('✈️ FLIGHTS ONLY - No packages\n');

  // Get all tropical flights result files
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir).filter(file => 
    file.startsWith('flight-history-tropical-flights-') && file.endsWith('.json')
  );

  console.log(`📁 Found ${files.length} flight search result files`);

  const allResults = [];
  const destinationStats = {};
  const airportStats = {};

  // Tropical destinations mapping
  const tropicalDestinations = {
    'TFS': { name: 'Tenerife', country: 'Spain' },
    'LPA': { name: 'Gran Canaria', country: 'Spain' },
    'ACE': { name: 'Lanzarote', country: 'Spain' },
    'AYT': { name: 'Antalya', country: 'Turkey' },
    'IST': { name: 'Istanbul', country: 'Turkey' },
    'LCA': { name: 'Cyprus', country: 'Cyprus' },
    'ATH': { name: 'Athens', country: 'Greece' },
    'HER': { name: 'Crete', country: 'Greece' },
    'MLA': { name: 'Malta', country: 'Malta' },
    'CMN': { name: 'Casablanca', country: 'Morocco' },
    'HRG': { name: 'Hurghada', country: 'Egypt' }
  };

  const ukAirports = {
    'LHR': 'London Heathrow',
    'LGW': 'London Gatwick', 
    'STN': 'London Stansted',
    'MAN': 'Manchester'
  };

  // Process each file
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.bestPrice && data.bestPrice.result) {
        const result = data.bestPrice.result;
        
        // Extract route info from filename
        const filenameParts = file.replace('flight-history-tropical-flights-', '').replace('.json', '').split('-');
        let destination = 'unknown';
        let origin = 'unknown';
        let dates = 'unknown';
        
        // Parse filename to extract destination and origin
        if (filenameParts.length >= 3) {
          // Find destination (should be one of our tropical destinations)
          for (let i = 0; i < filenameParts.length - 1; i++) {
            const possibleDest = filenameParts[i].toUpperCase();
            if (Object.keys(tropicalDestinations).includes(possibleDest)) {
              destination = possibleDest;
              if (i + 1 < filenameParts.length) {
                origin = filenameParts[i + 1].toUpperCase();
              }
              if (i + 2 < filenameParts.length) {
                dates = filenameParts.slice(i + 2).join('-');
              }
              break;
            }
          }
          
          // Alternative parsing - look for known airport codes
          if (destination === 'unknown') {
            for (const part of filenameParts) {
              if (Object.keys(tropicalDestinations).some(dest => 
                part.toLowerCase().includes(dest.toLowerCase()) || 
                tropicalDestinations[dest].name.toLowerCase().includes(part.toLowerCase())
              )) {
                // Found destination match
                for (const [code, info] of Object.entries(tropicalDestinations)) {
                  if (part.toLowerCase().includes(info.name.toLowerCase()) || 
                      part.toLowerCase().includes(code.toLowerCase())) {
                    destination = code;
                    break;
                  }
                }
                break;
              }
            }
          }
          
          // Find UK airport
          if (origin === 'unknown') {
            for (const part of filenameParts) {
              const upperPart = part.toUpperCase();
              if (Object.keys(ukAirports).includes(upperPart)) {
                origin = upperPart;
                break;
              }
            }
          }
        }

        const destInfo = tropicalDestinations[destination] || { name: destination, country: 'Unknown' };
        const originInfo = ukAirports[origin] || origin;
        
        const flightResult = {
          destination: destination,
          destinationName: destInfo.name,
          destinationCountry: destInfo.country,
          origin: origin,
          originName: originInfo,
          price: result.price,
          currency: result.currency || 'GBP',
          airline: result.airline,
          duration: result.duration,
          stops: result.stops || 0,
          bookingUrl: result.deepLink,
          route: `${originInfo} → ${destInfo.name}`,
          passengers: '2A + 2C',
          dates: dates,
          filename: file
        };

        allResults.push(flightResult);

        // Update destination stats
        if (!destinationStats[destination]) {
          destinationStats[destination] = {
            name: destInfo.name,
            country: destInfo.country,
            count: 0,
            minPrice: Infinity,
            maxPrice: 0,
            totalPrice: 0,
            routes: []
          };
        }
        destinationStats[destination].count++;
        destinationStats[destination].minPrice = Math.min(destinationStats[destination].minPrice, result.price);
        destinationStats[destination].maxPrice = Math.max(destinationStats[destination].maxPrice, result.price);
        destinationStats[destination].totalPrice += result.price;
        destinationStats[destination].routes.push(flightResult);

        // Update airport stats
        if (!airportStats[origin]) {
          airportStats[origin] = {
            name: originInfo,
            count: 0,
            minPrice: Infinity,
            maxPrice: 0,
            totalPrice: 0
          };
        }
        airportStats[origin].count++;
        airportStats[origin].minPrice = Math.min(airportStats[origin].minPrice, result.price);
        airportStats[origin].maxPrice = Math.max(airportStats[origin].maxPrice, result.price);
        airportStats[origin].totalPrice += result.price;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  // Sort results by price
  allResults.sort((a, b) => a.price - b.price);

  // Filter results under £1500
  const affordableResults = allResults.filter(r => r.price <= 1500);
  const expensiveResults = allResults.filter(r => r.price > 1500).slice(0, 10);

  console.log('\n' + '='.repeat(80));
  console.log('🏆 TROPICAL FLIGHTS-ONLY ANALYSIS RESULTS');
  console.log('🎯 Family of 4 (2A + 2C) - 5 Days August 2025');
  console.log('='.repeat(80));

  console.log(`📊 Total searches analyzed: ${allResults.length}`);
  console.log(`💰 Budget target: £1500 for family of 4`);

  if (affordableResults.length === 0) {
    console.log('\n❌ NO FLIGHTS FOUND UNDER £1500 FOR FAMILY OF 4');
    console.log('💡 All tropical destinations exceeded the £1500 budget');
    
    console.log('\n📊 CLOSEST OPTIONS (Above £1500):');
    console.log('-'.repeat(60));
    expensiveResults.forEach((result, index) => {
      const overBudget = result.price - 1500;
      console.log(`${(index + 1).toString().padStart(2)}. ${result.route}`);
      console.log(`    💰 £${result.price} total (${result.passengers})`);
      console.log(`    📈 £${overBudget} over £1500 budget`);
      console.log(`    ✈️  ${result.airline} (${result.stops} stops)`);
      console.log(`    📅 ${result.dates}`);
      console.log();
    });
  } else {
    console.log(`\n✅ Found ${affordableResults.length} affordable options under £1500!`);

    // Group by price ranges
    const priceRanges = {
      'Under £500': affordableResults.filter(r => r.price < 500),
      '£500-£750': affordableResults.filter(r => r.price >= 500 && r.price < 750),
      '£750-£1000': affordableResults.filter(r => r.price >= 750 && r.price < 1000),
      '£1000-£1250': affordableResults.filter(r => r.price >= 1000 && r.price < 1250),
      '£1250-£1500': affordableResults.filter(r => r.price >= 1250 && r.price <= 1500)
    };

    for (const [range, results] of Object.entries(priceRanges)) {
      if (results.length > 0) {
        console.log(`\n💰 ${range} (${results.length} options):`);
        results.slice(0, 5).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.route}`);
          console.log(`     💰 £${result.price} total (${result.passengers})`);
          console.log(`     ✈️  ${result.airline} (${result.stops} stops)`);
          console.log(`     📅 ${result.dates}`);
          console.log(`     🔗 ${result.bookingUrl}`);
          console.log();
        });
        if (results.length > 5) {
          console.log(`     ... and ${results.length - 5} more options\n`);
        }
      }
    }

    console.log('\n🏆 TOP 10 BEST DEALS (Under £1500):');
    console.log('-'.repeat(60));
    affordableResults.slice(0, 10).forEach((result, index) => {
      const savings = 1500 - result.price;
      console.log(`${(index + 1).toString().padStart(2)}. ${result.route}`);
      console.log(`    💰 £${result.price} total (${result.passengers})`);
      console.log(`    💚 £${savings} under budget`);
      console.log(`    ✈️  ${result.airline} (${result.stops} stops)`);
      console.log(`    📅 ${result.dates}`);
      console.log(`    🔗 ${result.bookingUrl}`);
      console.log();
    });
  }

  // Destination analysis
  console.log('\n📊 DESTINATION ANALYSIS:');
  console.log('-'.repeat(50));
  Object.entries(destinationStats)
    .sort(([,a], [,b]) => a.minPrice - b.minPrice)
    .forEach(([code, stats]) => {
      const avgPrice = Math.round(stats.totalPrice / stats.count);
      const affordableCount = stats.routes.filter(r => r.price <= 1500).length;
      console.log(`${stats.name}, ${stats.country} (${code}):`);
      console.log(`  📊 ${stats.count} routes | From £${stats.minPrice} | Avg £${avgPrice}`);
      console.log(`  ✅ ${affordableCount} under £1500`);
      console.log();
    });

  // UK airport analysis
  console.log('\n🛫 UK DEPARTURE AIRPORT ANALYSIS:');
  console.log('-'.repeat(50));
  Object.entries(airportStats)
    .sort(([,a], [,b]) => a.minPrice - b.minPrice)
    .forEach(([code, stats]) => {
      const avgPrice = Math.round(stats.totalPrice / stats.count);
      console.log(`${stats.name} (${code}):`);
      console.log(`  📊 ${stats.count} routes | From £${stats.minPrice} | Avg £${avgPrice}`);
      console.log();
    });

  // Summary recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('-'.repeat(30));
  if (affordableResults.length === 0) {
    console.log('• Consider increasing budget above £1500');
    console.log('• Look at different travel dates in August 2025');
    console.log('• Consider 3-4 day trips instead of 5 days');
    console.log('• Check for last-minute deals closer to travel dates');
    
    // Find the cheapest option
    if (allResults.length > 0) {
      const cheapest = allResults[0];
      console.log(`• Cheapest option found: ${cheapest.route} at £${cheapest.price}`);
    }
  } else {
    const bestDeal = affordableResults[0];
    console.log(`• Best deal: ${bestDeal.route} at £${bestDeal.price}`);
    console.log(`• You have ${affordableResults.length} affordable options to choose from`);
    console.log('• Book early for better prices and availability');
    console.log('• Consider travel insurance for family trips');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Tropical flights-only analysis complete!');
  console.log(`📊 Analyzed ${allResults.length} flight combinations`);
  console.log(`🎯 Found ${affordableResults.length} options under £1500 budget`);
  console.log('🏝️ Focus: 5-day tropical trips in August 2025');
  console.log('✈️ FLIGHTS ONLY - No accommodation included');
  console.log('👨‍👩‍👧‍👦 Family of 4 (2 Adults + 2 Children)');
  console.log('='.repeat(80));

  return {
    total: allResults.length,
    affordable: affordableResults.length,
    cheapest: allResults[0],
    bestAffordable: affordableResults[0] || null,
    destinations: Object.keys(destinationStats).length,
    airports: Object.keys(airportStats).length
  };
}

// Run the analysis
if (require.main === module) {
  analyzeTropicalFlights().catch(error => {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  });
}

module.exports = analyzeTropicalFlights;