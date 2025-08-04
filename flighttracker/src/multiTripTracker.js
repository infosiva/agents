const cron = require('node-cron');
const FlightApi = require('./flightApi');
const PackageApi = require('./packageApi');
const PriceTracker = require('./priceTracker');
const Notifier = require('./notifier');
const AirportData = require('./airportData');

class MultiTripTracker {
  constructor() {
    this.flightApi = new FlightApi();
    this.packageApi = new PackageApi();
    this.airportData = new AirportData();
    this.trips = new Map(); // Store multiple trip configurations
    this.isRunning = false;
    this.cronJob = null;
  }

  addTrip(tripId, config) {
    const defaultConfig = {
      originCountry: 'uk',
      destinationCountry: 'maldives',
      origin: 'LHR',
      destination: 'MLE',
      adults: 1,
      children: 0,
      infants: 0,
      cabinClass: 'economy',
      departureDate: null,
      returnDate: null,
      currency: 'GBP',
      includePackages: true,
      hotelRating: 3,
      hotelRatings: [3],
      rooms: 1,
      enabled: true
    };

    const tripConfig = { ...defaultConfig, ...config };
    
    // Create separate price tracker and notifier for each trip
    const priceTracker = new PriceTracker();
    priceTracker.dataFile = priceTracker.dataFile.replace('flight-history.json', `flight-history-${tripId}.json`);
    
    const notifier = new Notifier();
    
    this.trips.set(tripId, {
      config: tripConfig,
      priceTracker,
      notifier,
      lastCheck: null
    });

    console.log(`✅ Added trip "${tripId}": ${tripConfig.origin} → ${tripConfig.destination}`);
    return tripId;
  }

  removeTrip(tripId) {
    if (this.trips.has(tripId)) {
      this.trips.delete(tripId);
      console.log(`🗑️ Removed trip "${tripId}"`);
      return true;
    }
    console.log(`❌ Trip "${tripId}" not found`);
    return false;
  }

  listTrips() {
    console.log(`\n📋 Active Trips (${this.trips.size}):`);
    if (this.trips.size === 0) {
      console.log('   No trips configured');
      return;
    }

    this.trips.forEach((trip, tripId) => {
      const config = trip.config;
      const status = config.enabled ? '✅' : '❌';
      const route = `${config.origin} → ${config.destination}`;
      let passengers = `${config.adults}A`;
      if (config.children > 0) passengers += ` ${config.children}C`;
      if (config.infants > 0) passengers += ` ${config.infants}I`;
      const dates = config.departureDate ? ` (${config.departureDate}` + (config.returnDate ? ` → ${config.returnDate})` : ')') : '';
      
      console.log(`   ${status} ${tripId}: ${route} - ${passengers} - ${config.cabinClass}${dates}`);
    });
  }

  enableTrip(tripId) {
    const trip = this.trips.get(tripId);
    if (trip) {
      trip.config.enabled = true;
      console.log(`✅ Enabled trip "${tripId}"`);
      return true;
    }
    return false;
  }

  disableTrip(tripId) {
    const trip = this.trips.get(tripId);
    if (trip) {
      trip.config.enabled = false;
      console.log(`❌ Disabled trip "${tripId}"`);
      return true;
    }
    return false;
  }

