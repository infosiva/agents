const fs = require('fs');
const path = require('path');

console.log('🏖️ REALISTIC FAMILY PACKAGE ANALYSIS - Turkey vs Gran Canaria\n');
console.log('👨‍👩‍👧‍👦 Family of 4 (2 adults, 2 children) - 2 rooms required\n');
console.log('📅 August 2025 - Peak Summer Holiday Period\n');

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

// Analyze results with more flexible budget ranges
function analyzePackageResults(destination) {
  const results = [];
  
  const files = fs.readdirSync(dataDir).filter(f => 
    f.includes(destination) && f.endsWith('.json')
  );
  
  files.forEach(file => {
    const data = readJsonFile(file);
    if (data && data.searches && data.searches.length > 0) {
      const search = data.searches[0];
      if (search.allResults) {
        const packages = search.allResults.filter(r => r.type === 'package');
        const cheapestPackage = packages.reduce((min, pkg) => 
          pkg.totalPrice < (min?.totalPrice || Infinity) ? pkg : min, null
        );
        
        if (cheapestPackage) {
          let match, destName, airport;
          if (destination === 'turkey') {
            match = file.match(/turkey-([^-]+)-([^-]+)-(\d+d)-([^.]+)/);
            if (match) {
              destName = match[1];
              airport = match[1] === 'istanbul' ? 'Istanbul (IST)' : 
                       match[1] === 'antalya' ? 'Antalya (AYT)' : match[1];
            }
          } else {
            match = file.match(/gran-canaria-(\d+d)-([^.]+)/);
            if (match) {
              destName = 'gran-canaria';
              airport = 'Gran Canaria (LPA)';
            }
          }
          
          if (match) {
            const duration = match[destination === 'turkey' ? 3 : 1];
            const period = match[destination === 'turkey' ? 4 : 2];
            
            results.push({
              destination: destName,
              airport: airport,
              duration: duration,
              period: period,
              price: cheapestPackage.totalPrice,
              savings: cheapestPackage.savings,
              hotel: cheapestPackage.hotel.name,
              rating: cheapestPackage.hotel.rating,
              pricePerNight: Math.round(cheapestPackage.hotel.pricePerNight),
              airline: cheapestPackage.flight.airline,
              provider: cheapestPackage.packageProvider,
              location: cheapestPackage.hotel.location
            });
          }
        }
      }
    }
  });
  
  return results;
}

const turkeyResults = analyzePackageResults('turkey');
const canariaResults = analyzePackageResults('gran-canaria');

console.log('💰 BUDGET REALITY CHECK:\n');

// Budget categories
const budgets = [
  { name: 'Tight Budget', max: 2000, emoji: '💸' },
  { name: 'Flexible Budget', max: 2500, emoji: '💰' },
  { name: 'Comfortable Budget', max: 3000, emoji: '🏦' },
  { name: 'Premium Budget', max: 4000, emoji: '💎' }
];

budgets.forEach(budget => {
  const turkeyOptions = turkeyResults.filter(r => r.price <= budget.max);
  const canariaOptions = canariaResults.filter(r => r.price <= budget.max);
  
  console.log(`${budget.emoji} ${budget.name.toUpperCase()} (Under £${budget.max}):`);
  console.log(`   🇹🇷 Turkey: ${turkeyOptions.length} options available`);
  console.log(`   🇮🇨 Gran Canaria: ${canariaOptions.length} options available\n`);
});

// Best value analysis
console.log('🏆 BEST VALUE DEALS BY TRIP LENGTH:\n');

['4d', '7d', '10d'].forEach(duration => {
  const turkeyDuration = turkeyResults.filter(r => r.duration === duration);
  const canariaDuration = canariaResults.filter(r => r.duration === duration);
  
  const turkeyBest = turkeyDuration.sort((a, b) => a.price - b.price)[0];
  const canariaBest = canariaDuration.sort((a, b) => a.price - b.price)[0];
  
  console.log(`${duration.toUpperCase()} TRIPS - BEST DEALS:`);
  
  if (turkeyBest) {
    console.log(`🇹🇷 Turkey Best: £${turkeyBest.price}`);
    console.log(`   📍 ${turkeyBest.airport}`);
    console.log(`   🏨 ${turkeyBest.hotel} (${turkeyBest.rating}⭐) - ${turkeyBest.location}`);
    console.log(`   ✈️ ${turkeyBest.airline} - ${turkeyBest.provider}`);
    console.log(`   💰 Save £${turkeyBest.savings} vs individual booking`);
  }
  
  if (canariaBest) {
    console.log(`🇮🇨 Canaria Best: £${canariaBest.price}`);
    console.log(`   📍 ${canariaBest.airport}`);
    console.log(`   🏨 ${canariaBest.hotel} (${canariaBest.rating}⭐) - ${canariaBest.location}`);
    console.log(`   ✈️ ${canariaBest.airline} - ${canariaBest.provider}`);
    console.log(`   💰 Save £${canariaBest.savings} vs individual booking`);
  }
  
  if (turkeyBest && canariaBest) {
    const difference = canariaBest.price - turkeyBest.price;
    const percentSaving = Math.round((difference / canariaBest.price) * 100);
    if (difference > 0) {
      console.log(`   🎯 Turkey is £${difference} cheaper (${percentSaving}% saving)`);
    } else {
      console.log(`   🎯 Gran Canaria is £${Math.abs(difference)} cheaper (${Math.abs(percentSaving)}% saving)`);
    }
  }
  console.log('');
});

