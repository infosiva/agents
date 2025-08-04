#!/usr/bin/env python3
import json
import os
import glob
from collections import defaultdict

def extract_flight_info(file_path):
    """Extract flight information from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Parse filename to extract destination and departure airport
        filename = os.path.basename(file_path)
        base = filename.replace('flight-history-tropical-flights-', '').replace('.json', '')
        
        # Handle gran-canaria specially since it has a hyphen in the name
        if base.startswith('gran-canaria-'):
            destination = 'gran-canaria'
            remaining = base[13:]  # Remove 'gran-canaria-'
            parts = remaining.split('-')
            departure_airport = parts[0] if parts else None
        else:
            parts = base.split('-')
            if len(parts) >= 2:
                destination = parts[0]
                departure_airport = parts[1]
            else:
                destination = None
                departure_airport = None
        
        # Only proceed if we have valid destination and departure airport
        if destination and departure_airport:
            # Extract best price info
            if 'bestPrice' in data and data['bestPrice']:
                best_price = data['bestPrice']
                price = best_price.get('price')
                result = best_price.get('result', {})
                
                return {
                    'destination': destination,
                    'departure_airport': departure_airport,
                    'price': price,
                    'airline': result.get('airline'),
                    'stops': result.get('stops'),
                    'duration': result.get('duration'),  # in minutes
                    'currency': result.get('currency'),
                    'filename': filename
                }
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    
    return None

def format_duration(minutes):
    """Convert minutes to hours and minutes format."""
    if minutes is None:
        return "N/A"
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours}h {mins}m"

def format_stops(stops):
    """Format stops information."""
    if stops is None:
        return "N/A"
    if stops == 0:
        return "Direct"
    elif stops == 1:
        return "1 stop"
    else:
        return f"{stops} stops"

def map_destination_codes():
    """Map destination codes to full names and airport codes."""
    return {
        'tenerife': ('Tenerife', 'TFS'),
        'gran-canaria': ('Gran Canaria', 'LPA'),
        'lanzarote': ('Lanzarote', 'ACE'),
        'antalya': ('Antalya', 'AYT'),
        'istanbul': ('Istanbul', 'IST'),
        'cyprus': ('Cyprus', 'LCA'),
        'athens': ('Athens', 'ATH'),
        'crete': ('Crete', 'HER'),
        'malta': ('Malta', 'MLA'),
        'casablanca': ('Casablanca', 'CMN'),
        'hurghada': ('Hurghada', 'HRG')
    }

def map_airport_codes():
    """Map airport codes to full names."""
    return {
        'lgw': 'London Gatwick (LGW)',
        'lhr': 'London Heathrow (LHR)',
        'stn': 'London Stansted (STN)',
        'man': 'Manchester (MAN)'
    }

def main():
    # Find all tropical flight files
    data_dir = "/Users/sivaprakasamsivaprakasam/agents/flighttracker/data"
    pattern = os.path.join(data_dir, "flight-history-tropical-flights-*.json")
    files = glob.glob(pattern)
    
    print(f"Found {len(files)} tropical flight files to analyze")
    
    # Process all files
    all_flights = []
    for file_path in files:
        flight_info = extract_flight_info(file_path)
        if flight_info and flight_info['price'] is not None:
            all_flights.append(flight_info)
    
    print(f"Successfully processed {len(all_flights)} flight records")
    
    # Group by destination
    destinations = defaultdict(list)
    for flight in all_flights:
        destinations[flight['destination']].append(flight)
    
    # Sort each destination by price and get top 3
    destination_names = map_destination_codes()
    airport_names = map_airport_codes()
    
    print("\n" + "="*100)
    print("TOP 3 BEST VALUE TROPICAL FLIGHT DEALS - FAMILY OF 4")
    print("="*100)
    
    for dest_code in sorted(destinations.keys()):
        if dest_code in destination_names:
            dest_name, dest_airport_code = destination_names[dest_code]
            flights = sorted(destinations[dest_code], key=lambda x: x['price'])
            
            print(f"\n🏝️  {dest_name.upper()} ({dest_airport_code})")
            print("-" * 80)
            
            # Show top 3 best deals
            top_flights = flights[:3]
            for i, flight in enumerate(top_flights, 1):
                departure_airport = airport_names.get(flight['departure_airport'], flight['departure_airport'].upper())
                
                print(f"\n{i}. £{flight['price']:,} - {departure_airport}")
                print(f"   ✈️  Airline: {flight['airline']}")
                print(f"   🛣️  Route: {format_stops(flight['stops'])}")
                print(f"   ⏱️  Duration: {format_duration(flight['duration'])}")
            
            # Show summary stats
            all_prices = [f['price'] for f in flights]
            avg_price = sum(all_prices) / len(all_prices)
            print(f"\n   📊 Price Range: £{min(all_prices):,} - £{max(all_prices):,} (Avg: £{avg_price:.0f})")
            print(f"   🔍 Searched: {len(flights)} combinations")

    # Overall summary
    print(f"\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    
    # Find absolute cheapest across all destinations
    all_flights_sorted = sorted(all_flights, key=lambda x: x['price'])
    cheapest_overall = all_flights_sorted[:5]
    
    print(f"\n🏆 TOP 5 CHEAPEST TROPICAL DESTINATIONS:")
    for i, flight in enumerate(cheapest_overall, 1):
        dest_name, dest_code = destination_names.get(flight['destination'], (flight['destination'], 'N/A'))
        departure_airport = airport_names.get(flight['departure_airport'], flight['departure_airport'].upper())
        
        print(f"{i}. £{flight['price']:,} - {dest_name} from {departure_airport}")
        print(f"    {flight['airline']} • {format_stops(flight['stops'])} • {format_duration(flight['duration'])}")
    
    # Price analysis by departure airport
    print(f"\n📍 BEST PRICES BY DEPARTURE AIRPORT:")
    airport_best = defaultdict(list)
    for flight in all_flights:
        airport_best[flight['departure_airport']].append(flight['price'])
    
    for airport_code in sorted(airport_best.keys()):
        prices = airport_best[airport_code]
        airport_name = airport_names.get(airport_code, airport_code.upper())
        print(f"   {airport_name}: £{min(prices):,} - £{max(prices):,} (Avg: £{sum(prices)/len(prices):.0f})")
    
    print(f"\n💰 Family of 4 flights under £2000: {len([f for f in all_flights if f['price'] < 2000])}/{len(all_flights)}")

if __name__ == "__main__":
    main()