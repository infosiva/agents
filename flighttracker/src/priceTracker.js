const fs = require('fs').promises;
const path = require('path');

class PriceTracker {
  constructor() {
    this.dataFile = path.join(__dirname, '..', 'data', 'flight-history.json');
    this.currentBest = null;
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async loadHistory() {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return { searches: [], bestPrice: null, lastAlert: null };
    }
  }

  async saveHistory(history) {
    await this.ensureDataDirectory();
    await fs.writeFile(this.dataFile, JSON.stringify(history, null, 2));
  }

  async analyzeFlights(results) {
    if (!results || results.length === 0) return null;

    const history = await this.loadHistory();
    const timestamp = new Date().toISOString();
    
    const cheapestResult = results.reduce((min, result) => {
      const currentPrice = result.totalPrice || result.price;
      const minPrice = min.totalPrice || min.price;
      return currentPrice < minPrice ? result : min;
    });

    const cheapestPrice = cheapestResult.totalPrice || cheapestResult.price;
    const searchResult = {
      timestamp,
      cheapestPrice: cheapestPrice,
      cheapestResult,
      allResults: results,
      averagePrice: results.reduce((sum, r) => sum + (r.totalPrice || r.price), 0) / results.length
    };

    history.searches.push(searchResult);
    
    if (history.searches.length > 100) {
      history.searches = history.searches.slice(-100);
    }

    const analysis = {
      currentCheapest: cheapestResult,
      isNewBest: false,
      priceDrop: 0,
      trend: this.calculateTrend(history.searches),
      shouldAlert: false
    };

    if (!history.bestPrice || cheapestPrice < history.bestPrice.price) {
      analysis.isNewBest = true;
      analysis.priceDrop = history.bestPrice ? history.bestPrice.price - cheapestPrice : 0;
      analysis.shouldAlert = true;
      history.bestPrice = {
        price: cheapestPrice,
        result: cheapestResult,
        timestamp
      };
      history.lastAlert = timestamp;
    } else {
      // Always alert for every search - no time restrictions
      analysis.shouldAlert = true;
      history.lastAlert = timestamp;
    }

    await this.saveHistory(history);
    this.currentBest = history.bestPrice;
    
    return analysis;
  }

  calculateTrend(searches) {
    if (searches.length < 3) return 'insufficient_data';

    const recent = searches.slice(-5);
    const older = searches.slice(-10, -5);

    if (older.length === 0) return 'insufficient_data';

    const recentAvg = recent.reduce((sum, s) => sum + s.cheapestPrice, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.cheapestPrice, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change < -5) return 'decreasing';
    if (change > 5) return 'increasing';
    return 'stable';
  }

  async getStats() {
    const history = await this.loadHistory();
    
    if (history.searches.length === 0) {
      return { message: 'No flight data available yet' };
    }

    const prices = history.searches.map(s => s.cheapestPrice);
    const latest = history.searches[history.searches.length - 1];

    return {
      totalSearches: history.searches.length,
      bestEverPrice: Math.min(...prices),
      worstPrice: Math.max(...prices),
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      currentPrice: latest.cheapestPrice,
      trend: this.calculateTrend(history.searches),
      lastUpdated: latest.timestamp
    };
  }
}

module.exports = PriceTracker;