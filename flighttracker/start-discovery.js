#!/usr/bin/env node

const AutoFlightDiscovery = require('./auto-discovery');

console.log('🚀 Starting Flight Auto-Discovery System...\n');

const discovery = new AutoFlightDiscovery();

// Start the discovery process
discovery.startAutoDiscovery();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down auto-discovery...');
    discovery.stopAutoDiscovery();
    process.exit(0);
});

// Keep the process alive
setInterval(() => {
    const stats = discovery.getStats();
    if (stats.total > 0) {
        console.log(`📊 Progress: ${stats.total} deals found, ${stats.newDeals} new, avg price £${stats.avgPrice}`);
    }
}, 60000); // Log stats every minute