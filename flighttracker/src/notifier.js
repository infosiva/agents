const notifier = require('node-notifier');

class Notifier {
  constructor() {
    this.lastNotification = null;
  }

  async sendPriceAlert(analysis, tripId = null) {
    if (!analysis.shouldAlert) return;

    const deal = analysis.currentCheapest;
    let message = '';
    let title = '';
    const tripPrefix = tripId ? `[${tripId}] ` : '';

    if (deal.type === 'package') {
      if (analysis.isNewBest) {
        title = `🎉 ${tripPrefix}New Best Package Deal!`;
        message = `${deal.flight.airline} + ${deal.hotel.name} (${deal.hotel.rating}⭐): £${deal.totalPrice} (Save £${deal.savings}!)`;
      } else {
        title = `🏨 ${tripPrefix}Package Update`;
        message = `${deal.flight.airline} + ${deal.hotel.name} (${deal.hotel.rating}⭐): £${deal.totalPrice} (Save £${deal.savings})`;
      }
    } else {
      if (analysis.isNewBest) {
        title = `🎉 ${tripPrefix}New Best Flight Price!`;
        message = `${deal.airline}: £${deal.price} (${analysis.priceDrop > 0 ? `£${analysis.priceDrop} cheaper!` : 'New best price'})`;
      } else {
        title = `✈️ ${tripPrefix}Flight Update`;
        message = `${deal.airline}: £${deal.price} (Current price)`;
      }
    }

    const notification = {
      title,
      message: deal.type === 'package' ? 
        `${message}\nPackage Deal` : 
        `${message}\nFlight Only\nStops: ${deal.stops}`,
      sound: true,
      wait: false,
      timeout: 10
    };

    try {
      notifier.notify(notification);
      const alertPrefix = tripId ? `\n🔔 ALERT for trip "${tripId}": ${title}` : `\n🔔 ALERT: ${title}`;
      console.log(alertPrefix);
      console.log(`   ${message}`);
      
      if (deal.type === 'package') {
        console.log(`   Hotel: ${deal.hotel.name} (${deal.hotel.rating}⭐)`);
        console.log(`   Location: ${deal.hotel.location}`);
        console.log(`   Included: ${deal.included.join(', ')}`);
      } else {
        console.log(`   Departure: ${new Date(deal.departureTime).toLocaleString()}`);
        console.log(`   Duration: ${Math.floor(deal.duration / 60)}h ${deal.duration % 60}m`);
      }
      
      if (deal.deepLink && deal.deepLink !== '#') {
        console.log(`   Book: ${deal.deepLink}`);
      }
      console.log('');
      
      this.lastNotification = Date.now();
    } catch (error) {
      console.error('Notification error:', error.message);
    }
  }

  logFlightUpdate(results, analysis, tripId = null) {
    const timestamp = new Date().toLocaleString();
    const cheapest = analysis.currentCheapest;
    const tripHeader = tripId ? ` for trip "${tripId}"` : '';
    
    console.log(`\n📊 Search Results${tripHeader} - ${timestamp}`);
    
    if (cheapest.type === 'package') {
      console.log(`💰 Cheapest: ${cheapest.flight.airline} + ${cheapest.hotel.name} - £${cheapest.totalPrice}`);
      console.log(`💾 Package Savings: £${cheapest.savings} vs booking separately`);
    } else {
      console.log(`💰 Cheapest: ${cheapest.airline} - £${cheapest.price || cheapest.totalPrice}`);
    }
    
    console.log(`📈 Price Trend: ${this.getTrendEmoji(analysis.trend)} ${analysis.trend.replace('_', ' ')}`);
    
    if (analysis.isNewBest) {
      console.log('🎯 NEW BEST PRICE! 🎯');
    }
    
    // Separate flights and packages for display
    const flights = results.filter(r => r.type === 'flight');
    const packages = results.filter(r => r.type === 'package');
    
    if (flights.length > 0) {
      console.log('\n✈️ Top 3 Flights:');
      flights.slice(0, 3).forEach((flight, i) => {
        const date = new Date(flight.departureTime).toLocaleDateString();
        const stops = flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;
        console.log(`   ${i + 1}. ${flight.airline} - £${flight.price} (${stops}) - ${date}`);
      });
    }
    
    if (packages.length > 0) {
      console.log('\n🏨 Top 3 Package Deals:');
      packages.slice(0, 3).forEach((pkg, i) => {
        const savings = pkg.savings ? ` (Save £${pkg.savings})` : '';
        console.log(`   ${i + 1}. ${pkg.flight.airline} + ${pkg.hotel.name} (${pkg.hotel.rating}⭐) - £${pkg.totalPrice}${savings}`);
      });
    }
    
    console.log('\n' + '─'.repeat(60));
  }

  getTrendEmoji(trend) {
    switch (trend) {
      case 'decreasing': return '📉';
      case 'increasing': return '📈';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }

  async sendDailyReport(stats) {
    const message = `Daily Flight Report:
Best Price Today: £${stats.currentPrice}
All-Time Best: £${stats.bestEverPrice}
Average: £${Math.round(stats.averagePrice)}
Trend: ${stats.trend}`;

    console.log(`\n📈 Daily Summary:`);
    console.log(`   Current Best: £${stats.currentPrice}`);
    console.log(`   All-Time Best: £${stats.bestEverPrice}`);
    console.log(`   Today's Average: £${Math.round(stats.averagePrice)}`);
    console.log(`   Price Trend: ${this.getTrendEmoji(stats.trend)} ${stats.trend}`);
    console.log(`   Total Searches: ${stats.totalSearches}`);
  }
}

module.exports = Notifier;