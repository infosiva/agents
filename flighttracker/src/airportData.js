class AirportData {
  constructor() {
    this.countryAirports = {
      // Popular destinations
      'uk': {
        name: 'United Kingdom',
        airports: [
          { code: 'LHR', name: 'London Heathrow', city: 'London', primary: true },
          { code: 'LGW', name: 'London Gatwick', city: 'London' },
          { code: 'STN', name: 'London Stansted', city: 'London' },
          { code: 'LTN', name: 'London Luton', city: 'London' },
          { code: 'MAN', name: 'Manchester Airport', city: 'Manchester' },
          { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh' },
          { code: 'BHX', name: 'Birmingham Airport', city: 'Birmingham' }
        ]
      },
      'maldives': {
        name: 'Maldives',
        airports: [
          { code: 'MLE', name: 'Velana International Airport', city: 'Malé', primary: true }
        ]
      },
      'usa': {
        name: 'United States',
        airports: [
          { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', primary: true },
          { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', primary: true },
          { code: 'ORD', name: 'Chicago O\'Hare International', city: 'Chicago', primary: true },
          { code: 'MIA', name: 'Miami International', city: 'Miami' },
          { code: 'SFO', name: 'San Francisco International', city: 'San Francisco' },
          { code: 'LAS', name: 'McCarran International', city: 'Las Vegas' },
          { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle' }
        ]
      },
      'japan': {
        name: 'Japan',
        airports: [
          { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', primary: true },
          { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', primary: true },
          { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka' },
          { code: 'NGO', name: 'Chubu Centrair International', city: 'Nagoya' }
        ]
      },
      'thailand': {
        name: 'Thailand',
        airports: [
          { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', primary: true },
          { code: 'DMK', name: 'Don Mueang International', city: 'Bangkok' },
          { code: 'HKT', name: 'Phuket International', city: 'Phuket' },
          { code: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai' }
        ]
      },
      'australia': {
        name: 'Australia',
        airports: [
          { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', primary: true },
          { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', primary: true },
          { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane' },
          { code: 'PER', name: 'Perth Airport', city: 'Perth' }
        ]
      },
      'france': {
        name: 'France',
        airports: [
          { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', primary: true },
          { code: 'ORY', name: 'Orly Airport', city: 'Paris' },
          { code: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice' },
          { code: 'LYS', name: 'Lyon-Saint Exupéry Airport', city: 'Lyon' }
        ]
      },
      'germany': {
        name: 'Germany',
        airports: [
          { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', primary: true },
          { code: 'MUC', name: 'Munich Airport', city: 'Munich', primary: true },
          { code: 'TXL', name: 'Berlin Tegel Airport', city: 'Berlin' },
          { code: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf' }
        ]
      },
      'italy': {
        name: 'Italy',
        airports: [
          { code: 'FCO', name: 'Leonardo da Vinci Airport', city: 'Rome', primary: true },
          { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', primary: true },
          { code: 'NAP', name: 'Naples International', city: 'Naples' },
          { code: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice' }
        ]
      },
      'spain': {
        name: 'Spain',
        airports: [
          { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', primary: true },
          { code: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', primary: true },
          { code: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma' },
          { code: 'LPA', name: 'Las Palmas Airport', city: 'Las Palmas' }
        ]
      },
      'uae': {
        name: 'United Arab Emirates',
        airports: [
          { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', primary: true },
          { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', primary: true }
        ]
      },
      'singapore': {
        name: 'Singapore',
        airports: [
          { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', primary: true }
        ]
      },
      'india': {
        name: 'India',
        airports: [
          { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', primary: true },
          { code: 'BOM', name: 'Chhatrapati Shivaji International', city: 'Mumbai', primary: true },
          { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore' },
          { code: 'MAA', name: 'Chennai International', city: 'Chennai' }
        ]
      },
      'canada': {
        name: 'Canada',
        airports: [
          { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', primary: true },
          { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', primary: true },
          { code: 'YUL', name: 'Montréal-Pierre Elliott Trudeau', city: 'Montreal' }
        ]
      },
      'brazil': {
        name: 'Brazil',
        airports: [
          { code: 'GRU', name: 'São Paulo-Guarulhos International', city: 'São Paulo', primary: true },
          { code: 'GIG', name: 'Rio de Janeiro-Galeão International', city: 'Rio de Janeiro', primary: true },
          { code: 'BSB', name: 'Brasília International Airport', city: 'Brasília' }
        ]
      }
    };
  }

  getCountries() {
    return Object.keys(this.countryAirports).map(key => ({
      code: key,
      name: this.countryAirports[key].name,
      airports: this.countryAirports[key].airports
    }));
  }

  getCountryByCode(countryCode) {
    const country = this.countryAirports[countryCode.toLowerCase()];
    return country || null;
  }

  getPrimaryAirportForCountry(countryCode) {
    const country = this.getCountryByCode(countryCode);
    if (!country) return null;
    
    const primaryAirport = country.airports.find(airport => airport.primary);
    return primaryAirport || country.airports[0];
  }

  getAllAirportsForCountry(countryCode) {
    const country = this.getCountryByCode(countryCode);
    return country ? country.airports : [];
  }

  findCountryByAirport(airportCode) {
    for (const [countryCode, countryData] of Object.entries(this.countryAirports)) {
      const airport = countryData.airports.find(a => a.code === airportCode.toUpperCase());
      if (airport) {
        return {
          countryCode,
          countryName: countryData.name,
          airport
        };
      }
    }
    return null;
  }

  searchCountries(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.getCountries().filter(country => 
      country.name.toLowerCase().includes(term) ||
      country.code.includes(term) ||
      country.airports.some(airport => 
        airport.name.toLowerCase().includes(term) ||
        airport.city.toLowerCase().includes(term) ||
        airport.code.toLowerCase().includes(term)
      )
    );
  }

  validateDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }
    
    if (date < today) {
      return { valid: false, error: 'Date cannot be in the past' };
    }
    
    return { valid: true, date: date.toISOString().split('T')[0] };
  }
}

module.exports = AirportData;