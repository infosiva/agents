// Flight Deals Discovery UI JavaScript

class FlightDealsUI {
    constructor() {
        this.baseURL = '/api';
        this.isDiscoveryRunning = false;
        this.refreshInterval = null;
        this.isVoiceControlActive = false;
        this.recognition = null;
        this.notificationsEnabled = false;
        this.notificationInterval = null;
        this.notificationSettings = {
            frequency: 15, // minutes
            minScore: 5,
            maxPrice: 1500,
            destinations: ['Cyprus', 'Malta', 'Tenerife']
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadDeals();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Discovery toggle button
        document.getElementById('discoveryToggle').addEventListener('click', () => {
            this.toggleDiscovery();
        });

        // Tab switching
        document.getElementById('new-tab').addEventListener('click', () => this.loadDeals('new'));
        document.getElementById('all-tab').addEventListener('click', () => this.loadDeals('all'));
        document.getElementById('saved-tab').addEventListener('click', () => this.loadDeals('saved'));
        document.getElementById('notifications-tab').addEventListener('click', () => this.loadNotificationSettings());
        document.getElementById('settings-tab').addEventListener('click', () => this.loadCurrentSettings());

        // Settings form
        document.getElementById('discoverySettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateDiscoverySettings();
        });
    }

    async toggleDiscovery() {
        const btn = document.getElementById('discoveryToggle');
        const status = document.getElementById('discoveryStatus');

        try {
            if (this.isDiscoveryRunning) {
                // Stop discovery
                const response = await fetch(`${this.baseURL}/discovery/stop`, { method: 'POST' });
                if (response.ok) {
                    this.isDiscoveryRunning = false;
                    btn.innerHTML = '<i class="fas fa-play"></i> Start Discovery';
                    status.innerHTML = '<i class="fas fa-pause"></i> Discovery Stopped';
                    this.showAlert('Auto-discovery stopped', 'info');
                }
            } else {
                // Start discovery
                const response = await fetch(`${this.baseURL}/discovery/start`, { method: 'POST' });
                if (response.ok) {
                    this.isDiscoveryRunning = true;
                    btn.innerHTML = '<i class="fas fa-stop"></i> Stop Discovery';
                    status.innerHTML = '<div class="loading-spinner"></div> Discovering deals...';
                    this.showAlert('Auto-discovery started! Deals will appear automatically.', 'success');
                }
            }
        } catch (error) {
            this.showAlert('Error toggling discovery: ' + error.message, 'danger');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseURL}/discovery/stats`);
            const stats = await response.json();

            document.getElementById('totalDeals').textContent = stats.total;
            document.getElementById('newDeals').textContent = stats.newDeals;
            document.getElementById('savedDeals').textContent = stats.saved;
            document.getElementById('avgPrice').textContent = `£${stats.avgPrice}`;
            document.getElementById('newCount').textContent = stats.newDeals;

            // Update discovery status
            this.isDiscoveryRunning = stats.isRunning;
            const btn = document.getElementById('discoveryToggle');
            const status = document.getElementById('discoveryStatus');

            if (stats.isRunning) {
                btn.innerHTML = '<i class="fas fa-stop"></i> Stop Discovery';
                status.innerHTML = '<div class="loading-spinner"></div> Discovering deals...';
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Start Discovery';
                status.innerHTML = '<i class="fas fa-pause"></i> Discovery Stopped';
            }

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadDeals(filter = 'new') {
        const contentMap = {
            'new': 'newDealsContent',
            'all': 'allDealsContent',
            'saved': 'savedDealsContent'
        };

        const contentDiv = document.getElementById(contentMap[filter]);
        if (!contentDiv) return;

        try {
            const response = await fetch(`${this.baseURL}/discovery/deals?filter=${filter}`);
            const deals = await response.json();

            if (deals.length === 0) {
                contentDiv.innerHTML = this.getEmptyState(filter);
                return;
            }

            contentDiv.innerHTML = deals.map(deal => this.renderDealCard(deal)).join('');

        } catch (error) {
            contentDiv.innerHTML = `<div class="alert alert-danger">Error loading deals: ${error.message}</div>`;
        }
    }

    getEmptyState(filter) {
        const states = {
            'new': {
                icon: 'fas fa-search',
                title: 'No new deals yet',
                message: 'New deals will appear here as they are discovered automatically!'
            },
            'all': {
                icon: 'fas fa-plane',
                title: 'No deals discovered yet',
                message: 'Start the auto-discovery to see flight deals appear here'
            },
            'saved': {
                icon: 'fas fa-heart',
                title: 'No saved deals',
                message: 'Save deals you\'re interested in and they\'ll appear here'
            }
        };

        const state = states[filter];
        return `
            <div class="empty-state">
                <i class="${state.icon}"></i>
                <h5>${state.title}</h5>
                <p>${state.message}</p>
            </div>
        `;
    }

    renderDealCard(deal) {
        const isGreatDeal = deal.isGoodDeal;
        const statusClass = `status-${deal.status}`;
        const cardClass = `deal-card ${deal.status}-deal ${isGreatDeal ? 'great-deal' : ''}`;
        
        // Enhanced styling based on deal properties
        const dealScoreClass = deal.dealScore >= 8 ? 'deal-score-excellent' : 
                              deal.dealScore >= 6 ? 'deal-score-good' : 
                              deal.dealScore >= 4 ? 'deal-score-fair' : 'deal-score-poor';
        
        const priceClass = deal.price <= 1000 ? 'price-excellent-deals' :
                          deal.price <= 1200 ? 'price-good-deals' :
                          deal.price <= 1400 ? 'price-fair-deals' : 'price-high-deals';
        
        const destClass = `destination-${deal.destination.toLowerCase().replace(/\s+/g, '-')}`;
        const airlineClass = `airline-${deal.airline.toLowerCase().replace(/\s+/g, '-')}`;

        return `
            <div class="${cardClass}">
                <div class="${dealScoreClass}">⭐ ${deal.dealScore}/10</div>
                
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="route-info">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-map-marker-alt text-danger me-2"></i> 
                            <span class="${destClass} fs-5">${deal.destination}</span>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-plane-departure text-primary"></i> ${deal.origin} 
                            <i class="fas fa-arrow-right mx-2"></i> 
                            <i class="fas fa-plane-arrival text-success"></i> ${deal.destinationCode}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="price-badge ${priceClass}">£${deal.price}</div>
                        ${deal.savings > 0 ? `<div class="savings-badge mt-2">💰 Save £${deal.savings}</div>` : ''}
                    </div>
                </div>
                
                <div class="deal-details row">
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt text-info me-1"></i> 
                            <strong>${this.formatDate(deal.departureDate)} → ${this.formatDate(deal.returnDate)}</strong>
                            <br><small class="text-muted">📅 ${deal.duration}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-plane text-primary me-1"></i> 
                            <strong class="${airlineClass}">${deal.airline}</strong>
                            <br><small class="text-muted">
                                ${deal.flightDetails.stops === 0 ? '✈️ Direct flight' : `🔄 ${deal.flightDetails.stops} stop(s)`}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item">
                            <i class="fas fa-users text-warning me-1"></i> 
                            <strong>${deal.passengers}</strong>
                            <br><small class="text-muted">👨‍👩‍👧‍👦 Family trip</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="detail-item text-center">
                            <span class="status-badge ${statusClass} mb-2">
                                ${deal.status === 'new' ? '🆕' : deal.status === 'saved' ? '💾' : '❌'} 
                                ${deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                            </span>
                            <br><small class="text-muted">⏰ Found ${this.timeAgo(deal.timestamp)}</small>
                        </div>
                    </div>
                </div>
                
                ${isGreatDeal ? `
                    <div class="alert alert-warning" style="margin: 15px 0; background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107;">
                        ⭐ <strong>GREAT DEAL!</strong> This is ${Math.round(((deal.budget - deal.price) / deal.budget) * 100)}% under your budget!
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="deal-actions">
                        ${deal.status === 'new' ? `
                            <button class="btn btn-save" onclick="app.saveDeal('${deal.id}')">
                                <i class="fas fa-heart"></i> Save Deal
                            </button>
                            <button class="btn btn-dismiss" onclick="app.dismissDeal('${deal.id}')">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        ` : deal.status === 'saved' ? `
                            <button class="btn btn-success" disabled>
                                <i class="fas fa-check"></i> Saved
                            </button>
                            <button class="btn btn-outline-secondary" onclick="app.addToTracker('${deal.id}')">
                                <i class="fas fa-plus"></i> Add to Tracker
                            </button>
                        ` : `
                            <button class="btn btn-secondary" disabled>
                                <i class="fas fa-times"></i> Dismissed
                            </button>
                        `}
                    </div>
                    
                    <div class="deal-info">
                        <small class="text-muted">
                            Budget: £${deal.budget} | Score: ${deal.dealScore}/10
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    async saveDeal(dealId) {
        try {
            const response = await fetch(`${this.baseURL}/discovery/deals/${dealId}/save`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showAlert('Deal saved!', 'success');
                this.loadStats();
                this.loadDeals('new');
            } else {
                this.showAlert('Failed to save deal', 'danger');
            }
        } catch (error) {
            this.showAlert('Error saving deal: ' + error.message, 'danger');
        }
    }

    async dismissDeal(dealId) {
        try {
            const response = await fetch(`${this.baseURL}/discovery/deals/${dealId}/dismiss`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showAlert('Deal dismissed', 'info');
                this.loadStats();
                this.loadDeals('new');
            } else {
                this.showAlert('Failed to dismiss deal', 'danger');
            }
        } catch (error) {
            this.showAlert('Error dismissing deal: ' + error.message, 'danger');
        }
    }

    async addToTracker(dealId) {
        try {
            const response = await fetch(`${this.baseURL}/discovery/deals/${dealId}/add-to-tracker`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showAlert('Deal added to your flight tracker!', 'success');
            } else {
                this.showAlert('Failed to add to tracker', 'danger');
            }
        } catch (error) {
            this.showAlert('Error adding to tracker: ' + error.message, 'danger');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
    }

    timeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInHours = (now - time) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return `${Math.floor(diffInHours / 24)}d ago`;
        }
    }

    startAutoRefresh() {
        // Refresh stats and current tab every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadStats();
            
            // Refresh current active tab
            const activeTab = document.querySelector('.nav-link.active').id;
            if (activeTab === 'new-tab') this.loadDeals('new');
            else if (activeTab === 'all-tab') this.loadDeals('all');
            else if (activeTab === 'saved-tab') this.loadDeals('saved');
        }, 30000);
        
        // Start auto-discovery every 5 minutes
        setInterval(() => {
            if (this.isDiscoveryRunning) {
                this.triggerAutoDiscovery();
            }
        }, 300000); // 5 minutes
    }

    async loadCurrentSettings() {
        try {
            const response = await fetch(`${this.baseURL}/discovery/settings`);
            const settings = await response.json();
            
            // Populate form with current settings
            document.getElementById('settingsAdults').value = settings.travelers.adults;
            document.getElementById('settingsChildren').value = settings.travelers.children;
            document.getElementById('settingsMaxBudget').value = settings.budget.total || 1500;
            document.getElementById('settingsMinScore').value = settings.minDealScore || 5;
            document.getElementById('settingsStartDate').value = settings.dates.startDate;
            document.getElementById('settingsEndDate').value = settings.dates.endDate;
            document.getElementById('settingsDuration').value = settings.tripDuration || '7';
            document.getElementById('settingsMaxStops').value = settings.maxStops || '1';
            
            // Update destination checkboxes
            const destinations = settings.destinations.map(d => d.name.toLowerCase().replace(' ', ''));
            document.getElementById('destCyprus').checked = destinations.includes('cyprus');
            document.getElementById('destMalta').checked = destinations.includes('malta');
            document.getElementById('destTenerife').checked = destinations.includes('tenerife');
            document.getElementById('destCrete').checked = destinations.includes('greececrete');
            document.getElementById('destAthens').checked = destinations.includes('greeceathens');
            document.getElementById('destTurkey').checked = destinations.includes('turkey');
            document.getElementById('destPortugal').checked = destinations.includes('portugal');
            document.getElementById('destSpain').checked = destinations.includes('spain');
            
            // Update stats
            this.updateSettingsStats(settings);
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showAlert('Failed to load current settings', 'warning');
        }
    }

    updateSettingsStats(settings) {
        const searchConfigs = settings.searchConfigs || 0;
        document.getElementById('searchConfigs').textContent = searchConfigs;
        document.getElementById('activeSearches').textContent = this.isDiscoveryRunning ? '1' : '0';
        document.getElementById('lastUpdated').textContent = settings.lastUpdated 
            ? new Date(settings.lastUpdated).toLocaleTimeString() 
            : 'Never';
    }

    async updateDiscoverySettings() {
        const button = document.querySelector('#discoverySettingsForm button[type="submit"]');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        button.disabled = true;

        try {
            // Collect form data
            const selectedDestinations = [];
            const destinationMap = {
                'destCyprus': { name: 'Cyprus', code: 'LCA' },
                'destMalta': { name: 'Malta', code: 'MLA' },
                'destTenerife': { name: 'Tenerife', code: 'TFS' },
                'destCrete': { name: 'Greece Crete', code: 'HER' },
                'destAthens': { name: 'Greece Athens', code: 'ATH' },
                'destTurkey': { name: 'Turkey', code: 'IST' },
                'destPortugal': { name: 'Portugal', code: 'LIS' },
                'destSpain': { name: 'Spain', code: 'MAD' }
            };

            Object.keys(destinationMap).forEach(id => {
                if (document.getElementById(id).checked) {
                    selectedDestinations.push(destinationMap[id]);
                }
            });

            const settings = {
                travelers: {
                    adults: parseInt(document.getElementById('settingsAdults').value),
                    children: parseInt(document.getElementById('settingsChildren').value)
                },
                budget: {
                    total: parseInt(document.getElementById('settingsMaxBudget').value),
                    perPerson: Math.round(parseInt(document.getElementById('settingsMaxBudget').value) / 
                        (parseInt(document.getElementById('settingsAdults').value) + parseInt(document.getElementById('settingsChildren').value)))
                },
                dates: {
                    startDate: document.getElementById('settingsStartDate').value,
                    endDate: document.getElementById('settingsEndDate').value
                },
                destinations: selectedDestinations,
                airports: ['LHR', 'LGW', 'STN'], // Default UK airports
                tripDuration: document.getElementById('settingsDuration').value,
                minDealScore: parseInt(document.getElementById('settingsMinScore').value),
                maxStops: document.getElementById('settingsMaxStops').value === 'any' ? 
                    null : parseInt(document.getElementById('settingsMaxStops').value)
            };

            const response = await fetch(`${this.baseURL}/discovery/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                const result = await response.json();
                this.showAlert(`✅ Settings updated! Discovery will restart with new preferences. ${result.searchConfigs} search configurations generated.`, 'success');
                this.updateSettingsStats({ 
                    searchConfigs: result.searchConfigs, 
                    lastUpdated: new Date().toISOString() 
                });
                this.loadStats(); // Refresh main stats
            } else {
                const error = await response.json();
                this.showAlert('Failed to update settings: ' + error.error, 'danger');
            }
        } catch (error) {
            this.showAlert('Error updating settings: ' + error.message, 'danger');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
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
        this.lastCommand = '';

        this.recognition.onstart = () => {
            this.isVoiceControlActive = true;
            const btn = document.getElementById('voiceControlBtnDeals');
            btn.innerHTML = '<i class="fas fa-microphone"></i><br>Stop Voice';
            btn.className = 'btn voice-btn-active-deals w-100 h-100';
            
            // Create voice feedback area if it doesn't exist
            this.createVoiceFeedbackArea();
            
            this.showAlert('🎤 Advanced Voice Control Active! Try: "Start discovery", "Save first deal", "Set budget 1000", "Show new deals"', 'success');
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
        
        const btn = document.getElementById('voiceControlBtnDeals');
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i><br>Voice Control';
        btn.className = 'btn voice-btn-inactive-deals w-100 h-100';
        
        // Remove voice feedback area
        const feedbackArea = document.getElementById('voiceFeedbackAreaDeals');
        if (feedbackArea) {
            feedbackArea.remove();
        }
        
        this.showAlert('Voice control stopped', 'info');
    }

    createVoiceFeedbackArea() {
        // Remove existing feedback area
        const existing = document.getElementById('voiceFeedbackAreaDeals');
        if (existing) {
            existing.remove();
        }

        // Create new feedback area
        const feedbackArea = document.createElement('div');
        feedbackArea.id = 'voiceFeedbackAreaDeals';
        feedbackArea.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95));
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
                <div style="width: 12px; height: 12px; background: #fbbf24; border-radius: 50%; margin-right: 10px; animation: pulse 1.5s infinite;"></div>
                🎤 Deals Voice Control
            </div>
            <div id="voiceInterimTextDeals" style="opacity: 0.8; font-style: italic; min-height: 24px; font-size: 15px; color: #dcfce7; line-height: 1.4;"></div>
            <div id="voiceFinalTextDeals" style="font-weight: 600; min-height: 24px; font-size: 15px; line-height: 1.4; margin: 8px 0;"></div>
            <div id="voiceStatusDeals" style="font-size: 13px; margin-top: 12px; opacity: 0.9; padding: 8px 12px; background: rgba(255,255,255,0.15); border-radius: 8px; border-left: 3px solid #fbbf24;"></div>
            <div style="margin-top: 12px; font-size: 11px; opacity: 0.7; line-height: 1.3;">
                💡 Try: "Start discovery", "Save deal", "Set budget 1000", "Show new deals"
            </div>
        `;
        
        document.body.appendChild(feedbackArea);
    }

    updateVoiceFeedback(interimText, finalText) {
        const interimElement = document.getElementById('voiceInterimTextDeals');
        const finalElement = document.getElementById('voiceFinalTextDeals');
        const statusElement = document.getElementById('voiceStatusDeals');
        
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
                statusElement.innerHTML = `🎯 <strong>Command mode:</strong> Ready for deal commands`;
                statusElement.style.borderLeftColor = '#fbbf24';
            }
        }
    }

    processAdvancedVoiceCommand(command, originalText = '') {
        console.log('Advanced Voice command (Deals):', command);
        
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

        // Smart budget and settings commands
        const budgetPattern = /(?:budget|set budget|maximum budget)\s*(?:to|is|of)?\s*£?(\d+)/i;
        const budgetMatch = command.match(budgetPattern);
        if (budgetMatch) {
            const budget = budgetMatch[1];
            const budgetInput = document.getElementById('settingsMaxBudget');
            if (budgetInput) {
                budgetInput.value = budget;
                budgetInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.showAlert(`💰 Budget set to £${budget}`, 'success');
                return;
            }
        }

        // Enhanced deal interaction commands
        if (command.includes('save') && (command.includes('deal') || command.includes('first') || command.includes('this'))) {
            const saveButton = document.querySelector('button[onclick*="saveDeal"]:not([style*="display: none"])');
            if (saveButton) {
                saveButton.click();
                this.showAlert('💾 Deal saved!', 'success');
                return;
            }
        }
        
        if (command.includes('dismiss') && (command.includes('deal') || command.includes('first') || command.includes('this'))) {
            const dismissButton = document.querySelector('button[onclick*="dismissDeal"]:not([style*="display: none"])');
            if (dismissButton) {
                dismissButton.click();
                this.showAlert('🗑️ Deal dismissed', 'info');
                return;
            }
        }

        if (command.includes('add to tracker') || command.includes('track this') || command.includes('add first')) {
            const addButton = document.querySelector('button[onclick*="addToTracker"]:not([style*="display: none"])');
            if (addButton) {
                addButton.click();
                this.showAlert('📊 Added to tracker!', 'success');
                return;
            }
        }

        // Enhanced discovery control with natural language
        if (command.includes('start') && (command.includes('discovery') || command.includes('searching') || command.includes('finding'))) {
            if (!this.isDiscoveryRunning) {
                this.toggleDiscovery();
                this.showAlert('🚀 Discovery started!', 'success');
            } else {
                this.showAlert('🔄 Discovery is already running', 'info');
            }
            return;
        }
        
        if (command.includes('stop') && (command.includes('discovery') || command.includes('searching') || command.includes('finding'))) {
            if (this.isDiscoveryRunning) {
                this.toggleDiscovery();
                this.showAlert('⏹️ Discovery stopped', 'info');
            } else {
                this.showAlert('⏸️ Discovery is already stopped', 'info');
            }
            return;
        }

        // Enhanced tab navigation with natural language
        const tabCommands = [
            { patterns: ['show new', 'new deals', 'latest deals', 'recent deals'], tabId: 'new-tab', name: 'New Deals' },
            { patterns: ['show all', 'all deals', 'every deal'], tabId: 'all-tab', name: 'All Deals' },
            { patterns: ['show saved', 'saved deals', 'my deals'], tabId: 'saved-tab', name: 'Saved Deals' },
            { patterns: ['settings', 'configure', 'preferences', 'options'], tabId: 'settings-tab', name: 'Settings' },
            { patterns: ['notifications', 'alerts', 'notification settings'], tabId: 'notifications-tab', name: 'Notifications' }
        ];

        for (const tab of tabCommands) {
            if (tab.patterns.some(pattern => command.includes(pattern))) {
                const tabElement = document.getElementById(tab.tabId);
                if (tabElement) {
                    tabElement.click();
                    this.showAlert(`📋 Switched to ${tab.name}`, 'success');
                    return;
                }
            }
        }

        // Enhanced notification commands
        if (command.includes('enable') && command.includes('notification')) {
            if (!this.notificationsEnabled) {
                this.toggleNotifications();
                this.showAlert('🔔 Notifications enabled!', 'success');
            } else {
                this.showAlert('🔔 Notifications are already enabled', 'info');
            }
            return;
        }
        
        if (command.includes('disable') && command.includes('notification')) {
            if (this.notificationsEnabled) {
                this.toggleNotifications();
                this.showAlert('🔕 Notifications disabled', 'info');
            } else {
                this.showAlert('🔕 Notifications are already disabled', 'info');
            }
            return;
        }

        // Smart settings update
        if (command.includes('save settings') || command.includes('update settings') || command.includes('apply settings')) {
            const activeTab = document.querySelector('.tab-pane.active');
            if (activeTab && activeTab.id === 'discovery-settings') {
                const settingsForm = document.getElementById('discoverySettingsForm');
                if (settingsForm) {
                    settingsForm.dispatchEvent(new Event('submit'));
                    this.showAlert('⚙️ Settings saved!', 'success');
                    return;
                }
            }
        }

        // Enhanced filtering with numbers
        const filterCommands = [
            { patterns: ['show.*new', 'filter.*new', 'only new'], value: 'new', field: 'filterStatus' },
            { patterns: ['show.*saved', 'filter.*saved', 'only saved'], value: 'saved', field: 'filterStatus' },
            { patterns: ['show.*all', 'show everything', 'clear filter'], value: '', field: 'filterStatus' }
        ];

        for (const filter of filterCommands) {
            if (filter.patterns.some(pattern => new RegExp(pattern, 'i').test(command))) {
                const filterElement = document.getElementById(filter.field);
                if (filterElement) {
                    filterElement.value = filter.value;
                    filterElement.dispatchEvent(new Event('change'));
                    this.showAlert(`🔍 Filter applied: ${filter.value || 'All deals'}`, 'success');
                    return;
                }
            }
        }

        // If no specific command matched, show available options
        this.showAlert(`🤔 Command: "${command}" - Try: "Start discovery", "Save deal", "Set budget 1000", "Show new deals"`, 'info');
    }
            return;
        }
        
        // Navigation commands
        if (command.includes('go home') || command.includes('main dashboard')) {
            window.location.href = '/';
            return;
        }

        // If no specific command matched, show available options
        this.showAlert(`🤔 Command: "${command}" - Try: "Start discovery", "Save deal", "Set budget 1000", "Show new deals"`, 'info');
    }
    
    async triggerAutoDiscovery() {
        try {
            const response = await fetch(`${this.baseURL}/discovery/trigger`, { method: 'POST' });
            if (response.ok) {
                console.log('Auto-discovery triggered successfully');
                this.loadStats();
                this.loadDeals('new');
            }
        } catch (error) {
            console.error('Auto-discovery trigger failed:', error);
        }
    }
    
    toggleNotifications() {
        if (this.notificationsEnabled) {
            this.stopNotifications();
        } else {
            this.startNotifications();
        }
    }
    
    async startNotifications() {
        // Request notification permission
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.showAlert('Notification permission denied. Please enable notifications in your browser settings.', 'warning');
                return;
            }
        } else {
            this.showAlert('Notifications are not supported in this browser.', 'warning');
            return;
        }
        
        this.notificationsEnabled = true;
        const btn = document.getElementById('notificationBtn');
        btn.innerHTML = '<i class="fas fa-bell"></i><br>Stop Notifications';
        btn.className = 'btn notification-btn-active w-100 h-100';
        
        const status = document.getElementById('notificationStatus');
        status.innerHTML = '<i class="fas fa-bell"></i> Notifications Active';
        status.className = 'notification-status active';
        
        this.showAlert('Notifications enabled! You\'ll be alerted about new deals.', 'success');
        
        // Start checking for new deals
        this.startNotificationChecks();
    }
    
    stopNotifications() {
        this.notificationsEnabled = false;
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        
        const btn = document.getElementById('notificationBtn');
        btn.innerHTML = '<i class="fas fa-bell-slash"></i><br>Notifications';
        btn.className = 'btn notification-btn-inactive w-100 h-100';
        
        const status = document.getElementById('notificationStatus');
        status.innerHTML = '<i class="fas fa-bell-slash"></i> Notifications Off';
        status.className = 'notification-status';
        
        this.showAlert('Notifications disabled', 'info');
    }
    
    startNotificationChecks() {
        this.lastDealsCount = 0;
        
        this.notificationInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.baseURL}/discovery/deals?filter=new`);
                const newDeals = await response.json();
                
