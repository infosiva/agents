const cron = require('node-cron');
const FlightApi = require('./flightApi');
const PackageApi = require('./packageApi');
const PriceTracker = require('./priceTracker');
const Notifier = require('./notifier');
const AirportData = require('./airportData');

class FlightTracker {
  constructor() {
    this.flightApi = new FlightApi();
    this.packageApi = new PackageApi();
    this.priceTracker = new PriceTracker();
    this.notifier = new Notifier();
    this.airportData = new AirportData();
    this.isRunning = false;
    
    // Configuration options
    this.config = {
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
      // Package options
      includePackages: true,
      hotelRating: 3,
      hotelRatings: [3], // Array to support multiple ratings
      rooms: 1
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Configuration updated:', this.config);
  }

  async checkFlights() {
    if (this.isRunning) {
      console.log('⏳ Flight check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      const originCountry = this.airportData.getCountryByCode(this.config.originCountry);
      const destCountry = this.airportData.getCountryByCode(this.config.destinationCountry);
      
      console.log('\n🔍 Searching for flights...');
      console.log(`📍 Route: ${originCountry?.name || this.config.origin} → ${destCountry?.name || this.config.destination}`);
      console.log(`✈️ Airports: ${this.config.origin} → ${this.config.destination}`);
      console.log(`👥 Passengers: ${this.config.adults} adult(s), ${this.config.children} child(ren), ${this.config.infants} infant(s)`);
      console.log(`💺 Class: ${this.config.cabinClass}`);
      if (this.config.departureDate) console.log(`📅 Departure: ${this.config.departureDate}`);
      if (this.config.returnDate) console.log(`📅 Return: ${this.config.returnDate}`);
      
      let allResults = [];
      
      // Search for flights
      const flights = await this.flightApi.searchFlights(
        this.config.origin,
        this.config.destination,
        this.config.departureDate,
        this.config.returnDate,
        this.config.adults,
        this.config.children,
        this.config.infants,
        this.config.cabinClass
      );

      if (flights && flights.length > 0) {
        allResults = [...flights.map(f => ({ ...f, type: 'flight' }))];
      }

      // Search for packages if enabled
      if (this.config.includePackages && this.config.returnDate) {
        const ratingsText = this.config.hotelRatings.length > 1 ? 
          `${this.config.hotelRatings.join('⭐ & ')}⭐` : 
          `${this.config.hotelRatings[0]}⭐`;
        console.log(`🏨 Also searching for ${ratingsText} package deals...`);
        
        const packages = await this.packageApi.searchMultipleRatingPackages(
          this.config.origin,
          this.config.destination,
          this.config.departureDate,
          this.config.returnDate,
          this.config.adults,
          this.config.children,
          this.config.rooms,
          this.config.hotelRatings
        );

        if (packages && packages.length > 0) {
          allResults = [...allResults, ...packages];
        }
      }

      if (allResults.length === 0) {
        console.log('❌ No flights or packages found');
        return;
      }

      // Sort all results by price for comparison
      allResults.sort((a, b) => (a.totalPrice || a.price) - (b.totalPrice || b.price));

      const analysis = await this.priceTracker.analyzeFlights(allResults);
      
      if (analysis) {
        await this.notifier.sendPriceAlert(analysis);
        this.notifier.logFlightUpdate(allResults, analysis);
      }

    } catch (error) {
      console.error('❌ Error checking flights:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    console.log('🚀 Flight Tracker Started!');
    console.log('📊 Checking flights every 5 minutes...');
    console.log('🔔 You\'ll receive notifications for price drops\n');

    // Check flights immediately
    this.checkFlights();

    // Schedule checks every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkFlights();
    });

    // Daily summary at 9 AM
    cron.schedule('0 9 * * *', async () => {
      const stats = await this.priceTracker.getStats();
      await this.notifier.sendDailyReport(stats);
    });

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Flight Tracker stopped');
      process.exit(0);
    });
  }

  async getStats() {
    return await this.priceTracker.getStats();
  }

  // Interactive configuration methods
  setPassengers(adults = 1, children = 0, infants = 0) {
    this.updateConfig({ adults, children, infants });
  }

