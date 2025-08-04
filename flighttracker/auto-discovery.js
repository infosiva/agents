const MultiTripTracker = require('./src/multiTripTracker');
const fs = require('fs');
const path = require('path');

class AutoFlightDiscovery {
    constructor() {
        this.tracker = new MultiTripTracker();
        this.discoveredDeals = [];
        this.dealsFile = './data/discovered-deals.json';
        this.settingsFile = './data/discovery-settings.json';
        this.isRunning = false;
        this.settings = this.loadSettings();
        this.searchConfigs = this.getSearchConfigs();
        this.loadDiscoveredDeals();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFile)) {
                const data = fs.readFileSync(this.settingsFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading settings:', error.message);
        }
        
        // Default settings
        return {
            travelers: {
                adults: 2,
                children: 2,
                infants: 0,
                rooms: 2
            },
            dates: {
                startDate: '2025-08-01',
                endDate: '2025-08-31',
                duration: 5
            },
            budget: {
                perPerson: 600,
                cabinClass: 'economy',
                searchType: 'flights'
            },
            destinations: ['cyprus', 'malta', 'crete', 'athens', 'tenerife', 'grancanaria', 'lanzarote', 'antalya', 'istanbul', 'morocco', 'egypt'],
            airports: ['LHR', 'LGW', 'MAN']
        };
    }

    saveSettings(newSettings) {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            
            this.settings = { ...this.settings, ...newSettings };
            fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
            
            // Regenerate search configs with new settings
            this.searchConfigs = this.getSearchConfigs();
            
            console.log('✅ Settings updated successfully');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error.message);
            return false;
        }
    }

    getSearchConfigs() {
        // Destination mapping based on settings
        const destinationMap = {
            'cyprus': { name: 'Cyprus', dest: 'LCA' },
            'malta': { name: 'Malta', dest: 'MLA' },
            'crete': { name: 'Greece Crete', dest: 'HER' },
            'athens': { name: 'Greece Athens', dest: 'ATH' },
            'tenerife': { name: 'Tenerife', dest: 'TFS' },
            'grancanaria': { name: 'Gran Canaria', dest: 'LPA' },
            'lanzarote': { name: 'Lanzarote', dest: 'ACE' },
            'antalya': { name: 'Turkey Antalya', dest: 'AYT' },
            'istanbul': { name: 'Turkey Istanbul', dest: 'IST' },
            'morocco': { name: 'Morocco', dest: 'CMN' },
            'egypt': { name: 'Egypt Hurghada', dest: 'HRG' }
        };

        // Calculate total budget based on travelers
        const totalBudget = (this.settings.travelers.adults * this.settings.budget.perPerson) + 
                           (this.settings.travelers.children * this.settings.budget.perPerson * 0.75);

        const dates = this.generateDateRanges();
        const configs = [];

        // Generate configs for each combination of airport, destination, and date
        this.settings.airports.forEach(airport => {
            this.settings.destinations.forEach(destKey => {
                if (destinationMap[destKey]) {
                    const destination = destinationMap[destKey];
                    dates.forEach(dateRange => {
                        configs.push({
                            id: `auto-${destKey}-${airport}-${dateRange.start}`,
                            name: `${destination.name} from ${airport}`,
                            origin: airport,
                            destination: destination.dest,
                            departureDate: dateRange.start,
                            returnDate: dateRange.end,
                            adults: this.settings.travelers.adults,
                            children: this.settings.travelers.children,
                            cabinClass: this.settings.budget.cabinClass,
                            includePackages: this.settings.budget.searchType === 'packages',
                            budget: Math.round(totalBudget),
                            destinationName: destination.name
                        });
                    });
                }
            });
        });

        console.log(`🎯 Generated ${configs.length} search configurations`);
        console.log(`👥 Travelers: ${this.settings.travelers.adults} adults + ${this.settings.travelers.children} children`);
        console.log(`💰 Budget: £${Math.round(totalBudget)} total`);
        console.log(`📅 Trip length: ${this.settings.dates.duration} days`);

        return configs;
    }

    generateDateRanges() {
        const dates = [];
        const startDate = new Date(this.settings.dates.startDate);
        const endDate = new Date(this.settings.dates.endDate);
        const duration = this.settings.dates.duration;
        
        // Generate date ranges throughout the period
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const departureDate = currentDate.toISOString().split('T')[0];
            const returnDate = new Date(currentDate);
            returnDate.setDate(returnDate.getDate() + duration);
            
            // Make sure return date doesn't exceed end date
            if (returnDate <= endDate) {
                dates.push({
                    start: departureDate,
                    end: returnDate.toISOString().split('T')[0]
                });
            }
            
            // Move to next potential departure (every 3-4 days for variety)
            currentDate.setDate(currentDate.getDate() + 3);
        }

        console.log(`📅 Generated ${dates.length} date combinations for ${duration}-day trips`);
        return dates;
    }

    loadDiscoveredDeals() {
        try {
            if (fs.existsSync(this.dealsFile)) {
                const data = fs.readFileSync(this.dealsFile, 'utf8');
                this.discoveredDeals = JSON.parse(data);
                console.log(`📊 Loaded ${this.discoveredDeals.length} previously discovered deals`);
            }
        } catch (error) {
            console.error('Error loading discovered deals:', error.message);
            this.discoveredDeals = [];
        }
    }

    saveDiscoveredDeals() {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            fs.writeFileSync(this.dealsFile, JSON.stringify(this.discoveredDeals, null, 2));
        } catch (error) {
            console.error('Error saving discovered deals:', error.message);
        }
    }

    async startAutoDiscovery() {
        if (this.isRunning) {
            console.log('🔄 Auto-discovery already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting automatic flight discovery...');
        console.log(`🎯 Searching ${this.searchConfigs.length} flight combinations`);
        console.log('💰 Looking for deals under £1500-£1700 for family of 4');
        console.log('📊 Results will be available at http://localhost:3000/deals\n');

        // Run continuous discovery
        this.runDiscoveryLoop();
    }

    async runDiscoveryLoop() {
        let configIndex = 0;
        
        while (this.isRunning) {
            try {
                const config = this.searchConfigs[configIndex];
                
                console.log(`🔍 Searching: ${config.name} (${config.departureDate} → ${config.returnDate})`);
                
                // Add temporary trip for search
                this.tracker.addTrip(config.id, {
                    origin: config.origin,
                    destination: config.destination,
                    departureDate: config.departureDate,
                    returnDate: config.returnDate,
                    adults: config.adults,
                    children: config.children,
                    cabinClass: config.cabinClass,
                    includePackages: config.includePackages,
                    enabled: true
                });

                // Perform search
                await this.tracker.checkTrip(config.id);
                
                // Get results and check for good deals
                const trip = this.tracker.trips.get(config.id);
                if (trip && trip.lastResult) {
                    await this.processTripResult(config, trip.lastResult);
                }

                // Clean up
                this.tracker.removeTrip(config.id);
                
                // Move to next config
                configIndex = (configIndex + 1) % this.searchConfigs.length;
                
                // Wait before next search (10 seconds)
                await new Promise(resolve => setTimeout(resolve, 10000));
                
            } catch (error) {
                console.error(`❌ Error in discovery loop:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async processTripResult(config, result) {
        if (!result.flights || result.flights.length === 0) return;

        const cheapestFlight = result.flights[0]; // Flights are sorted by price
        
        // Check if this is a good deal (under budget)
        if (cheapestFlight.price <= config.budget) {
            const deal = {
                id: `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                destination: config.destinationName,
                origin: config.origin,
                destinationCode: config.destination,
                price: cheapestFlight.price,
                airline: cheapestFlight.airline,
                departureDate: config.departureDate,
                returnDate: config.returnDate,
                duration: this.calculateDuration(config.departureDate, config.returnDate),
                budget: config.budget,
                savings: config.budget - cheapestFlight.price,
                passengers: `${config.adults} adults + ${config.children} children`,
                flightDetails: {
                    departureTime: cheapestFlight.departureTime,
                    arrivalTime: cheapestFlight.arrivalTime,
                    duration: cheapestFlight.duration,
                    stops: cheapestFlight.stops,
                    deepLink: cheapestFlight.deepLink
                },
                status: 'new', // new, saved, dismissed
                isGoodDeal: cheapestFlight.price <= config.budget * 0.9, // 10% under budget = great deal
                dealScore: this.calculateDealScore(cheapestFlight.price, config.budget, config.destinationName)
            };

            // Check if we already have this deal (avoid duplicates)
            const existingDeal = this.discoveredDeals.find(d => 
                d.origin === deal.origin && 
                d.destinationCode === deal.destinationCode && 
                d.departureDate === deal.departureDate &&
                Math.abs(d.price - deal.price) < 50 // Within £50
            );

            if (!existingDeal) {
                this.discoveredDeals.unshift(deal); // Add to beginning
                
                // Keep only latest 100 deals
                if (this.discoveredDeals.length > 100) {
                    this.discoveredDeals = this.discoveredDeals.slice(0, 100);
                }
                
                this.saveDiscoveredDeals();
                
                console.log(`🎉 NEW DEAL FOUND: ${deal.destination} - £${deal.price} (Save £${deal.savings})`);
                if (deal.isGoodDeal) {
                    console.log(`⭐ GREAT DEAL! ${deal.dealScore}/10 rating`);
                }
            }
        }
    }

    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
    }

    calculateDealScore(price, budget, destination) {
        // Score out of 10 based on price vs budget and destination desirability
        const priceScore = Math.max(0, Math.min(10, (budget - price) / budget * 10));
        
        // Destination bonus
        const destinationBonus = {
            'Cyprus': 2,
            'Tenerife': 1.5,
            'Gran Canaria': 1.5,
            'Lanzarote': 1.5,
            'Turkey Antalya': 1,
            'Turkey Istanbul': 1,
            'Greece Crete': 1.5,
            'Malta': 1
        };
        
        const bonus = destinationBonus[destination] || 0;
        return Math.min(10, Math.round(priceScore + bonus));
    }

    stopAutoDiscovery() {
        this.isRunning = false;
        console.log('⏹️ Stopping auto-discovery...');
    }

    getDiscoveredDeals() {
        return this.discoveredDeals.sort((a, b) => {
            // Sort by deal score first, then by price
            if (a.dealScore !== b.dealScore) {
                return b.dealScore - a.dealScore;
            }
            return a.price - b.price;
        });
    }

    getDealsByStatus(status = 'new') {
        return this.discoveredDeals.filter(deal => deal.status === status);
    }

    updateDealStatus(dealId, status) {
        const deal = this.discoveredDeals.find(d => d.id === dealId);
        if (deal) {
            deal.status = status;
            deal.updatedAt = new Date().toISOString();
            this.saveDiscoveredDeals();
            return true;
        }
        return false;
    }

    getStats() {
        const total = this.discoveredDeals.length;
        const newDeals = this.discoveredDeals.filter(d => d.status === 'new').length;
        const saved = this.discoveredDeals.filter(d => d.status === 'saved').length;
        const dismissed = this.discoveredDeals.filter(d => d.status === 'dismissed').length;
        
        const avgPrice = total > 0 ? 
            Math.round(this.discoveredDeals.reduce((sum, d) => sum + d.price, 0) / total) : 0;
        
        const bestDeal = this.discoveredDeals.length > 0 ? 
            this.discoveredDeals.reduce((best, deal) => 
                deal.price < best.price ? deal : best
            ) : null;

        return {
            total,
            newDeals,
            saved,
            dismissed,
            avgPrice,
            bestDeal,
            isRunning: this.isRunning
        };
    }
}

module.exports = AutoFlightDiscovery;