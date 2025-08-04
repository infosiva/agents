const MultiTripTracker = require('./src/multiTripTracker');

// Create multi-trip tracker
const tracker = new MultiTripTracker();

console.log('🚀 Setting up your previous trip searches...\n');

// Add all your past trip searches
console.log('Adding UK → Mauritius (Family Trip - 5 days)...');
tracker.addTrip('uk-mauritius', {
  origin: 'LHR',
  destination: 'MRU',
  departureDate: '2025-08-01',
  returnDate: '2025-08-06',
  adults: 2,
  children: 2,
  cabinClass: 'economy',
  hotelRating: 4,
  hotelRatings: [4, 5],
  rooms: 2,
  includePackages: true
});

console.log('Adding UK → Maldives (Family Trip - 5 days)...');
tracker.addTrip('uk-maldives', {
  originCountry: 'uk',
  destinationCountry: 'maldives',
  origin: 'LHR',
  destination: 'MLE',
  departureDate: '2025-08-01',
  returnDate: '2025-08-06',
  adults: 2,
  children: 2,
  cabinClass: 'economy',
  hotelRating: 4,
  hotelRatings: [4, 5],
  rooms: 2,
  includePackages: true
});

console.log('Adding UK → Spain (Family Trip - 5 days)...');
tracker.addTrip('uk-spain', {
  originCountry: 'uk',
  destinationCountry: 'spain',
  origin: 'LHR',
  destination: 'MAD',
  departureDate: '2025-08-01',
  returnDate: '2025-08-06',
  adults: 2,
  children: 2,
  cabinClass: 'economy',
  hotelRating: 3,
  hotelRatings: [3],
  rooms: 2,
  includePackages: true
});

console.log('\n📋 All trips added! Here\'s your setup:');
tracker.listTrips();

console.log('\n🚀 Starting monitoring for all trips...');
tracker.start();