  setCabinClass(cabinClass) {
    const validClasses = ['economy', 'premium_economy', 'business', 'first'];
    if (!validClasses.includes(cabinClass.toLowerCase())) {
      console.log(`❌ Invalid cabin class. Valid options: ${validClasses.join(', ')}`);
      return false;
    }
    this.updateConfig({ cabinClass: cabinClass.toLowerCase() });
    return true;
  }

  setRoute(origin, destination) {
    this.updateConfig({ origin, destination });
  }

  setCountries(originCountry, destinationCountry) {
    const originAirport = this.airportData.getPrimaryAirportForCountry(originCountry);
    const destAirport = this.airportData.getPrimaryAirportForCountry(destinationCountry);
    
    if (!originAirport) {
      console.log(`❌ Unknown origin country: ${originCountry}`);
      return false;
    }
    if (!destAirport) {
      console.log(`❌ Unknown destination country: ${destinationCountry}`);
      return false;
    }
    
    this.updateConfig({ 
      originCountry: originCountry.toLowerCase(), 
      destinationCountry: destinationCountry.toLowerCase(),
      origin: originAirport.code,
      destination: destAirport.code
    });
    return true;
  }

  setDates(departureDate, returnDate = null) {
    const depValidation = this.airportData.validateDate(departureDate);
    if (!depValidation.valid) {
      console.log(`❌ Invalid departure date: ${depValidation.error}`);
      return false;
    }
    
    let retValidation = { valid: true };
    if (returnDate) {
      retValidation = this.airportData.validateDate(returnDate);
      if (!retValidation.valid) {
        console.log(`❌ Invalid return date: ${retValidation.error}`);
        return false;
      }
      
      if (new Date(returnDate) <= new Date(departureDate)) {
        console.log(`❌ Return date must be after departure date`);
        return false;
      }
    }
    
    this.updateConfig({ 
      departureDate: depValidation.date, 
      returnDate: retValidation.date || null 
    });
    return true;
  }

  listCountries() {
    const countries = this.airportData.getCountries();
    console.log('\n🌍 Available Countries:');
    countries.forEach(country => {
      const primaryAirport = country.airports.find(a => a.primary) || country.airports[0];
      console.log(`  ${country.code.padEnd(12)} - ${country.name} (${primaryAirport.code} - ${primaryAirport.city})`);
    });
  }

  showCountryAirports(countryCode) {
    const airports = this.airportData.getAllAirportsForCountry(countryCode);
    const country = this.airportData.getCountryByCode(countryCode);
    
    if (!airports.length) {
      console.log(`❌ Unknown country: ${countryCode}`);
      return;
    }
    
    console.log(`\n✈️ ${country.name} Airports:`);
    airports.forEach(airport => {
      const marker = airport.primary ? ' ⭐' : '';
      console.log(`  ${airport.code} - ${airport.name} (${airport.city})${marker}`);
    });
  }

  // Package-related configuration methods
  setPackageOptions(includePackages = true, hotelRatings = [3], rooms = 1) {
    // Accept single rating or array of ratings
    if (typeof hotelRatings === 'number') {
      hotelRatings = [hotelRatings];
    }
    
    // Validate ratings
    if (!hotelRatings.every(rating => rating >= 3 && rating <= 5)) {
      console.log(`❌ Invalid hotel rating. Use 3, 4, or 5 stars`);
      return false;
    }
    
    // Keep backward compatibility with single hotelRating
    const hotelRating = hotelRatings[0];
    this.updateConfig({ includePackages, hotelRating, hotelRatings, rooms });
    return true;
  }

  enablePackages(hotelRatings = [3], rooms = 1) {
    return this.setPackageOptions(true, hotelRatings, rooms);
  }

  disablePackages() {
    this.updateConfig({ includePackages: false });
  }

