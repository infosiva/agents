// Flight Price Tracker UI JavaScript

class FlightTrackerUI {
    constructor() {
        this.baseURL = '/api';
        this.isVoiceControlActive = false;
        this.recognition = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        
        // Load content when tabs are switched
        document.getElementById('best-tab').addEventListener('click', () => this.loadBestDeals());
        document.getElementById('destinations-tab').addEventListener('click', () => this.loadDestinations());
        document.getElementById('auto-deals-tab').addEventListener('click', () => this.loadAutoDeals());
    }

    setupEventListeners() {
        // Add flight form
        document.getElementById('addFlightForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addFlight();
        });

        // Search functionality
        ['searchDestination', 'searchOrigin', 'searchMaxPrice', 'searchSource'].forEach(id => {
            document.getElementById(id).addEventListener('input', this.debounce(() => {
                this.searchFlights();
            }, 500));
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async addFlight() {
        const formData = {
            origin: document.getElementById('origin').value.trim(),
            destination: document.getElementById('destination').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            passengers: document.getElementById('passengers').value.trim(),
            departureDate: document.getElementById('departureDate').value,
            returnDate: document.getElementById('returnDate').value || null,
            airline: document.getElementById('airline').value.trim(),
            source: document.getElementById('source').value,
            notes: document.getElementById('notes').value.trim()
        };

        // Validation
        if (!formData.origin || !formData.destination || !formData.price) {
            this.showAlert('Please fill in required fields: From, To, and Price', 'danger');
            return;
        }

        if (formData.price <= 0) {
            this.showAlert('Price must be greater than 0', 'danger');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/flights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showAlert('Flight added successfully!', 'success');
                document.getElementById('addFlightForm').reset();
                this.loadStats();
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Failed to add flight', 'danger');
            }
        } catch (error) {
            this.showAlert('Network error: ' + error.message, 'danger');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseURL}/flights`);
            const flights = await response.json();
            
            document.getElementById('totalFlights').textContent = flights.length;
            
            if (flights.length > 0) {
                const cheapest = Math.min(...flights.map(f => f.price));
                document.getElementById('cheapestPrice').textContent = `£${cheapest}`;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadBestDeals() {
        const content = document.getElementById('bestDealsContent');
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading best deals...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/flights/best?limit=10`);
            const deals = await response.json();

            if (deals.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-plane"></i>
                        <h5>No flights saved yet</h5>
                        <p>Add some flight prices to see your best deals here!</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = deals.map((flight, index) => this.renderFlightCard(flight, index + 1)).join('');
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger">Error loading deals: ${error.message}</div>`;
        }
    }

