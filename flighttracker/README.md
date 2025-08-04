# Flight Tracker

A Node.js application that monitors flight prices from London to Maldives every 5 minutes and sends notifications when great deals are found.

## Features

- ✈️ **Real-time Flight Monitoring**: Checks flight prices every 5 minutes
- 💰 **Price Alerts**: Desktop notifications for price drops and best deals
- 📊 **Price History**: Tracks price trends and historical data
- 👥 **Flexible Passenger Options**: Support for adults, children, and infants
- 💺 **Multiple Cabin Classes**: Economy, Premium Economy, Business, and First Class
- 📈 **Trend Analysis**: Shows if prices are increasing, decreasing, or stable
- 🔔 **Smart Notifications**: Avoids notification spam with intelligent alerting

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage
```bash
npm start
```

### With Custom Options
```bash
# 2 adults, business class
node src/index.js --adults 2 --class business

# Family trip: 2 adults, 1 child, economy class
node src/index.js --adults 2 --children 1 --class economy

# With specific dates
node src/index.js --adults 2 --departure 2024-06-15 --return 2024-06-25

# Different route
node src/index.js --origin LGW --destination MLE --adults 1 --class premium_economy
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--adults <number>` | Number of adult passengers | 1 |
| `--children <number>` | Number of child passengers | 0 |
| `--infants <number>` | Number of infant passengers | 0 |
| `--class <class>` | Cabin class (economy, premium_economy, business, first) | economy |
| `--origin <code>` | Origin airport code | LHR (London Heathrow) |
| `--destination <code>` | Destination airport code | MLE (Maldives) |
| `--departure <date>` | Departure date (YYYY-MM-DD) | Tomorrow |
| `--return <date>` | Return date (YYYY-MM-DD, optional) | None |
| `--help` | Show help message | - |

### Airport Codes
- **LHR** - London Heathrow
- **LGW** - London Gatwick  
- **STN** - London Stansted
- **LTN** - London Luton
- **MLE** - Maldives (Malé)

### Cabin Classes
- **economy** - Economy Class
- **premium_economy** - Premium Economy Class  
- **business** - Business Class
- **first** - First Class

## API Configuration

By default, the app uses mock data for demonstrations. To use real flight data:

1. Get a RapidAPI key from [RapidAPI Sky Scrapper](https://rapidapi.com/apiheya/api/sky-scrapper)
2. Set your API key as an environment variable:
   ```bash
   export RAPIDAPI_KEY="your-api-key-here"
   ```

## How It Works

1. **Flight Search**: Every 5 minutes, searches for flights with your specified criteria
2. **Price Analysis**: Compares current prices with historical data
3. **Trend Detection**: Identifies if prices are trending up, down, or stable
4. **Smart Alerts**: Sends notifications for:
   - New best prices found
   - Prices within 5% of the best price (limited to once per hour)
5. **Data Storage**: Saves price history in `data/flight-history.json`

## Sample Output

```
🚀 Flight Tracker Started!
📊 Checking flights every 5 minutes...
🔔 You'll receive notifications for price drops

🔍 Searching for flights...
📍 Route: LHR → MLE  
👥 Passengers: 2 adult(s), 1 child(ren), 0 infant(s)
💺 Class: business

📊 Flight Check - 7/22/2024, 2:30:00 PM
💰 Cheapest: Emirates - £2,341
📈 Price Trend: ➡️ stable

📋 Top 3 Flights:
   1. Emirates - £2,341 (1 stop) - 7/23/2024
   2. Qatar Airways - £2,455 (1 stop) - 7/23/2024  
   3. British Airways - £2,678 (Direct) - 7/23/2024

🔔 ALERT: 🎉 New Best Price Found!
   Emirates: £2,341 (New best price!)
   London → Maldives
   Stops: 1
```

## Files Structure

```
flight-tracker/
├── src/
│   ├── index.js          # Main application and CLI interface
│   ├── flightApi.js      # Flight search API integration  
│   ├── priceTracker.js   # Price analysis and history
│   └── notifier.js       # Desktop notifications and console output
├── data/
│   └── flight-history.json  # Price history storage (auto-created)
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Stopping the Application

Press `Ctrl+C` to stop the flight tracker.

The application will continue running and checking flights every 5 minutes until stopped. All price history is automatically saved and will be available when you restart the application.