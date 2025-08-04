// Flight Capture Bookmarklet Script
(function() {
    'use strict';
    
    window.FlightCapture = {
        init: function() {
            this.createModal();
            this.detectFlightData();
        },
        
        createModal: function() {
            // Remove existing modal if present
            const existing = document.getElementById('flight-capture-modal');
            if (existing) existing.remove();
            
            // Create modal HTML
            const modal = document.createElement('div');
            modal.id = 'flight-capture-modal';
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                        max-height: 80vh;
                        overflow-y: auto;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #333;">✈️ Capture Flight Data</h2>
                            <button onclick="FlightCapture.closeModal()" style="
                                background: none;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #999;
                            ">×</button>
                        </div>
                        
                        <form id="capture-form">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">From:</label>
                                <input type="text" id="cap-origin" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">To:</label>
                                <input type="text" id="cap-destination" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Price (£):</label>
                                <input type="number" id="cap-price" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Airline:</label>
                                <input type="text" id="cap-airline" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Departure Date:</label>
                                <input type="date" id="cap-departure" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Return Date:</label>
                                <input type="date" id="cap-return" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Source:</label>
                                <input type="text" id="cap-source" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;" readonly>
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button type="button" onclick="FlightCapture.saveFlight()" style="
                                    flex: 1;
                                    background: #28a745;
                                    color: white;
                                    border: none;
                                    padding: 12px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-weight: bold;
                                ">💾 Save Flight</button>
                                
                                <button type="button" onclick="FlightCapture.closeModal()" style="
                                    flex: 1;
                                    background: #6c757d;
                                    color: white;
                                    border: none;
                                    padding: 12px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                ">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        },
        
        detectFlightData: function() {
            const data = {
                origin: '',
                destination: '',
                price: '',
                airline: '',
                departureDate: '',
                returnDate: '',
                source: window.location.hostname
            };
            
            // Detect website and extract data accordingly
            const hostname = window.location.hostname.toLowerCase();
            
            if (hostname.includes('skyscanner')) {
                this.extractSkyscannerData(data);
            } else if (hostname.includes('google')) {
                this.extractGoogleFlightsData(data);
            } else if (hostname.includes('kayak')) {
                this.extractKayakData(data);
            } else if (hostname.includes('momondo')) {
                this.extractMomondoData(data);
            } else {
                this.extractGenericData(data);
            }
            
            // Fill the form
            this.fillForm(data);
        },
        
        extractSkyscannerData: function(data) {
            // Common Skyscanner selectors (these may change)
            const priceSelectors = [
                '[data-testid="price"]',
                '.Price',
                '.price',
                '[class*="price"]',
                '[class*="Price"]'
            ];
            
            const routeSelectors = [
                '[data-testid="origin"]',
                '[data-testid="destination"]',
                '.origin',
                '.destination',
                '[class*="route"]'
            ];
            
            // Try to extract price
            for (const selector of priceSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const priceText = element.textContent;
                    const priceMatch = priceText.match(/£?(\d+,?\d*)/);
                    if (priceMatch) {
                        data.price = priceMatch[1].replace(',', '');
                        break;
                    }
                }
            }
            
            // Try to extract route from URL or page content
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('originEntityId')) {
                data.origin = urlParams.get('originEntityId');
            }
            if (urlParams.get('destinationEntityId')) {
                data.destination = urlParams.get('destinationEntityId');
            }
            
            data.source = 'Skyscanner';
        },
        
        extractGoogleFlightsData: function(data) {
            // Google Flights selectors
            const priceElements = document.querySelectorAll('[role="button"] [class*="price"], .flt-price, [class*="price"]');
            if (priceElements.length > 0) {
                const priceText = priceElements[0].textContent;
                const priceMatch = priceText.match(/£?(\d+,?\d*)/);
                if (priceMatch) {
                    data.price = priceMatch[1].replace(',', '');
                }
            }
            
            data.source = 'Google Flights';
        },
        
        extractKayakData: function(data) {
            // Kayak selectors
            const priceElements = document.querySelectorAll('.price, .price-text, [class*="price"]');
            for (const element of priceElements) {
                const priceText = element.textContent;
                const priceMatch = priceText.match(/£?(\d+,?\d*)/);
                if (priceMatch) {
                    data.price = priceMatch[1].replace(',', '');
                    break;
                }
            }
            
            data.source = 'Kayak';
        },
        
        extractMomondoData: function(data) {
            // Momondo selectors (similar to Kayak)
            const priceElements = document.querySelectorAll('.price, [class*="price"], [class*="Price"]');
            for (const element of priceElements) {
                const priceText = element.textContent;
                const priceMatch = priceText.match(/£?(\d+,?\d*)/);
                if (priceMatch) {
                    data.price = priceMatch[1].replace(',', '');
                    break;
                }
            }
            
            data.source = 'Momondo';
        },
        
        extractGenericData: function(data) {
            // Generic extraction for unknown sites
            const allText = document.body.textContent;
            
            // Try to find prices in the format £123 or 123
            const priceMatches = allText.match(/£(\d+,?\d*)/g);
            if (priceMatches && priceMatches.length > 0) {
                // Take the first reasonable price (between £50 and £5000)
                for (const match of priceMatches) {
                    const price = parseInt(match.replace(/[£,]/g, ''));
                    if (price >= 50 && price <= 5000) {
                        data.price = price.toString();
                        break;
                    }
                }
            }
            
            data.source = window.location.hostname;
        },
        
        fillForm: function(data) {
            // Fill the modal form with detected data
            document.getElementById('cap-origin').value = data.origin;
            document.getElementById('cap-destination').value = data.destination;
            document.getElementById('cap-price').value = data.price;
            document.getElementById('cap-airline').value = data.airline;
            document.getElementById('cap-departure').value = data.departureDate;
            document.getElementById('cap-return').value = data.returnDate;
            document.getElementById('cap-source').value = data.source;
            
            // Show success message if we found some data
            if (data.price) {
                this.showMessage('✅ Price detected: £' + data.price, 'success');
            } else {
                this.showMessage('⚠️ No price detected. Please enter manually.', 'warning');
            }
        },
        
        showMessage: function(message, type) {
            const modal = document.getElementById('flight-capture-modal');
            const existingMsg = modal.querySelector('.capture-message');
            if (existingMsg) existingMsg.remove();
            
            const msg = document.createElement('div');
            msg.className = 'capture-message';
            msg.style.cssText = `
                padding: 10px;
                margin-bottom: 15px;
                border-radius: 5px;
                background: ${type === 'success' ? '#d4edda' : '#fff3cd'};
                border: 1px solid ${type === 'success' ? '#c3e6cb' : '#ffeaa7'};
                color: ${type === 'success' ? '#155724' : '#856404'};
            `;
            msg.textContent = message;
            
            const form = document.getElementById('capture-form');
            form.insertBefore(msg, form.firstChild);
        },
        
        saveFlight: async function() {
            const flightData = {
                origin: document.getElementById('cap-origin').value.trim(),
                destination: document.getElementById('cap-destination').value.trim(),
                price: parseFloat(document.getElementById('cap-price').value),
                airline: document.getElementById('cap-airline').value.trim(),
                departureDate: document.getElementById('cap-departure').value,
                returnDate: document.getElementById('cap-return').value || null,
                source: document.getElementById('cap-source').value,
                passengers: '2 adults + 2 children', // Default for your family
                notes: 'Captured from ' + document.getElementById('cap-source').value
            };
            
            // Validation
            if (!flightData.origin || !flightData.destination || !flightData.price) {
                this.showMessage('❌ Please fill in Origin, Destination, and Price', 'error');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/flights', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(flightData)
                });
                
                if (response.ok) {
                    this.showMessage('✅ Flight saved successfully!', 'success');
                    setTimeout(() => this.closeModal(), 1500);
                } else {
                    this.showMessage('❌ Failed to save flight', 'error');
                }
            } catch (error) {
                this.showMessage('❌ Network error: ' + error.message, 'error');
            }
        },
        
        closeModal: function() {
            const modal = document.getElementById('flight-capture-modal');
            if (modal) modal.remove();
        }
    };
    
})();