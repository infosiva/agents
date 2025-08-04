const axios = require('axios');

class PackageApi {
  constructor() {
    this.baseUrl = 'https://booking-com.p.rapidapi.com/v1';
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
  }

  async searchPackages(origin, destination, departureDate, returnDate, adults = 1, children = 0, rooms = 1, hotelRating = 3) {
    try {
      // For now, using mock data since package APIs are complex and expensive
      return this.getMockPackageData(origin, destination, departureDate, returnDate, adults, children, rooms, hotelRating);
      
      // Real API implementation would look like:
      /*
      const [flightData, hotelData] = await Promise.all([
        this.searchFlights(origin, destination, departureDate, returnDate, adults, children),
        this.searchHotels(destination, departureDate, returnDate, adults, children, rooms)
      ]);
      
      return this.combinePackages(flightData, hotelData);
      */
    } catch (error) {
      console.error('Package API Error:', error.message);
      return this.getMockPackageData(origin, destination, departureDate, returnDate, adults, children, rooms, hotelRating);
    }
  }

  async searchMultipleRatingPackages(origin, destination, departureDate, returnDate, adults = 1, children = 0, rooms = 1, ratings = [3, 4, 5]) {
    try {
      const allPackages = [];
      
      for (const rating of ratings) {
        const packages = await this.getMockPackageData(origin, destination, departureDate, returnDate, adults, children, rooms, rating);
        allPackages.push(...packages);
      }
      
      // Sort by price and return
      return allPackages.sort((a, b) => a.totalPrice - b.totalPrice);
    } catch (error) {
      console.error('Package API Error:', error.message);
      return [];
    }
  }

  getMockPackageData(origin, destination, departureDate, returnDate, adults, children, rooms, hotelRating) {
    const airlines = ['British Airways', 'Emirates', 'Qatar Airways', 'Virgin Atlantic', 'Turkish Airlines'];
    const hotelCategories = {
      3: { names: ['Paradise Resort', 'Ocean View Hotel', 'Beach Comfort Inn'], multiplier: 1 },
      4: { names: ['Grand Paradise Resort', 'Luxury Ocean Hotel', 'Premium Beach Resort'], multiplier: 1.5 },
      5: { names: ['Ultra Luxury Resort', 'Presidential Ocean Villa', 'Five Star Paradise'], multiplier: 2.5 }
    };
    
    const baseFlightPrice = 450 * (adults + children * 0.75);
    const baseHotelPrice = 150 * rooms * this.calculateNights(departureDate, returnDate);
    const hotels = hotelCategories[hotelRating] || hotelCategories[3];
    
    return Array.from({length: 5}, (_, i) => {
      const flightPrice = baseFlightPrice + Math.floor(Math.random() * 200) - 100;
      const hotelPrice = baseHotelPrice * hotels.multiplier + Math.floor(Math.random() * 300) - 150;
      const totalPrice = flightPrice + hotelPrice;
      const savings = Math.floor(Math.random() * 200) + 50; // Mock savings vs booking separately
      
      return {
        id: `package-${i}`,
        type: 'package',
        totalPrice: totalPrice - savings,
        originalPrice: totalPrice,
        savings: savings,
        currency: 'GBP',
        
        // Flight details
        flight: {
          airline: airlines[Math.floor(Math.random() * airlines.length)],
          price: flightPrice,
          departureTime: new Date(departureDate || Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          returnTime: returnDate ? new Date(returnDate).toISOString() : null,
          duration: 480 + Math.floor(Math.random() * 240),
          stops: Math.floor(Math.random() * 3)
        },
        
        // Hotel details
        hotel: {
          name: hotels.names[Math.floor(Math.random() * hotels.names.length)],
          price: hotelPrice,
          rating: hotelRating,
          pricePerNight: Math.floor(hotelPrice / this.calculateNights(departureDate, returnDate)),
          amenities: this.getAmenities(hotelRating),
          location: this.getHotelLocation(destination),
          rooms: rooms
        },
        
        // Package details
        packageProvider: ['Expedia', 'Booking.com', 'TravelCity', 'PackageDeals'][Math.floor(Math.random() * 4)],
        deepLink: `https://example.com/book-package-${i}`,
        included: ['Flights', 'Hotel', 'Taxes', hotelRating >= 4 ? 'Breakfast' : null, hotelRating >= 5 ? 'Airport Transfer' : null].filter(Boolean)
      };
    });
  }

  calculateNights(departureDate, returnDate) {
    if (!departureDate || !returnDate) return 7; // Default 7 nights
    
    const dep = new Date(departureDate);
    const ret = new Date(returnDate);
    const nights = Math.ceil((ret - dep) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  }

  getAmenities(rating) {
    const baseAmenities = ['WiFi', 'Pool', 'Restaurant'];
    const fourStarAmenities = [...baseAmenities, 'Spa', 'Beach Access', 'Room Service'];
    const fiveStarAmenities = [...fourStarAmenities, 'Butler Service', 'Private Beach', 'Fine Dining', 'Concierge'];
    
    switch (rating) {
      case 5: return fiveStarAmenities;
      case 4: return fourStarAmenities;
      default: return baseAmenities;
    }
  }

  getHotelLocation(destination) {
    const locations = {
      'MLE': ['Malé City Center', 'Hulhumalé', 'Airport Island', 'Vilimalé'],
      'NRT': ['Narita', 'Tokyo Bay', 'Shibuya', 'Ginza'],
      'BKK': ['Sukhumvit', 'Silom', 'Siam', 'Khao San Road'],
      'DXB': ['Dubai Marina', 'Downtown Dubai', 'Jumeirah Beach', 'Business Bay'],
      'SIN': ['Marina Bay', 'Orchard Road', 'Sentosa Island', 'Chinatown']
    };
    
    const destLocations = locations[destination] || ['City Center', 'Beach Area', 'Tourist District'];
    return destLocations[Math.floor(Math.random() * destLocations.length)];
  }

  async searchHotelsOnly(destination, checkIn, checkOut, adults, children, rooms = 1, minRating = 3) {
    // Mock hotel-only search for comparison
    return this.getMockHotelData(destination, checkIn, checkOut, adults, children, rooms, minRating);
  }

  getMockHotelData(destination, checkIn, checkOut, adults, children, rooms, minRating) {
    const nights = this.calculateNights(checkIn, checkOut);
    const hotelCategories = {
      3: { names: ['Paradise Resort', 'Ocean View Hotel', 'Beach Comfort Inn'], multiplier: 1 },
      4: { names: ['Grand Paradise Resort', 'Luxury Ocean Hotel', 'Premium Beach Resort'], multiplier: 1.5 },
      5: { names: ['Ultra Luxury Resort', 'Presidential Ocean Villa', 'Five Star Paradise'], multiplier: 2.5 }
    };
    
    const basePrice = 150 * rooms * nights;
    
    return Array.from({length: 3}, (_, i) => {
      const rating = Math.max(minRating, Math.floor(Math.random() * 3) + 3);
      const hotels = hotelCategories[rating];
      const totalPrice = basePrice * hotels.multiplier + Math.floor(Math.random() * 200) - 100;
      
      return {
        name: hotels.names[Math.floor(Math.random() * hotels.names.length)],
        rating: rating,
        pricePerNight: Math.floor(totalPrice / nights),
        totalPrice: totalPrice,
        location: this.getHotelLocation(destination),
        amenities: this.getAmenities(rating),
        rooms: rooms
      };
    });
  }
}

module.exports = PackageApi;