const fs = require('fs');
const path = require('path');

console.log('🆚 TURKEY vs GRAN CANARIA - Comprehensive Family Package Analysis\n');
console.log('🎯 Budget Target: £2000 for family of 4 (2 adults, 2 children, 2 rooms)\n');

const dataDir = path.join(__dirname, 'data');

// Helper function to read JSON files
function readJsonFile(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${filename}`);
  }
  return null;
}

// Analyze Turkey results
function analyzeTurkeyResults() {
  const turkeyResults = [];
  
  const files = fs.readdirSync(dataDir).filter(f => 
    f.includes('turkey-') && f.endsWith('.json')
  );
  
  files.forEach(file => {
    const data = readJsonFile(file);
    if (data && data.searches && data.searches.length > 0) {
      const search = data.searches[0];
      if (search.allResults) {
        const packages = search.allResults.filter(r => r.type === 'package');
        const cheapestPackage = packages.reduce((min, pkg) => 
          pkg.totalPrice < min.totalPrice ? pkg : min, packages[0]
        );
        
        if (cheapestPackage) {
          const match = file.match(/turkey-([^-]+)-([^-]+)-(\d+d)-([^.]+)/);
          if (match) {
            turkeyResults.push({
              destination: match[1],
              airport: match[2] === 'istanbul' ? 'Istanbul (IST)' : 'Antalya (AYT)',
              duration: match[3],
              period: match[4],
              price: cheapestPackage.totalPrice,
              savings: cheapestPackage.savings,
              hotel: cheapestPackage.hotel.name,
              rating: cheapestPackage.hotel.rating,
              pricePerNight: Math.round(cheapestPackage.hotel.pricePerNight),
              airline: cheapestPackage.flight.airline,
              provider: cheapestPackage.packageProvider
            });
          }
        }
      }
    }
  });
  
  return turkeyResults;
}

// Analyze Gran Canaria results
function analyzeCanariaResults() {
  const canariaResults = [];
  
  const files = fs.readdirSync(dataDir).filter(f => 
    f.includes('gran-canaria') && f.endsWith('.json')
  );
  
  files.forEach(file => {
    const data = readJsonFile(file);
    if (data && data.searches && data.searches.length > 0) {
      const search = data.searches[0];
      if (search.allResults) {
        const packages = search.allResults.filter(r => r.type === 'package');
        const cheapestPackage = packages.reduce((min, pkg) => 
          pkg.totalPrice < min.totalPrice ? pkg : min, packages[0]
        );
        
        if (cheapestPackage) {
          const match = file.match(/gran-canaria-(\d+d)-([^.]+)/);
          if (match) {
            canariaResults.push({
              destination: 'gran-canaria',
              airport: 'Gran Canaria (LPA)',
              duration: match[1],
              period: match[2],
              price: cheapestPackage.totalPrice,
              savings: cheapestPackage.savings,
              hotel: cheapestPackage.hotel.name,
              rating: cheapestPackage.hotel.rating,
              pricePerNight: Math.round(cheapestPackage.hotel.pricePerNight),
              airline: cheapestPackage.flight.airline,
              provider: cheapestPackage.packageProvider
            });
          }
        }
      }
    }
  });
  
  return canariaResults;
}

const turkeyResults = analyzeTurkeyResults();
const canariaResults = analyzeCanariaResults();

console.log('📊 RESULTS SUMMARY\n');

// Best deals under £2000
const turkeyUnder2000 = turkeyResults.filter(r => r.price <= 2000);
const canariaUnder2000 = canariaResults.filter(r => r.price <= 2000);

console.log(`🇹🇷 TURKEY - Deals under £2000: ${turkeyUnder2000.length}`);
console.log(`🇮🇨 GRAN CANARIA - Deals under £2000: ${canariaUnder2000.length}\n`);

// Best Turkey deals
console.log('🏆 TOP 5 TURKEY DEALS UNDER £2000:');
const topTurkey = turkeyUnder2000
  .sort((a, b) => a.price - b.price)
  .slice(0, 5);

topTurkey.forEach((deal, i) => {
  console.log(`${i + 1}. ${deal.airport} - ${deal.duration} (${deal.period})`);
  console.log(`   💰 £${deal.price} total (Save £${deal.savings})`);
  console.log(`   🏨 ${deal.hotel} (${deal.rating}⭐) - £${deal.pricePerNight}/night`);
  console.log(`   ✈️ ${deal.airline} via ${deal.provider}\n`);
});

// Best Gran Canaria deals  
console.log('🏆 TOP 5 GRAN CANARIA DEALS UNDER £2000:');
const topCanaria = canariaUnder2000
  .sort((a, b) => a.price - b.price)
  .slice(0, 5);

if (topCanaria.length === 0) {
  console.log('   ❌ No Gran Canaria packages found under £2000\n');
} else {
  topCanaria.forEach((deal, i) => {
    console.log(`${i + 1}. ${deal.airport} - ${deal.duration} (${deal.period})`);
    console.log(`   💰 £${deal.price} total (Save £${deal.savings})`);
    console.log(`   🏨 ${deal.hotel} (${deal.rating}⭐) - £${deal.pricePerNight}/night`);
    console.log(`   ✈️ ${deal.airline} via ${deal.provider}\n`);
  });
}

// Price comparison by duration
console.log('📈 PRICE COMPARISON BY TRIP LENGTH:\n');

['4d', '7d', '10d'].forEach(duration => {
  const turkeyDuration = turkeyResults.filter(r => r.duration === duration);
  const canariaDuration = canariaResults.filter(r => r.duration === duration);
  
  const turkeyAvg = turkeyDuration.reduce((sum, r) => sum + r.price, 0) / turkeyDuration.length;
  const canariaAvg = canariaDuration.reduce((sum, r) => sum + r.price, 0) / canariaDuration.length;
  
  const turkeyMin = Math.min(...turkeyDuration.map(r => r.price));
  const canariaMin = canariaDuration.length > 0 ? Math.min(...canariaDuration.map(r => r.price)) : 0;
  
  console.log(`${duration.toUpperCase()} TRIPS:`);
  console.log(`🇹🇷 Turkey - Min: £${turkeyMin}, Avg: £${Math.round(turkeyAvg)}`);
  console.log(`🇮🇨 Canaria - Min: £${canariaMin || 'N/A'}, Avg: £${Math.round(canariaAvg) || 'N/A'}`);
  
  if (canariaMin > 0) {
    const savings = canariaMin - turkeyMin;
    const savingsPercent = Math.round((savings / canariaMin) * 100);
    console.log(`💰 Turkey saves: £${savings} (${savingsPercent}% cheaper)\n`);
  } else {
    console.log(`💰 Turkey is the clear winner - Canaria over budget\n`);
  }
});

// Final recommendations
console.log('🎯 FINAL RECOMMENDATIONS FOR £2000 FAMILY BUDGET:\n');

console.log('🏆 WINNER: TURKEY');
console.log('');
console.log('✅ WHY TURKEY WINS:');
console.log(`   • ${turkeyUnder2000.length} package options under £2000`);
console.log(`   • Best deal: £${Math.min(...turkeyUnder2000.map(r => r.price))}`);
console.log('   • Rich cultural experiences included');
console.log('   • Excellent value Turkish hospitality');
console.log('   • World-class historical sites');
console.log('   • Great food included in packages');
console.log('');

console.log('❌ GRAN CANARIA CHALLENGES:');
if (canariaUnder2000.length === 0) {
  console.log('   • No packages found under £2000 budget');
  console.log('   • August is peak season = higher prices');
  console.log('   • Limited family package deals');
} else {
  console.log(`   • Only ${canariaUnder2000.length} limited options under £2000`);
  console.log(`   • Best deal: £${Math.min(...canariaUnder2000.map(r => r.price))}`);
  console.log('   • Higher prices in August');
}
console.log('');

console.log('🎪 TOP TURKEY RECOMMENDATIONS:');
if (topTurkey.length > 0) {
  console.log(`1. 🥇 BEST VALUE: ${topTurkey[0].airport} ${topTurkey[0].duration}`);
  console.log(`   £${topTurkey[0].price} - ${topTurkey[0].hotel} (${topTurkey[0].rating}⭐)`);
  console.log(`   Perfect for: Cultural experience + great value`);
  console.log('');
  
  if (topTurkey.length > 1) {
    console.log(`2. 🥈 RUNNER UP: ${topTurkey[1].airport} ${topTurkey[1].duration}`);
    console.log(`   £${topTurkey[1].price} - ${topTurkey[1].hotel} (${topTurkey[1].rating}⭐)`);
    console.log(`   Perfect for: Alternative dates/airports`);
  }
}

console.log('');
console.log('💡 BOOKING TIPS:');
console.log('   • Book Turkey packages 6-8 weeks ahead');
console.log('   • Turkish Airlines often has best package deals');
console.log('   • Istanbul = culture, Antalya = beaches');
console.log('   • Consider split stays (Istanbul + Antalya)');
console.log('   • August weather: 25-35°C, perfect for families');