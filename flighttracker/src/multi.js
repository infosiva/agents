const MultiTripTracker = require('./multiTripTracker');

// Create multi-trip tracker instance
const tracker = new MultiTripTracker();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Multi-Trip Flight Tracker - Monitor multiple trips simultaneously

Usage: node src/multi.js [command] [options]

Commands:
  add <trip-id> [options]    Add a new trip to monitor
  remove <trip-id>           Remove a trip from monitoring
  list                       List all configured trips
  enable <trip-id>           Enable monitoring for a trip
  disable <trip-id>          Disable monitoring for a trip
  start                      Start monitoring all enabled trips

Trip Configuration Options:
  --from <country>           Origin country (e.g., uk, usa, france)
  --to <country>             Destination country (e.g., maldives, japan, thailand)
  --origin <code>            Origin airport code (overrides --from)
  --destination <code>       Destination airport code (overrides --to)
  --departure <date>         Departure date (YYYY-MM-DD format)
  --return <date>            Return date (YYYY-MM-DD format, optional)
  --adults <number>          Number of adult passengers (default: 1)
  --children <number>        Number of child passengers (default: 0)
  --infants <number>         Number of infant passengers (default: 0)
  --class <class>            Cabin class: economy, premium_economy, business, first (default: economy)
  --hotel-rating <rating>    Hotel rating: 3, 4, 5 or ranges like "4,5" or "4-5" (default: 3)
  --rooms <number>           Number of hotel rooms needed (default: 1)
  --no-packages              Disable package deals, search flights only

Examples:
  # Add trips
  node src/multi.js add "mauritius-family" --from uk --to mauritius --departure 2025-08-01 --return 2025-08-05 --adults 2 --children 2 --hotel-rating "4,5"
  node src/multi.js add "spain-weekend" --from uk --to spain --departure 2025-07-15 --return 2025-07-17 --adults 2 --class business
  node src/multi.js add "japan-solo" --from uk --to japan --departure 2025-09-01 --adults 1 --no-packages

  # Manage trips
  node src/multi.js list
  node src/multi.js disable "spain-weekend"
  node src/multi.js remove "japan-solo"
  
  # Start monitoring
  node src/multi.js start
`);
  process.exit(0);
}

const command = args[0];

function parseConfig(args) {
  const config = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--from':
        const fromCountry = args[++i];
        const originAirport = tracker.airportData.getPrimaryAirportForCountry(fromCountry);
        if (originAirport) {
          config.originCountry = fromCountry.toLowerCase();
          config.origin = originAirport.code;
        }
        break;
      case '--to':
        const toCountry = args[++i];
        const destAirport = tracker.airportData.getPrimaryAirportForCountry(toCountry);
        if (destAirport) {
          config.destinationCountry = toCountry.toLowerCase();
          config.destination = destAirport.code;
        }
        break;
      case '--origin':
        const originCode = args[++i];
        if (originCode) {
          config.origin = originCode.toUpperCase();
        }
        break;
      case '--destination':
        const destCode = args[++i];
        if (destCode) {
          config.destination = destCode.toUpperCase();
        }
        break;
      case '--departure':
        config.departureDate = args[++i];
        break;
      case '--return':
        config.returnDate = args[++i];
        break;
      case '--adults':
        config.adults = parseInt(args[++i]) || 1;
        break;
      case '--children':
        config.children = parseInt(args[++i]) || 0;
        break;
      case '--infants':
        config.infants = parseInt(args[++i]) || 0;
        break;
      case '--class':
        config.cabinClass = args[++i];
        break;
      case '--hotel-rating':
        const ratingInput = args[++i];
        let ratings;
        if (ratingInput.includes(',')) {
          ratings = ratingInput.split(',').map(r => parseInt(r.trim()));
        } else if (ratingInput.includes('-')) {
          const [start, end] = ratingInput.split('-').map(r => parseInt(r.trim()));
          ratings = [];
          for (let j = start; j <= end; j++) {
            ratings.push(j);
          }
        } else {
          ratings = [parseInt(ratingInput)];
        }
        config.hotelRating = ratings[0];
        config.hotelRatings = ratings;
        break;
      case '--rooms':
        config.rooms = parseInt(args[++i]) || 1;
        break;
      case '--no-packages':
        config.includePackages = false;
        break;
    }
  }
  
  return config;
}

switch (command) {
  case 'add':
    if (args.length < 2) {
      console.log('❌ Trip ID required. Usage: node src/multi.js add <trip-id> [options]');
      process.exit(1);
    }
    const tripId = args[1];
    const config = parseConfig(args.slice(2));
    
    if (!config.origin || !config.destination) {
      console.log('❌ Origin and destination required (use --from/--to or --origin/--destination)');
      console.log('Current config:', config);
      process.exit(1);
    }
    
    tracker.addTrip(tripId, config);
    console.log('💡 Use "node src/multi.js start" to begin monitoring all trips');
    break;

  case 'remove':
    if (args.length < 2) {
      console.log('❌ Trip ID required. Usage: node src/multi.js remove <trip-id>');
      process.exit(1);
    }
    tracker.removeTrip(args[1]);
    break;

  case 'list':
    tracker.listTrips();
    break;

  case 'enable':
    if (args.length < 2) {
      console.log('❌ Trip ID required. Usage: node src/multi.js enable <trip-id>');
      process.exit(1);
    }
    tracker.enableTrip(args[1]);
    break;

  case 'disable':
    if (args.length < 2) {
      console.log('❌ Trip ID required. Usage: node src/multi.js disable <trip-id>');
      process.exit(1);
    }
    tracker.disableTrip(args[1]);
    break;

  case 'start':
    tracker.start();
    break;

  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log('Use "node src/multi.js" to see usage instructions');
    process.exit(1);
}