  setHotelRatings(ratings) {
    if (typeof ratings === 'string') {
      // Parse "4,5" or "4-5" format
      if (ratings.includes(',')) {
        ratings = ratings.split(',').map(r => parseInt(r.trim()));
      } else if (ratings.includes('-')) {
        const [start, end] = ratings.split('-').map(r => parseInt(r.trim()));
        ratings = [];
        for (let i = start; i <= end; i++) {
          ratings.push(i);
        }
      } else {
        ratings = [parseInt(ratings)];
      }
    } else if (typeof ratings === 'number') {
      ratings = [ratings];
    }
    
    return this.setPackageOptions(this.config.includePackages, ratings, this.config.rooms);
  }
}

// CLI interface
if (require.main === module) {
  const tracker = new FlightTracker();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--adults':
        tracker.setPassengers(parseInt(args[++i]) || 1);
        break;
      case '--children':
        tracker.setPassengers(tracker.config.adults, parseInt(args[++i]) || 0);
        break;
      case '--infants':
        tracker.setPassengers(tracker.config.adults, tracker.config.children, parseInt(args[++i]) || 0);
        break;
      case '--class':
        tracker.setCabinClass(args[++i]);
        break;
      case '--from':
        tracker.setCountries(args[++i], tracker.config.destinationCountry);
        break;
      case '--to':
        tracker.setCountries(tracker.config.originCountry, args[++i]);
        break;
      case '--origin':
        tracker.setRoute(args[++i], tracker.config.destination);
        break;
      case '--destination':
        tracker.setRoute(tracker.config.origin, args[++i]);
        break;
      case '--departure':
        tracker.setDates(args[++i], tracker.config.returnDate);
        break;
      case '--return':
        tracker.setDates(tracker.config.departureDate, args[++i]);
        break;
      case '--countries':
        tracker.listCountries();
        process.exit(0);
      case '--airports':
        tracker.showCountryAirports(args[++i]);
        process.exit(0);
      case '--packages':
        tracker.enablePackages();
        break;
      case '--no-packages':
        tracker.disablePackages();
        break;
      case '--hotel-rating':
        const ratingInput = args[++i];
        tracker.setHotelRatings(ratingInput);
        break;
      case '--rooms':
        const rooms = parseInt(args[++i]);
        tracker.setPackageOptions(tracker.config.includePackages, tracker.config.hotelRating, rooms);
        break;
      case '--help':
        console.log(`
Flight Tracker - Monitor flight prices and get alerts

Usage: node src/index.js [options]

Country & Route Options:
  --from <country>         Origin country (e.g., uk, usa, france)
  --to <country>           Destination country (e.g., maldives, japan, thailand)
  --origin <code>          Origin airport code (overrides --from)
  --destination <code>     Destination airport code (overrides --to)
  --countries              List all available countries
  --airports <country>     Show airports for a specific country

Passenger Options:
  --adults <number>        Number of adult passengers (default: 1)
  --children <number>      Number of child passengers (default: 0)  
  --infants <number>       Number of infant passengers (default: 0)
  --class <class>          Cabin class: economy, premium_economy, business, first (default: economy)

Date Options:
  --departure <date>       Departure date (YYYY-MM-DD format)
  --return <date>          Return date (YYYY-MM-DD format, optional)

Package Options:
  --packages               Enable package deals search (default: on)
  --no-packages            Disable package deals, search flights only
  --hotel-rating <rating>  Hotel rating: 3, 4, 5 or ranges like "4,5" or "4-5" (default: 3)
  --rooms <number>         Number of hotel rooms needed (default: 1)

Other Options:
  --help                   Show this help message

Examples:
  node src/index.js --from uk --to japan --departure 2025-08-15
  node src/index.js --from usa --to thailand --adults 2 --class business --hotel-rating 4
  node src/index.js --from france --to maldives --adults 2 --children 1 --departure 2025-06-15 --return 2025-06-25 --rooms 2
  node src/index.js --from uk --to maldives --hotel-rating "4,5" (4 & 5 star hotels)
  node src/index.js --from uk --to maldives --hotel-rating "4-5" (4 & 5 star hotels)
  node src/index.js --from uk --to maldives --no-packages (flights only)
  node src/index.js --countries
  node src/index.js --airports usa
        `);
        process.exit(0);
    }
  }

  tracker.start();
}

module.exports = FlightTracker;