    async loadDestinations() {
        const content = document.getElementById('destinationsContent');
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading destinations...</p></div>';

        try {
            const response = await fetch(`${this.baseURL}/flights/destinations`);
            const destinations = await response.json();

            if (Object.keys(destinations).length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-globe"></i>
                        <h5>No destinations yet</h5>
                        <p>Add some flight prices to see them organized by destination!</p>
                    </div>
                `;
                return;
            }

            const html = Object.entries(destinations)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([destination, flights]) => {
                    const topFlights = flights.slice(0, 3);
                    return `
                        <div class="mb-4">
                            <div class="destination-header">
                                <i class="fas fa-map-marker-alt"></i> ${destination.toUpperCase()}
                                <span class="badge bg-light text-dark ms-2">${flights.length} flight${flights.length > 1 ? 's' : ''}</span>
                            </div>
                            <div class="border border-top-0 rounded-bottom p-3">
                                ${topFlights.map(flight => `
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <div>
                                            <strong>£${flight.price}</strong> from ${flight.origin}
                                            ${flight.airline ? `<br><small class="text-muted"><i class="fas fa-plane"></i> ${flight.airline}</small>` : ''}
                                            ${flight.source ? `<br><small class="text-success"><i class="fas fa-globe"></i> ${flight.source}</small>` : ''}
                                        </div>
                                        <div class="text-end">
                                            <small class="text-muted">
                                                ${flight.departureDate ? new Date(flight.departureDate).toLocaleDateString() : 'Date TBD'}
                                            </small>
                                            <br>
                                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteFlight('${flight.id}')">
                                                <i class="fas fa-trash"></i>: 
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                                ${flights.length > 3 ? `<small class="text-muted">... and ${flights.length - 3} more</small>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

            content.innerHTML = html;
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger">Error loading destinations: ${error.message}</div>`;
        }
    }

    async loadAutoDeals() {
        const content = document.getElementById('autoDealsContent');
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Loading auto-discovered deals...</p></div>';

        try {
            const response = await fetch('/api/discovery/deals');
            this.allAutoDeals = await response.json();

            if (this.allAutoDeals.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-robot"></i>
                        <h5>No auto-discovered deals yet</h5>
                        <p>The discovery system is still searching for great flight deals!</p>
                        <a href="/deals.html" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i> View Discovery Dashboard
                        </a>
                    </div>
                `;
                return;
            }

            this.filterAutoDeals();
        } catch (error) {
            content.innerHTML = `<div class="alert alert-danger">Error loading auto deals: ${error.message}</div>`;
        }
    }

    filterAutoDeals() {
        if (!this.allAutoDeals) return;

        const filterDestination = document.getElementById('filterDestination').value;
        const filterAirline = document.getElementById('filterAirline').value;
        const filterMaxPrice = document.getElementById('filterMaxPrice').value;
        const filterStatus = document.getElementById('filterStatus').value;
        const filterScore = document.getElementById('filterScore').value;
        const filterDateFrom = document.getElementById('filterDateFrom').value;
        const filterDateTo = document.getElementById('filterDateTo').value;
        const filterPassengers = document.getElementById('filterPassengers').value;
        const filterDuration = document.getElementById('filterDuration').value;

        // Update visual feedback for active filters
        this.updateFilterVisualFeedback();

        let filteredDeals = this.allAutoDeals.filter(deal => {
            // Existing filters
            if (filterDestination && deal.destination !== filterDestination) return false;
            if (filterAirline && deal.airline !== filterAirline) return false;
            if (filterMaxPrice && deal.price > parseInt(filterMaxPrice)) return false;
            if (filterStatus && deal.status !== filterStatus) return false;
            if (filterScore && deal.dealScore < parseInt(filterScore)) return false;
            
            // Date filters
            if (filterDateFrom) {
                const dealDate = new Date(deal.departureDate);
                const fromDate = new Date(filterDateFrom);
                if (dealDate < fromDate) return false;
            }
            
            if (filterDateTo) {
                const dealDate = new Date(deal.departureDate);
                const toDate = new Date(filterDateTo);
                if (dealDate > toDate) return false;
            }
            
            // Passenger filter
            if (filterPassengers && deal.passengers !== filterPassengers) return false;
            
            // Duration filter
            if (filterDuration) {
                const tripDuration = this.calculateTripDuration(deal.departureDate, deal.returnDate);
                if (!this.matchesDurationFilter(tripDuration, filterDuration)) return false;
            }
            
            return true;
        });

        const content = document.getElementById('autoDealsContent');
        
        if (filteredDeals.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h5>No deals match your filters</h5>
                    <p>Try adjusting your filter criteria to see more deals</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="mb-3">
                <h5><i class="fas fa-robot"></i> Found ${filteredDeals.length} Auto-Discovered Deal${filteredDeals.length > 1 ? 's' : ''}</h5>
                ${this.allAutoDeals.length !== filteredDeals.length ? 
                    `<small class="text-muted">(${filteredDeals.length} of ${this.allAutoDeals.length} total deals shown)</small>` : ''}
            </div>
            ${filteredDeals.map(deal => this.renderAutoDiscoveryCard(deal)).join('')}
        `;
    }

    calculateTripDuration(departureDate, returnDate) {
        const departure = new Date(departureDate);
        const returnD = new Date(returnDate);
        const diffTime = Math.abs(returnD - departure);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    matchesDurationFilter(tripDuration, filterDuration) {
        switch(filterDuration) {
            case '3-5':
                return tripDuration >= 3 && tripDuration <= 5;
            case '6-8':
                return tripDuration >= 6 && tripDuration <= 8;
            case '7':
                return tripDuration === 7;
            case '9-14':
                return tripDuration >= 9 && tripDuration <= 14;
            case '15+':
                return tripDuration >= 15;
            default:
                return true;
        }
    }

    clearAutoDealsFilters() {
        document.getElementById('filterDestination').value = '';
        document.getElementById('filterAirline').value = '';
        document.getElementById('filterMaxPrice').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterScore').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        document.getElementById('filterPassengers').value = '';
        document.getElementById('filterDuration').value = '';
        this.filterAutoDeals();
    }

    updateFilterVisualFeedback() {
        // Highlight active filters and add visual feedback
        const filterElements = [
            'filterDestination', 'filterAirline', 'filterMaxPrice', 
            'filterStatus', 'filterScore', 'filterDateFrom', 
            'filterDateTo', 'filterPassengers', 'filterDuration'
        ];

        let hasActiveFilters = false;

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.value) {
                element.classList.add('has-value');
                hasActiveFilters = true;
            } else if (element) {
                element.classList.remove('has-value');
            }
        });

        // Update filter row styling
        const filterRow = document.getElementById('filterRow');
        if (filterRow) {
            if (hasActiveFilters) {
                filterRow.classList.add('filter-active');
            } else {
                filterRow.classList.remove('filter-active');
            }
        }
    }

    toggleVoiceControl() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showAlert('Voice control is not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
            return;
        }

        if (this.isVoiceControlActive) {
            this.stopVoiceControl();
        } else {
            this.startVoiceControl();
        }
    }

    startVoiceControl() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        this.isListeningForFreeText = false;
        this.targetInput = null;
        this.interimTranscript = '';
        this.silenceTimer = null;
        this.lastCommand = '';

        this.recognition.onstart = () => {
            this.isVoiceControlActive = true;
            const btn = document.getElementById('voiceControlBtn');
            btn.innerHTML = '<i class="fas fa-microphone"></i> Stop Voice Control';
            btn.className = 'btn voice-btn-active';
            
            // Update voice panel text
            const voicePanel = document.querySelector('.voice-control-panel h6');
            if (voicePanel) {
                voicePanel.textContent = '🎤 Voice Control Active - Listening...';
            }
            
            // Create voice feedback area if it doesn't exist
            this.createVoiceFeedbackArea();
            
            this.showAlert('🎤 Advanced Voice Control Active! Try: "Fill origin London", "Search flights to Cyprus under 800 pounds", "Add British Airways flight"', 'success');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update feedback area with real-time transcription
            this.updateVoiceFeedback(interimTranscript, finalTranscript);

            // Handle interim results for better UX
            if (interimTranscript && this.isListeningForFreeText && this.targetInput) {
                this.targetInput.value = interimTranscript;
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            if (finalTranscript) {
                const command = finalTranscript.toLowerCase().trim();
                
                // Avoid processing duplicate commands
                if (command !== this.lastCommand) {
                    this.lastCommand = command;
                    this.processAdvancedVoiceCommand(command, finalTranscript.trim());
                }
                
                // Clear the last command after a delay
                setTimeout(() => {
                    this.lastCommand = '';
                }, 2000);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (event.error === 'not-allowed') {
                this.showAlert('🚫 Microphone access denied. Please allow microphone permissions and try again.', 'danger');
                this.stopVoiceControl();
            } else if (event.error === 'no-speech') {
                this.showAlert('🔇 No speech detected. Try speaking clearly.', 'warning');
            }
        };

        this.recognition.onend = () => {
            if (this.isVoiceControlActive) {
                // Restart recognition if it stops unexpectedly
                setTimeout(() => {
                    if (this.isVoiceControlActive) {
                        this.recognition.start();
                    }
                }, 100);
            }
        };

        this.recognition.start();
    }

    stopVoiceControl() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isVoiceControlActive = false;
        this.isListeningForFreeText = false;
        this.targetInput = null;
        
        const btn = document.getElementById('voiceControlBtn');
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i> Start Voice Control';
        btn.className = 'btn voice-btn-inactive';
        
        // Update voice panel text
        const voicePanel = document.querySelector('.voice-control-panel h6');
        if (voicePanel) {
            voicePanel.textContent = '🎤 Voice Control Ready';
        }
        
        // Remove voice feedback area
        const feedbackArea = document.getElementById('voiceFeedbackArea');
        if (feedbackArea) {
            feedbackArea.remove();
        }
        
        this.showAlert('Voice control stopped', 'info');
    }

    createVoiceFeedbackArea() {
        // Remove existing feedback area
        const existing = document.getElementById('voiceFeedbackArea');
        if (existing) {
            existing.remove();
        }

        // Create new feedback area
        const feedbackArea = document.createElement('div');
        feedbackArea.id = 'voiceFeedbackArea';
        feedbackArea.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
            color: white;
            padding: 20px 25px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 450px;
            min-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(15px);
            border: 2px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        `;
        
        feedbackArea.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; font-size: 16px;">
                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 10px; animation: pulse 1.5s infinite;"></div>
                🎤 Advanced Voice Control
            </div>
            <div id="voiceInterimText" style="opacity: 0.8; font-style: italic; min-height: 24px; font-size: 15px; color: #e0e7ff; line-height: 1.4;"></div>
            <div id="voiceFinalText" style="font-weight: 600; min-height: 24px; font-size: 15px; line-height: 1.4; margin: 8px 0;"></div>
            <div id="voiceStatus" style="font-size: 13px; margin-top: 12px; opacity: 0.9; padding: 8px 12px; background: rgba(255,255,255,0.15); border-radius: 8px; border-left: 3px solid #10b981;"></div>
            <div style="margin-top: 12px; font-size: 11px; opacity: 0.7; line-height: 1.3;">
                💡 Try: "Fill origin London", "Search Cyprus under 800", "Show cheap flights"
            </div>
        `;

        // Enhanced CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            #voiceFeedbackArea:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 40px rgba(0,0,0,0.4);
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(feedbackArea);
    }

    updateVoiceFeedback(interimText, finalText) {
        const interimElement = document.getElementById('voiceInterimText');
        const finalElement = document.getElementById('voiceFinalText');
        const statusElement = document.getElementById('voiceStatus');
        
        if (interimElement) {
            interimElement.textContent = interimText ? `Listening: "${interimText}"` : '';
        }
        
        if (finalElement && finalText) {
            finalElement.textContent = `Command: "${finalText}"`;
            
            // Clear after a delay if not in free text mode
            if (!this.isListeningForFreeText) {
                setTimeout(() => {
                    if (finalElement) finalElement.textContent = '';
                }, 3000);
            }
        }
        
        if (statusElement) {
            if (this.isListeningForFreeText && this.targetInput) {
                statusElement.innerHTML = `📝 <strong>Typing mode:</strong> ${this.targetInput.placeholder || this.targetInput.id} - Say "done" to finish`;
                statusElement.style.borderLeftColor = '#f59e0b';
            } else {
                statusElement.innerHTML = `🎯 <strong>Command mode:</strong> Ready for voice commands`;
                statusElement.style.borderLeftColor = '#10b981';
            }
        }
    }

    processAdvancedVoiceCommand(command, originalText = '') {
        console.log('Advanced Voice command:', command);
        
        // Handle free text input mode with smart detection
        if (this.isListeningForFreeText && this.targetInput) {
            // Check for commands to stop free text mode
            if (command.includes('stop') || command.includes('done') || command.includes('finished') || command.includes('complete')) {
                this.isListeningForFreeText = false;
                this.targetInput = null;
                this.showAlert('✅ Free text input completed', 'success');
                return;
            }
            
            // Fill the target input with the spoken text
            if (originalText.trim()) {
                this.targetInput.value = originalText;
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.showAlert(`📝 Typed: "${originalText}"`, 'success');
            }
            return;
        }

        // Smart field targeting with natural language
        const smartFillCommands = [
            { 
                patterns: ['fill origin', 'set origin', 'from', 'departure from', 'flying from', 'origin is', 'departing from'], 
                fieldId: 'origin',
                name: 'departure location'
            },
            { 
                patterns: ['fill destination', 'set destination', 'to', 'going to', 'flying to', 'destination is', 'arriving at'], 
                fieldId: 'destination',
                name: 'destination'
            },
            { 
                patterns: ['search destination', 'filter destination', 'find destination'], 
                fieldId: 'searchDestination',
                name: 'search destination filter'
            },
            { 
                patterns: ['search origin', 'filter origin', 'find origin'], 
                fieldId: 'searchOrigin',
                name: 'search origin filter'
            },
            { 
                patterns: ['passengers', 'travelers', 'people', 'passenger count'], 
                fieldId: 'passengers',
                name: 'passenger information'
            },
            { 
                patterns: ['airline', 'carrier', 'flight company'], 
                fieldId: 'airline',
                name: 'preferred airline'
            },
            { 
                patterns: ['notes', 'comments', 'details', 'requirements'], 
                fieldId: 'notes',
                name: 'flight notes'
            }
        ];

        // Enhanced pattern matching for field targeting
        for (const cmd of smartFillCommands) {
            for (const pattern of cmd.patterns) {
                const regex = new RegExp(`\\b${pattern}\\b`, 'i');
                if (regex.test(command)) {
                    const field = document.getElementById(cmd.fieldId);
                    if (field) {
                        // Extract text after the command
                        const afterPattern = command.split(pattern)[1];
                        if (afterPattern && afterPattern.trim()) {
                            // Remove common connecting words
                            const cleanText = afterPattern.replace(/^(is|to|as|with|:|,)\s*/i, '').trim();
                            if (cleanText) {
                                field.value = cleanText;
                                field.dispatchEvent(new Event('input', { bubbles: true }));
                                this.showAlert(`✅ Set ${cmd.name} to: "${cleanText}"`, 'success');
                                return;
                            }
                        } else {
                            // Enter free text mode
                            this.targetInput = field;
                            this.isListeningForFreeText = true;
                            field.focus();
                            this.showAlert(`🎤 Now listening for ${cmd.name}. Say "done" when finished.`, 'info');
                            return;
                        }
                    }
                }
            }
        }

        // Complex search commands
        this.handleComplexSearchCommands(command);

        // Enhanced filter commands with natural language
        this.handleAdvancedFilterCommands(command);

        // Quick actions
        this.handleQuickActions(command);

        // If no specific command matched, show available options
        this.showAlert(`🤔 Command: "${command}" - Try: "Fill origin London", "Search flights to Cyprus under 800", "Show cheap flights"`, 'info');
    }

    handleComplexSearchCommands(command) {
        // Pattern: "search flights to [destination] under [price]"
        const searchPattern = /search.*flights?.*(to|for)\s+([^,]+?)(?:\s+under\s+(\d+))?/i;
        const match = command.match(searchPattern);
        
        if (match) {
            const destination = match[2].trim();
            const price = match[3];
            
            // Set destination
            const destField = document.getElementById('destination') || document.getElementById('searchDestination');
            if (destField) {
                destField.value = destination;
                destField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // Set price filter if specified
            if (price) {
                const priceField = document.getElementById('filterMaxPrice');
                if (priceField) {
                    priceField.value = price;
                    this.filterAutoDeals();
                }
            }
            
            this.showAlert(`🔍 Searching flights to ${destination}${price ? ` under £${price}` : ''}`, 'success');
            return true;
        }

        // Pattern: "find cheap flights to [destination]"
        const cheapPattern = /find\s+(cheap|budget|affordable)\s+flights?.*(to|for)\s+([^,]+)/i;
        const cheapMatch = command.match(cheapPattern);
        
        if (cheapMatch) {
            const destination = cheapMatch[3].trim();
            const destField = document.getElementById('destination') || document.getElementById('searchDestination');
            if (destField) {
                destField.value = destination;
                destField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // Set a reasonable budget filter for "cheap"
            const priceField = document.getElementById('filterMaxPrice');
            if (priceField) {
                priceField.value = '500';
                this.filterAutoDeals();
            }
            
            this.showAlert(`💰 Finding budget flights to ${destination} under £500`, 'success');
            return true;
        }

        return false;
    }

    handleAdvancedFilterCommands(command) {
        // Enhanced destination matching with aliases
        const destinationAliases = {
            'cyprus': ['cyprus', 'larnaca', 'paphos', 'nicosia'],
            'malta': ['malta', 'valletta', 'mla'],
            'tenerife': ['tenerife', 'canary islands', 'canaries', 'tfs'],
            'turkey': ['turkey', 'antalya', 'istanbul', 'bodrum'],
            'crete': ['crete', 'heraklion', 'chania'],
            'athens': ['athens', 'greece athens', 'ath'],
            'spain': ['spain', 'madrid', 'barcelona', 'seville'],
            'italy': ['italy', 'rome', 'milan', 'venice', 'florence']
        };

        // Check for destination commands
        for (const [dest, aliases] of Object.entries(destinationAliases)) {
            if (aliases.some(alias => command.includes(alias))) {
                const destValue = dest === 'crete' ? 'Greece Crete' : 
                                dest === 'athens' ? 'Greece Athens' : 
                                dest.charAt(0).toUpperCase() + dest.slice(1);
                
                const filterField = document.getElementById('filterDestination');
                if (filterField) {
                    filterField.value = destValue;
                    this.filterAutoDeals();
                    this.showAlert(`🌍 Filtering for ${destValue} flights`, 'success');
                    return true;
                }
            }
        }

        // Enhanced price commands with multiple patterns
        const pricePatterns = [
            /(?:under|below|less than|maximum|max|budget)\s*£?(\d+)/i,
            /(?:price|cost)\s*(?:under|below|less than)\s*£?(\d+)/i,
            /£(\d+)\s*(?:or less|maximum|max)/i,
            /budget.*£?(\d+)/i
        ];

        for (const pattern of pricePatterns) {
            const match = command.match(pattern);
            if (match) {
                const price = match[1];
                const priceField = document.getElementById('filterMaxPrice');
                if (priceField) {
                    priceField.value = price;
                    this.filterAutoDeals();
                    this.showAlert(`💷 Filtering flights under £${price}`, 'success');
                    return true;
                }
            }
        }

        // Enhanced airline commands
        const airlineAliases = {
            'British Airways': ['british', 'ba', 'british airways'],
            'Emirates': ['emirates', 'ek'],
            'Qatar Airways': ['qatar', 'qr', 'qatar airways'],
            'Turkish Airlines': ['turkish', 'tk', 'turkish airlines'],
            'Virgin Atlantic': ['virgin', 'vs', 'virgin atlantic'],
            'Ryanair': ['ryanair', 'fr'],
            'EasyJet': ['easyjet', 'easy jet', 'u2'],
            'Lufthansa': ['lufthansa', 'lh']
        };

        for (const [airline, aliases] of Object.entries(airlineAliases)) {
            if (aliases.some(alias => command.includes(alias))) {
                const airlineField = document.getElementById('filterAirline');
                if (airlineField) {
                    airlineField.value = airline;
                    this.filterAutoDeals();
                    this.showAlert(`✈️ Filtering for ${airline} flights`, 'success');
                    return true;
                }
            }
        }

        return false;
    }

    handleQuickActions(command) {
        // Clear/reset commands
        if (command.includes('clear') || command.includes('reset') || command.includes('remove filters')) {
            this.clearAutoDealsFilters();
            this.showAlert('🗑️ All filters cleared', 'success');
            return true;
        }

        // Show specific deal types
        if (command.includes('new deals') || command.includes('show new')) {
            const filterField = document.getElementById('filterStatus');
            if (filterField) {
                filterField.value = 'new';
                this.filterAutoDeals();
                this.showAlert('🆕 Showing new deals only', 'success');
                return true;
            }
        }

        if (command.includes('saved deals') || command.includes('show saved')) {
            const filterField = document.getElementById('filterStatus');
            if (filterField) {
                filterField.value = 'saved';
                this.filterAutoDeals();
                this.showAlert('💾 Showing saved deals only', 'success');
                return true;
            }
        }

        // Search/filter actions
        if (command.includes('search') || command.includes('find flights')) {
            const searchBtn = document.querySelector('button[onclick*="searchFlights"]');
            if (searchBtn) {
                searchBtn.click();
                this.showAlert('🔍 Starting flight search...', 'info');
                return true;
            }
        }

        return false;
    }

    renderAutoDiscoveryCard(deal) {
        const departureDate = new Date(deal.departureDate).toLocaleDateString();
        const returnDate = new Date(deal.returnDate).toLocaleDateString();
        const dateRange = `${departureDate} → ${returnDate}`;
        
        // Enhanced status badges with better styling
        const statusBadge = deal.status === 'new' ? 
            '<span class="status-new">🆕 New Deal</span>' :
            deal.status === 'saved' ? 
            '<span class="status-saved">💾 Saved</span>' : 
            '<span class="status-dismissed">❌ Dismissed</span>';
        
        // Enhanced deal score with colors
        const dealScoreClass = deal.dealScore >= 8 ? 'deal-score-excellent' : 
                              deal.dealScore >= 6 ? 'deal-score-good' : 
                              deal.dealScore >= 4 ? 'deal-score-fair' : 'deal-score-poor';
        
        // Price coloring based on value
        const priceClass = deal.price <= 1000 ? 'price-excellent' :
                          deal.price <= 1200 ? 'price-good' :
                          deal.price <= 1400 ? 'price-fair' : 'price-high';
        
        // Destination-specific styling
        const destClass = `destination-${deal.destination.toLowerCase().replace(' ', '-')}`;
        
        // Airline-specific styling
        const airlineClass = `airline-${deal.airline.toLowerCase().replace(/\s+/g, '-')}`;
        
        return `
            <div class="flight-card ${deal.status === 'new' ? 'border-success' : ''}" style="position: relative; overflow: hidden;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="route-info">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-plane-departure text-primary"></i> 
                            <span class="mx-2 fw-bold">${deal.origin}</span>
                            <i class="fas fa-arrow-right mx-2 text-muted"></i> 
                            <i class="fas fa-plane-arrival text-success"></i> 
                            <span class="mx-2 fw-bold ${destClass}">${deal.destination}</span>
                        </div>
                        <div class="mt-2">${statusBadge}</div>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="badge ${dealScoreClass} text-white me-2 px-3 py-2">
                            ⭐ ${deal.dealScore}/10
                        </span>
                        <div class="price-badge ${priceClass}">£${deal.price}</div>
                    </div>
                </div>
                
                <div class="row flight-details">
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt text-info"></i> 
                            <strong>${dateRange}</strong>
                            <br><small class="text-muted">${deal.duration}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-users text-warning"></i> 
                            <strong>${deal.passengers}</strong>
                            <br><small class="text-muted">Family trip</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-plane text-primary"></i> 
                            <strong class="${airlineClass}">${deal.airline}</strong>
                            <br><small class="text-muted">${deal.flightDetails.stops === 0 ? 'Direct flight' : deal.flightDetails.stops + ' stop(s)'}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-piggy-bank text-success"></i> 
                            <strong class="text-success">Save £${deal.savings}</strong>
                            <br><small class="text-muted">vs £${deal.budget} budget</small>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3 d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-success">
                            <i class="fas fa-robot"></i> Auto-discovered ${new Date(deal.timestamp).toLocaleDateString()}
                        </small>
                        <br>
                        <small class="text-muted">
                            Duration: ${deal.duration} • Stops: ${deal.flightDetails.stops} • Budget: £${deal.budget}
                        </small>
                    </div>
                    <div>
                        ${deal.status === 'new' ? `
                            <button class="btn btn-success btn-sm me-2" onclick="app.addDealToTracker('${deal.id}')">
                                <i class="fas fa-download"></i> Add to Tracker
                            </button>
                        ` : ''}
                        <a href="${deal.flightDetails.deepLink}" target="_blank" class="btn btn-primary btn-sm">
                            <i class="fas fa-external-link-alt"></i> Book Flight
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async importDiscoveredDeals() {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        button.disabled = true;

        try {
            const response = await fetch('/api/discovery/import-deals', {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                this.showAlert(`Successfully imported ${result.imported} new deals to your dashboard!`, 'success');
                this.loadStats();
                this.loadAutoDeals(); // Refresh the auto deals view
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Failed to import deals', 'danger');
            }
        } catch (error) {
            this.showAlert('Network error: ' + error.message, 'danger');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async addDealToTracker(dealId) {
        try {
            const response = await fetch(`/api/discovery/deals/${dealId}/add-to-tracker`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showAlert('Deal added to your flight tracker!', 'success');
                this.loadStats();
                this.loadAutoDeals(); // Refresh to show updated status
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Failed to add deal', 'danger');
            }
        } catch (error) {
            this.showAlert('Network error: ' + error.message, 'danger');
        }
    }

    async searchFlights() {
        const destination = document.getElementById('searchDestination').value.trim();
        const origin = document.getElementById('searchOrigin').value.trim();
        const maxPrice = document.getElementById('searchMaxPrice').value;
        const source = document.getElementById('searchSource').value;

        // If all search fields are empty, show empty state
        if (!destination && !origin && !maxPrice && !source) {
            document.getElementById('searchResults').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h5>Enter search criteria above</h5>
                    <p>Search your saved flights by destination, origin, price range, or booking source</p>
                </div>
            `;
            return;
        }

        const params = new URLSearchParams();
        if (destination) params.append('destination', destination);
        if (origin) params.append('origin', origin);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (source) params.append('source', source);

        try {
            const response = await fetch(`${this.baseURL}/flights?${params}`);
            const results = await response.json();

            const content = document.getElementById('searchResults');
            
            if (results.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h5>No flights found</h5>
                        <p>Try adjusting your search criteria</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <div class="mb-3">
                    <h5><i class="fas fa-search"></i> Found ${results.length} flight${results.length > 1 ? 's' : ''}</h5>
                </div>
                ${results.map(flight => this.renderFlightCard(flight)).join('')}
            `;
        } catch (error) {
            document.getElementById('searchResults').innerHTML = 
                `<div class="alert alert-danger">Search error: ${error.message}</div>`;
        }
    }

    renderFlightCard(flight, rank = null) {
        const departureDate = flight.departureDate ? new Date(flight.departureDate).toLocaleDateString() : 'Date TBD';
        const returnDate = flight.returnDate ? new Date(flight.returnDate).toLocaleDateString() : null;
        const dateRange = returnDate ? `${departureDate} → ${returnDate}` : departureDate;
        
        return `
            <div class="flight-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="route-info">
                        ${rank ? `<span class="badge bg-warning text-dark me-2">#${rank}</span>` : ''}
                        <i class="fas fa-plane-departure"></i> ${flight.origin} 
                        <i class="fas fa-arrow-right mx-2"></i> 
                        <i class="fas fa-plane-arrival"></i> ${flight.destination}
                    </div>
                    <div class="price-badge">£${flight.price}</div>
                </div>
                
                <div class="row flight-details">
                    <div class="col-md-3">
                        <i class="fas fa-calendar-alt"></i> ${dateRange}
                    </div>
                    <div class="col-md-3">
                        <i class="fas fa-users"></i> ${flight.passengers || 'Not specified'}
                    </div>
                    <div class="col-md-3">
                        <i class="fas fa-plane"></i> ${flight.airline || 'Unknown airline'}
                    </div>
                    <div class="col-md-3">
                        <i class="fas fa-globe"></i> ${flight.source || 'Unknown source'}
                    </div>
                </div>
                
                ${flight.notes ? `
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-sticky-note"></i> ${flight.notes}
                        </small>
                    </div>
                ` : ''}
                
                <div class="mt-3 d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-clock"></i> Added ${new Date(flight.timestamp).toLocaleDateString()}
                    </small>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteFlight('${flight.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    async deleteFlight(id) {
        if (!confirm('Are you sure you want to delete this flight?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/flights/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showAlert('Flight deleted successfully!', 'success');
                this.loadStats();
                
                // Reload current tab content
                const activeTab = document.querySelector('.nav-link.active').id;
                if (activeTab === 'best-tab') {
                    this.loadBestDeals();
                } else if (activeTab === 'destinations-tab') {
                    this.loadDestinations();
                } else if (activeTab === 'search-tab') {
                    this.searchFlights();
                }
            } else {
                this.showAlert('Failed to delete flight', 'danger');
            }
        } catch (error) {
            this.showAlert('Network error: ' + error.message, 'danger');
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert.floating-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show floating-alert`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Global search function for the search button
function searchFlights() {
    app.searchFlights();
}

// Initialize the app
const app = new FlightTrackerUI();