// Top 3 overall deals
console.log('🌟 TOP 3 OVERALL DEALS:\n');

const allResults = [...turkeyResults, ...canariaResults].sort((a, b) => a.price - b.price);

allResults.slice(0, 3).forEach((deal, i) => {
  const flag = deal.destination.includes('turkey') ? '🇹🇷' : '🇮🇨';
  const country = deal.destination.includes('turkey') ? 'TURKEY' : 'GRAN CANARIA';
  
  console.log(`${i + 1}. ${flag} ${country} - ${deal.duration.toUpperCase()} (${deal.period})`);
  console.log(`   💰 £${deal.price} total (Save £${deal.savings})`);
  console.log(`   📍 ${deal.airport}`);
  console.log(`   🏨 ${deal.hotel} (${deal.rating}⭐) - ${deal.location}`);
  console.log(`   ✈️ ${deal.airline} via ${deal.provider}`);
  console.log(`   💷 £${deal.pricePerNight}/night per room\n`);
});

// Practical recommendations
console.log('🎯 PRACTICAL RECOMMENDATIONS:\n');

const cheapestTurkey = turkeyResults.sort((a, b) => a.price - b.price)[0];
const cheapestCanaria = canariaResults.sort((a, b) => a.price - b.price)[0];

console.log('FOR £2000 FAMILY BUDGET:');
if (cheapestTurkey && cheapestTurkey.price <= 2000) {
  console.log(`✅ Turkey has options from £${cheapestTurkey.price}`);
} else if (cheapestTurkey) {
  console.log(`❌ Turkey minimum: £${cheapestTurkey.price} (£${cheapestTurkey.price - 2000} over budget)`);
} else {
  console.log(`❌ No Turkey packages found`);
}

if (cheapestCanaria && cheapestCanaria.price <= 2000) {
  console.log(`✅ Gran Canaria has options from £${cheapestCanaria.price}`);
} else if (cheapestCanaria) {
  console.log(`❌ Gran Canaria minimum: £${cheapestCanaria.price} (£${cheapestCanaria.price - 2000} over budget)`);
} else {
  console.log(`❌ No Gran Canaria packages found`);
}

console.log('\n💡 MONEY-SAVING ALTERNATIVES:');
console.log('1. 🗓️ Consider September instead of August (20-30% cheaper)');
console.log('2. ✈️ Look at flights-only + separate hotel booking');
console.log('3. 🏨 Try 3-star hotels vs 4-star for better value');
console.log('4. 📅 Shorter trips (4-5 days) vs full week');
console.log('5. 🛫 Different departure airports (Manchester/Gatwick vs Heathrow)');

console.log('\n🏆 FINAL VERDICT:');
if (cheapestTurkey && cheapestCanaria) {
  if (cheapestTurkey.price < cheapestCanaria.price) {
    const saving = cheapestCanaria.price - cheapestTurkey.price;
    const percent = Math.round((saving / cheapestCanaria.price) * 100);
    console.log(`🥇 WINNER: TURKEY`);
    console.log(`   • £${saving} cheaper (${percent}% saving)`);
    console.log(`   • More cultural experiences included`);
    console.log(`   • Better value for money`);
    console.log(`   • Rich history and amazing food`);
  } else {
    console.log(`🥇 WINNER: GRAN CANARIA`);
    console.log(`   • More familiar destination`);
    console.log(`   • No time difference`);
    console.log(`   • Shorter flight time`);
    console.log(`   • EU standards and regulations`);
  }
} else {
  console.log('❓ Both destinations require flexible budget for August family packages');
}

console.log('\n📊 KEY INSIGHTS:');
console.log('• August is peak season - expect premium pricing');
console.log('• Family packages (2 rooms) significantly increase costs');
console.log('• Turkey offers better cultural value for money');
console.log('• Gran Canaria offers more predictable experience');
console.log('• Consider shoulder seasons for better deals');