                const qualifyingDeals = newDeals.filter(deal => 
                    deal.dealScore >= this.notificationSettings.minScore &&
                    deal.price <= this.notificationSettings.maxPrice &&
                    this.notificationSettings.destinations.includes(deal.destination)
                );
                
                if (qualifyingDeals.length > this.lastDealsCount) {
                    const newDealsFound = qualifyingDeals.length - this.lastDealsCount;
                    this.sendNotification(`${newDealsFound} new flight deal${newDealsFound > 1 ? 's' : ''} found!`, 
                        `Best deal: ${qualifyingDeals[0]?.destination} for £${qualifyingDeals[0]?.price}`);
                }
                
                this.lastDealsCount = qualifyingDeals.length;
                document.getElementById('lastNotificationCheck').textContent = new Date().toLocaleTimeString();
                
            } catch (error) {
                console.error('Notification check failed:', error);
            }
        }, this.notificationSettings.frequency * 60000);
    }
    
    sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
            
            notification.onclick = () => {
                window.focus();
                document.getElementById('new-tab').click();
                notification.close();
            };
            
            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        }
    }
    
    loadNotificationSettings() {
        document.getElementById('notificationFrequency').value = this.notificationSettings.frequency;
        document.getElementById('notificationMinScore').value = this.notificationSettings.minScore;
        document.getElementById('notificationMaxPrice').value = this.notificationSettings.maxPrice;
        
        // Update destination checkboxes
        document.getElementById('notifyCyprus').checked = this.notificationSettings.destinations.includes('Cyprus');
        document.getElementById('notifyMalta').checked = this.notificationSettings.destinations.includes('Malta');
        document.getElementById('notifyTenerife').checked = this.notificationSettings.destinations.includes('Tenerife');
        
        // Update status
        document.getElementById('notificationStatusText').textContent = this.notificationsEnabled ? 'Active' : 'Disabled';
    }
    
    saveNotificationSettings() {
        this.notificationSettings.frequency = parseInt(document.getElementById('notificationFrequency').value);
        this.notificationSettings.minScore = parseInt(document.getElementById('notificationMinScore').value);
        this.notificationSettings.maxPrice = parseInt(document.getElementById('notificationMaxPrice').value);
        
        // Update destinations
        this.notificationSettings.destinations = [];
        if (document.getElementById('notifyCyprus').checked) this.notificationSettings.destinations.push('Cyprus');
        if (document.getElementById('notifyMalta').checked) this.notificationSettings.destinations.push('Malta');
        if (document.getElementById('notifyTenerife').checked) this.notificationSettings.destinations.push('Tenerife');
        
        this.showAlert('Notification settings saved!', 'success');
        
        // Restart notifications with new settings if they're active
        if (this.notificationsEnabled) {
            this.stopNotifications();
            setTimeout(() => this.startNotifications(), 1000);
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

// Initialize the app
const app = new FlightDealsUI();