  async checkTrip(tripId) {
    const trip = this.trips.get(tripId);
    if (!trip || !trip.config.enabled) return;

    const { config, priceTracker, notifier } = trip;
    
    try {
      const originCountry = this.airportData.getCountryByCode(config.originCountry);
      const destCountry = this.airportData.getCountryByCode(config.destinationCountry);
      
      console.log(`\n🔍 Checking trip "${tripId}"...`);
      console.log(`📍 Route: ${originCountry?.name || config.origin} → ${destCountry?.name || config.destination}`);
      console.log(`✈️ Airports: ${config.origin} → ${config.destination}`);
      
      let allResults = [];
      
      // Search for flights
      const flights = await this.flightApi.searchFlights(
        config.origin,
        config.destination,
        config.departureDate,
        config.returnDate,
        config.adults,
        config.children,
        config.infants,
        config.cabinClass
      );

      if (flights && flights.length > 0) {
        allResults = [...flights.map(f => ({ ...f, type: 'flight' }))];
      }

      // Search for packages if enabled
      if (config.includePackages && config.returnDate) {
        const ratingsText = config.hotelRatings.length > 1 ? 
          `${config.hotelRatings.join('⭐ & ')}⭐` : 
          `${config.hotelRatings[0]}⭐`;
        console.log(`🏨 Also searching for ${ratingsText} package deals...`);
        
        const packages = await this.packageApi.searchMultipleRatingPackages(
          config.origin,
          config.destination,
          config.departureDate,
          config.returnDate,
          config.adults,
          config.children,
          config.rooms,
          config.hotelRatings
        );

        if (packages && packages.length > 0) {
          allResults = [...allResults, ...packages];
        }
      }

      if (allResults.length === 0) {
        console.log(`❌ No flights or packages found for trip "${tripId}"`);
        return;
      }

      // Sort all results by price for comparison
      allResults.sort((a, b) => (a.totalPrice || a.price) - (b.totalPrice || b.price));

      const analysis = await priceTracker.analyzeFlights(allResults);
      
      if (analysis) {
        await notifier.sendPriceAlert(analysis, tripId);
        notifier.logFlightUpdate(allResults, analysis, tripId);
      }

      trip.lastCheck = new Date().toISOString();

    } catch (error) {
      console.error(`❌ Error checking trip "${tripId}":`, error.message);
    }
  }

  async checkAllTrips() {
    if (this.isRunning) {
      console.log('⏳ Trip checks already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      const enabledTrips = Array.from(this.trips.entries()).filter(([_, trip]) => trip.config.enabled);
      
      if (enabledTrips.length === 0) {
        console.log('📭 No enabled trips to check');
        return;
      }

      console.log(`\n⏰ Checking ${enabledTrips.length} trip(s)...`);
      
      // Run all trip checks in parallel
      await Promise.all(
        enabledTrips.map(([tripId, _]) => this.checkTrip(tripId))
      );

    } catch (error) {
      console.error('❌ Error during trip checks:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    if (this.trips.size === 0) {
      console.log('❌ No trips configured. Add trips first.');
      return;
    }

    console.log('🚀 Multi-Trip Flight Tracker Started!');
    console.log(`📊 Monitoring ${this.trips.size} trip(s) every 5 minutes...`);
    console.log('🔔 You\'ll receive notifications for all trips\n');

    // Check all trips immediately
    this.checkAllTrips();

    // Schedule checks every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', () => {
      this.checkAllTrips();
    });

    // Daily summary at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('\n📈 Daily Summary for All Trips:');
      for (const [tripId, trip] of this.trips.entries()) {
        if (trip.config.enabled) {
          const stats = await trip.priceTracker.getStats();
          console.log(`\n🛫 Trip "${tripId}" (${trip.config.origin} → ${trip.config.destination}):`);
          console.log(`   Current Best: £${stats.currentPrice || 'N/A'}`);
          console.log(`   All-Time Best: £${stats.bestEverPrice || 'N/A'}`);
          if (stats.averagePrice) console.log(`   Average: £${Math.round(stats.averagePrice)}`);
        }
      }
    });

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Multi-Trip Flight Tracker stopped');
      if (this.cronJob) {
        this.cronJob.destroy();
      }
      process.exit(0);
    });
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('⏹️ Multi-Trip Flight Tracker stopped');
  }

  // Helper methods for easy trip creation
  createTripFromCountries(tripId, fromCountry, toCountry, config = {}) {
    const originAirport = this.airportData.getPrimaryAirportForCountry(fromCountry);
    const destAirport = this.airportData.getPrimaryAirportForCountry(toCountry);
    
    if (!originAirport || !destAirport) {
      console.log('❌ Invalid country codes');
      return false;
    }
    
    const tripConfig = {
      ...config,
      originCountry: fromCountry.toLowerCase(),
      destinationCountry: toCountry.toLowerCase(),
      origin: originAirport.code,
      destination: destAirport.code
    };
    
    return this.addTrip(tripId, tripConfig);
  }

  createTripFromAirports(tripId, fromAirport, toAirport, config = {}) {
    const tripConfig = {
      ...config,
      origin: fromAirport.toUpperCase(),
      destination: toAirport.toUpperCase()
    };
    
    return this.addTrip(tripId, tripConfig);
  }
}

module.exports = MultiTripTracker;