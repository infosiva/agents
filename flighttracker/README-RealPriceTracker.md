# 🛫 Real Price Tracker

A command-line tool to manually track and organize actual flight prices you find on booking websites like Skyscanner, Google Flights, etc.

## 🚀 Quick Start

```bash
# Add a new flight price (interactive)
node real-price-tracker.js add

# View your best deals
node real-price-tracker.js best

# View flights by destination  
node real-price-tracker.js destinations

# Search your saved flights
node real-price-tracker.js search --destination cyprus --max-price 1500
```

## 📋 How to Use

### 1. Add Prices You Find Online

When you find a good deal on Skyscanner/Google Flights:

```bash
node real-price-tracker.js add
```

You'll be prompted to enter:
- ✈️ **From/To**: Airports or cities (e.g., LHR → Cyprus)
- 💰 **Price**: Total cost for your family
- 👥 **Passengers**: Family configuration  
- 📅 **Dates**: Departure and return dates
- 🌐 **Source**: Which website you found it on
- 📝 **Notes**: Any extra details

### 2. Search Your Saved Prices

```bash
# Find flights to Cyprus under £1500
node real-price-tracker.js search --destination cyprus --max-price 1500

# Find flights from Manchester  
node real-price-tracker.js search --origin manchester

# Find Skyscanner deals
node real-price-tracker.js search --source skyscanner
```

### 3. View Your Best Deals

```bash
# Top 10 cheapest flights you've found
node real-price-tracker.js best

# Organized by destination
node real-price-tracker.js destinations
```

## 🔍 Recommended Search Strategy

1. **Start with these destinations** (based on our analysis):
   - Cyprus (consistently good value)
   - Canary Islands (Tenerife, Gran Canaria, Lanzarote)  
   - Turkey (Istanbul, Antalya)
   - Greece (Crete, Athens)

2. **Try multiple UK airports**:
   - London: LHR, LGW, STN, LTN
   - Regional: MAN, BHX, EDI

3. **Use flexible date searches**:
   - "Whole month" view in August 2025
   - Mid-week departures (Tue-Thu)

4. **Track prices over time**:
   - Add the same route multiple times as prices change
   - Set up price alerts on the booking sites
   - Use this tool to compare your findings

## 📊 Example Output

```bash
$ node real-price-tracker.js best

🏆 TOP 10 CHEAPEST FLIGHTS:

1. LHR → Cyprus
   💰 £1,420 for 2 adults + 2 children  
   📅 2025-08-05 → 2025-08-10
   ✈️  Turkish Airlines
   🌐 Found on: Skyscanner
   📝 Notes: Direct flight, 4.5 hours
   ⏰ Added: 22/07/2025

2. MAN → Tenerife  
   💰 £1,485 for 2 adults + 2 children
   📅 2025-08-12 → 2025-08-17
   ✈️  Jet2
   🌐 Found on: Google Flights
   📝 Notes: Package deal available
   ⏰ Added: 21/07/2025
```

## 💡 Pro Tips

- **Track the same route over time** to spot price drops
- **Note package deal availability** in the notes field  
- **Include flight details** (direct vs stops) in notes
- **Use consistent naming** for destinations (e.g., always "Cyprus" not "Larnaca")
- **Set price alerts** on booking sites and add them here when triggered

## 📁 Data Storage

All your price data is stored in:
- `./data/real-prices.json` - Your flight database
- Automatically backed up each time you add/update prices
- Easy to export or share with family

## 🎯 Your £1500 Budget Target

Use the search command to find flights under your budget:

```bash
node real-price-tracker.js search --max-price 1500
```

This will show you all flights you've saved that meet your £1500 family budget!

---

**Happy flight hunting! ✈️🌴**