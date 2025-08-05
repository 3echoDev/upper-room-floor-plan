// Calendly Integration - Enhanced with proper error handling and prevention of re-assignment
class CalendlyService {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseUrl = 'https://api.calendly.com';
        this.userUri = null; // Cache the user URI
        this.isConfigured = this.accessToken && this.accessToken !== 'PLACEHOLDER_TOKEN_DO_NOT_REPLACE' && this.accessToken.length > 50;
        this.assignedEventIds = new Set(); // Track already assigned events
    }

    // Test if the service is properly configured
    isReady() {
        return this.isConfigured;
    }

    // Get current user info to get the proper user URI
    async getCurrentUser() {
        if (!this.isConfigured) {
            throw new Error('Calendly access token not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('User fetch error:', response.status, errorText);
                throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('User data:', data);
            this.userUri = data.resource.uri; // Cache the full URI
            return data.resource;
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    }

    async getScheduledEvents() {
        if (!this.isConfigured) {
            console.log('Calendly not configured, skipping event fetch');
            return [];
        }

        try {
            // Get user URI if not cached
            if (!this.userUri) {
                console.log('Getting user URI...');
                await this.getCurrentUser();
            }

            // Get today's date in UTC
            const now = new Date();
            const startTime = new Date(now);
            startTime.setHours(0, 0, 0, 0);
            const endTime = new Date(now);
            endTime.setHours(23, 59, 59, 999);

            // Build query parameters with the correct user URI
            const queryParams = new URLSearchParams({
                user: this.userUri, // Use the full URI, not just UUID
                min_start_time: startTime.toISOString(),
                max_start_time: endTime.toISOString(),
                status: 'active'
            });

            const url = `${this.baseUrl}/scheduled_events?${queryParams}`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched events:', data);
            return data.collection || [];
        } catch (error) {
            console.error('Error fetching Calendly events:', error);
            return []; // Return empty array instead of throwing
        }
    }

    // NEW: Get future scheduled events (next 60 days)
    async getFutureScheduledEvents() {
        if (!this.isConfigured) {
            console.log('Calendly not configured, skipping future event fetch');
            return [];
        }

        try {
            // Get user URI if not cached
            if (!this.userUri) {
                console.log('Getting user URI...');
                await this.getCurrentUser();
            }

            // Get future date range (tomorrow to 60 days from now)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + 60);
            endDate.setHours(23, 59, 59, 999);

            // Build query parameters with the correct user URI
            const queryParams = new URLSearchParams({
                user: this.userUri, // Use the full URI, not just UUID
                min_start_time: tomorrow.toISOString(),
                max_start_time: endDate.toISOString(),
                status: 'active'
            });

            const url = `${this.baseUrl}/scheduled_events?${queryParams}`;
            console.log('Fetching future events from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Future events response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Future events API Error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched future events:', data);
            return data.collection || [];
        } catch (error) {
            console.error('Error fetching future Calendly events:', error);
            return []; // Return empty array instead of throwing
        }
    }

    // Get invitees for a specific event
    async getEventInvitees(eventUri) {
        if (!this.isConfigured) {
            return [];
        }

        try {
            const url = `${this.baseUrl}/scheduled_events/${eventUri.split('/').pop()}/invitees`;
            console.log('Fetching invitees from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Invitees fetch error:', response.status, errorText);
                return []; // Return empty array instead of throwing
            }

            const data = await response.json();
            console.log('Fetched invitees:', data);
            return data.collection || [];
        } catch (error) {
            console.error('Error fetching event invitees:', error);
            return []; // Return empty array instead of throwing
        }
    }

    // Get enhanced events with invitee information
    async getEnhancedEvents() {
        if (!this.isConfigured) {
            console.log('Calendly not configured, returning empty array');
            return [];
        }

        try {
            const events = await this.getScheduledEvents();
            const enhancedEvents = [];

            for (const event of events) {
                try {
                const invitees = await this.getEventInvitees(event.uri);
                    enhancedEvents.push({
                    ...event,
                    invitees: invitees
                    });
                } catch (inviteeError) {
                    console.warn('Error fetching invitees for event:', event.uri, inviteeError);
                    // Include event without invitees rather than failing completely
                    enhancedEvents.push({
                        ...event,
                        invitees: []
                    });
                }
            }

            return enhancedEvents;
        } catch (error) {
            console.error('Error getting enhanced events:', error);
            return []; // Return empty array instead of throwing
        }
    }

    // NEW: Get enhanced future events with invitee information
    async getEnhancedFutureEvents() {
        if (!this.isConfigured) {
            console.log('Calendly not configured, returning empty future events array');
            return [];
        }

        try {
            const events = await this.getFutureScheduledEvents();
            const enhancedEvents = [];

            for (const event of events) {
                try {
                    const invitees = await this.getEventInvitees(event.uri);
                    enhancedEvents.push({
                        ...event,
                        invitees: invitees
                    });
                } catch (inviteeError) {
                    console.warn('Error fetching invitees for future event:', event.uri, inviteeError);
                    // Include event without invitees rather than failing completely
                    enhancedEvents.push({
                        ...event,
                        invitees: []
                    });
                }
            }

            return enhancedEvents;
        } catch (error) {
            console.error('Error getting enhanced future events:', error);
            return []; // Return empty array instead of throwing
        }
    }

    // NEW: Get cancelled events from Calendly
    async getCancelledEvents() {
        if (!this.isConfigured) {
            console.log('Calendly not configured, skipping cancelled event fetch');
            return [];
        }

        try {
            // Get user URI if not cached
            if (!this.userUri) {
                console.log('Getting user URI for cancelled events...');
                await this.getCurrentUser();
            }

            // Get date range for last 30 days to capture recent cancellations
            const now = new Date();
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + 60); // Also check future cancellations
            endDate.setHours(23, 59, 59, 999);

            // Build query parameters for cancelled events
            const queryParams = new URLSearchParams({
                user: this.userUri,
                min_start_time: startDate.toISOString(),
                max_start_time: endDate.toISOString(),
                status: 'canceled' // Note: Calendly uses 'canceled' not 'cancelled'
            });

            const url = `${this.baseUrl}/scheduled_events?${queryParams}`;
            console.log('Fetching cancelled events from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Cancelled events response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cancelled events API Error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched cancelled events:', data);
            return data.collection || [];
        } catch (error) {
            console.error('Error fetching cancelled Calendly events:', error);
            return [];
        }
    }

    // Check if an event has already been assigned a table using multiple identifiers
    async isEventAlreadyAssigned(eventId, customerName, phoneNumber, startTime) {
        try {
            // **NEW: Check if the event is in the past - mark as already assigned to prevent re-assignment**
            if (startTime) {
                const eventTime = new Date(startTime);
                const now = new Date();
                const currentTime = now.getTime();
                const eventStartTime = eventTime.getTime();
                
                // If the event start time is more than 30 minutes in the past, consider it already assigned
                const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);
                if (eventStartTime < thirtyMinutesAgo) {
                    console.log(`⏰ PAST EVENT DETECTED: ${customerName || 'Unknown'} at ${eventTime.toLocaleString()}`);
                    console.log(`Current time: ${now.toLocaleString()}`);
                    console.log(`Event time: ${eventTime.toLocaleString()}`);
                    console.log(`Time difference: ${Math.round((currentTime - eventStartTime) / 60000)} minutes`);
                    console.log(`✅ Marking past event as already assigned to prevent re-assignment after staff deletion`);
                    
                    // Mark this event as assigned to prevent future processing
                    this.assignedEventIds.add(eventId);
                    
                    // Also mark by unique key and time key
                    const uniqueKey = this.createUniqueKey(customerName, phoneNumber, startTime);
                    if (uniqueKey) this.assignedEventIds.add(uniqueKey);
                    
                    const timeKey = this.createTimeKey(startTime);
                    if (timeKey) this.assignedEventIds.add(timeKey);
                    
                    return true;
                }
            }
            
            // Check local tracking first by event ID
            if (this.assignedEventIds.has(eventId)) {
                console.log(`Event ${eventId} already tracked as assigned`);
                return true;
            }

            // Check by unique key based on customer details
            const uniqueKey = this.createUniqueKey(customerName, phoneNumber, startTime);
            if (uniqueKey && this.assignedEventIds.has(uniqueKey)) {
                console.log(`Unique key ${uniqueKey} already tracked as assigned`);
                return true;
            }
            
            // **NEW: Check by time-based key for exact time matches**
            const timeKey = this.createTimeKey(startTime);
            if (timeKey && this.assignedEventIds.has(timeKey)) {
                console.log(`Time key ${timeKey} already tracked as assigned`);
                return true;
            }
            
            // **NEW: Check for no-customer bookings at the same time**
            if ((!customerName || customerName === 'Calendly Booking') && timeKey) {
                const noCustomerKey = `calendly_no_customer_${timeKey}`;
                if (this.assignedEventIds.has(noCustomerKey)) {
                    console.log(`No-customer key ${noCustomerKey} already tracked as assigned`);
                    return true;
                }
            }

            // **ENHANCED: More robust check using customer details and time**
            if (startTime) {
                const eventTime = new Date(startTime);
                
                // Check local tables for matching reservations
                for (const table of tables) {
                    for (const reservation of table.reservations) {
                        if (reservation.source === 'calendly') {
                            const resTime = new Date(reservation.startTime);
                            const timeDiff = Math.abs(eventTime - resTime);
                            
                            // **NEW: Check for exact time match first (most reliable)**
                            const exactTimeMatch = timeDiff < 60000; // Within 1 minute
                            
                            // Check for same customer name and similar time (within 5 minutes)
                            const sameCustomerSimilarTime = customerName && 
                                reservation.customerName === customerName && 
                                timeDiff < 300000;
                            
                            // Check for same phone number and similar time (within 5 minutes)
                            const samePhoneSimilarTime = phoneNumber && 
                                reservation.phoneNumber === phoneNumber && 
                                timeDiff < 300000;
                            
                            // **NEW: Check for Calendly bookings without customer info at same time**
                            const sameTimeNoCustomer = exactTimeMatch && 
                                (!reservation.customerName || reservation.customerName === 'Calendly Booking') &&
                                (!customerName || customerName === 'Calendly Booking');
                            
                            if (exactTimeMatch || sameCustomerSimilarTime || samePhoneSimilarTime || sameTimeNoCustomer) {
                                console.log(`Found existing assignment for ${customerName || phoneNumber} at similar time`);
                                console.log('Duplicate details:', {
                                    existing: {
                                        customerName: reservation.customerName,
                                        phoneNumber: reservation.phoneNumber,
                                        time: reservation.startTime,
                                        tableId: reservation.tableId
                                    },
                                    new: {
                                        customerName: customerName,
                                        phoneNumber: phoneNumber,
                                        time: startTime
                                    },
                                    timeDiff: timeDiff / 1000 + ' seconds'
                                });
                                this.assignedEventIds.add(eventId);
                                if (uniqueKey) this.assignedEventIds.add(uniqueKey);
                                return true;
                            }
                        }
                    }
                }

                // Check Airtable for existing assignments with same customer details
                if (window.airtableService) {
                    try {
                        const reservations = await window.airtableService.getReservations();
                        const duplicateReservation = reservations.find(res => {
                            // First check exact Reservation_ID match
                            if (res.Reservation_ID === `C5-${eventTime.getFullYear()}-${String(eventTime.getMonth() + 1).padStart(2, '0')}-${String(eventTime.getDate()).padStart(2, '0')}-${String(eventTime.getHours()).padStart(2, '0')}:${String(eventTime.getMinutes()).padStart(2, '0')}pm`) {
                                return true;
                            }

                            if (res.reservationType && res.reservationType.toLowerCase() === 'calendly') {
                                const resTime = new Date(res.time);
                                const timeDiff = Math.abs(eventTime - resTime);
                                
                                // Check for same customer name and similar time
                                if (res.customerName === customerName && timeDiff < 300000) {
                                    return true;
                                }
                                
                                // Check for same phone number and similar time
                                if (phoneNumber && res.phoneNumber === phoneNumber && timeDiff < 300000) {
                                    return true;
                                }
                            }
                            return false;
                        });

                        if (duplicateReservation) {
                            console.log(`Found duplicate in Airtable for ${customerName || phoneNumber}`);
                            this.assignedEventIds.add(eventId);
                            if (uniqueKey) this.assignedEventIds.add(uniqueKey);
                            return true;
                        }
                    } catch (airtableError) {
                        console.warn('Error checking Airtable for duplicates:', airtableError);
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking if event is assigned:', error);
            return false; // Assume not assigned if we can't check
        }
    }

    // Mark an event as assigned
    markEventAsAssigned(eventId, customerName = null, phoneNumber = null, startTime = null) {
        this.assignedEventIds.add(eventId);
        
        // Also track unique key based on customer details
        const uniqueKey = this.createUniqueKey(customerName, phoneNumber, startTime);
        if (uniqueKey) {
            this.assignedEventIds.add(uniqueKey);
            console.log(`Marked as assigned: ${eventId} and ${uniqueKey}`);
        }
        
        // **NEW: Also track time-based key for exact time matching**
        const timeKey = this.createTimeKey(startTime);
        if (timeKey) {
            this.assignedEventIds.add(timeKey);
            console.log(`Marked time as assigned: ${timeKey}`);
        }
        
        // **NEW: Track no-customer bookings separately**
        if ((!customerName || customerName === 'Calendly Booking') && timeKey) {
            const noCustomerKey = `calendly_no_customer_${timeKey}`;
            this.assignedEventIds.add(noCustomerKey);
            console.log(`Marked no-customer booking as assigned: ${noCustomerKey}`);
        }
    }

    // Load existing assignments from tables and Airtable to prevent duplicates
    async loadExistingAssignments() {
        try {
            console.log('Loading existing Calendly assignments...');
            
            // Check local tables first
            for (const table of tables) {
                for (const reservation of table.reservations) {
                    if (reservation.source === 'calendly') {
                        // **ENHANCED: Create multiple unique identifiers for better tracking**
                        
                        // 1. Create unique identifier using customer details + time
                        const uniqueKey = this.createUniqueKey(
                            reservation.customerName, 
                            reservation.phoneNumber, 
                            reservation.startTime
                        );
                        
                        if (uniqueKey) {
                            this.assignedEventIds.add(uniqueKey);
                            console.log(`Tracked existing local assignment: ${uniqueKey}`);
                        }
                        
                        // **NEW: 2. Create time-based identifier for exact time matches**
                        const timeKey = this.createTimeKey(reservation.startTime);
                        if (timeKey) {
                            this.assignedEventIds.add(timeKey);
                            console.log(`Tracked existing time-based assignment: ${timeKey}`);
                        }
                        
                        // **NEW: 3. Create identifier for Calendly bookings without customer info**
                        if (!reservation.customerName || reservation.customerName === 'Calendly Booking') {
                            const noCustomerKey = `calendly_no_customer_${timeKey}`;
                            this.assignedEventIds.add(noCustomerKey);
                            console.log(`Tracked existing no-customer assignment: ${noCustomerKey}`);
                        }
                        
                        // Also track any event IDs from notes if available
                        const notes = reservation.customerNotes || reservation.systemNotes || '';
                        const eventIdMatch = notes.match(/events\/[a-zA-Z0-9-]+/);
                        if (eventIdMatch) {
                            this.assignedEventIds.add(eventIdMatch[0]);
                        }
                    }
                }
            }
            
            // Check Airtable if available
            if (window.airtableService) {
                const reservations = await window.airtableService.getReservations();
                reservations.forEach(res => {
                    if (res.reservationType && res.reservationType.toLowerCase() === 'calendly') {
                        // **ENHANCED: Create multiple identifiers for Airtable reservations**
                        
                        // 1. Create unique identifier for Airtable reservations
                        const uniqueKey = this.createUniqueKey(
                            res.customerName, 
                            res.phoneNumber, 
                            res.time
                        );
                        
                        if (uniqueKey) {
                            this.assignedEventIds.add(uniqueKey);
                            console.log(`Tracked existing Airtable assignment: ${uniqueKey}`);
                        }
                        
                        // **NEW: 2. Create time-based identifier for exact time matches**
                        const timeKey = this.createTimeKey(res.time);
                        if (timeKey) {
                            this.assignedEventIds.add(timeKey);
                            console.log(`Tracked existing Airtable time assignment: ${timeKey}`);
                        }
                        
                        // **NEW: 3. Create identifier for Calendly bookings without customer info**
                        if (!res.customerName || res.customerName === 'Calendly Booking') {
                            const noCustomerKey = `calendly_no_customer_${timeKey}`;
                            this.assignedEventIds.add(noCustomerKey);
                            console.log(`Tracked existing Airtable no-customer assignment: ${noCustomerKey}`);
                        }
                        
                        // Also track event IDs from notes
                        const notes = res.customerNotes || res.systemNotes || '';
                        const eventIdMatch = notes.match(/events\/[a-zA-Z0-9-]+/);
                        if (eventIdMatch) {
                            this.assignedEventIds.add(eventIdMatch[0]);
                        }
                    }
                });
            }
            
            console.log(`Loaded ${this.assignedEventIds.size} existing Calendly assignments`);
        } catch (error) {
            console.error('Error loading existing assignments:', error);
        }
    }

    // Create a unique key from customer details and time
    createUniqueKey(customerName, phoneNumber, startTime) {
        if (!startTime) return null;
        
        const timeStr = new Date(startTime).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        
        // Use phone number as primary identifier if available
        if (phoneNumber) {
            return `phone_${phoneNumber}_${timeStr}`;
        }
        
        // Fall back to customer name if no phone
        if (customerName) {
            return `name_${customerName.toLowerCase().replace(/\s+/g, '_')}_${timeStr}`;
        }
        
        return null;
    }
    
    // **NEW: Create a time-based key for exact time matching**
    createTimeKey(startTime) {
        if (!startTime) return null;
        
        const timeStr = new Date(startTime).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        return `time_${timeStr}`;
    }
}

// Initialize Calendly Service with the actual working access token
const CALENDLY_ACCESS_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQ4NDA0NTgxLCJqdGkiOiI2M2I0MzE5My04YzBkLTQyNWItYWI1YS0zMDc4Njk2OTIwN2EiLCJ1c2VyX3V1aWQiOiI0MWEyNmI2OS0zOTZkLTRmYTMtOGY1NC00NTVjMjBiMWJkMTcifQ.dSoALi-LvbGvjnDOt7mnjMVB1K7XuPw8I0QeXsZpLgYM81pczqog43VokxR1v3Mdp3oGKFgxVyMPynIFfqbB3Q';
const calendlyService = new CalendlyService(CALENDLY_ACCESS_TOKEN);

// Function to format date and time in SGT
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return {
        date: date.toLocaleDateString('en-US', { 
            timeZone: 'Asia/Singapore',
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Singapore',
            hour: '2-digit', 
            minute: '2-digit'
        })
    };
}

// Test function to validate connection
async function testCalendlyConnection() {
    try {
        console.log('Testing Calendly connection...');
        
        // Test user endpoint first
        const user = await calendlyService.getCurrentUser();
        console.log('✅ Successfully connected to Calendly');
        console.log('User URI:', user.uri);
        
        // Test events endpoint with enhanced details
        const events = await calendlyService.getEnhancedEvents();
        console.log('✅ Successfully fetched enhanced events');
        console.log(`Found ${events.length} events for today`);
        
        // Log sample event details for debugging
        if (events.length > 0) {
            console.log('Sample event details:', events[0]);
        }
        
        return true; // Indicate success
    } catch (error) {
        console.error('❌ Calendly connection test failed:', error);
        return false;
    }
}

// Update Calendly bookings display and handle intelligent assignment
async function updateCalendlyBookings() {
    const bookingsContainer = document.getElementById('calendly-bookings');
    const loadingElement = document.getElementById('calendly-loading');
    
    if (!bookingsContainer) {
        console.warn('Calendly bookings container not found');
        return;
    }

    // Check if Calendly is properly configured
    if (!calendlyService.isReady()) {
        bookingsContainer.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card border-info">
                        <div class="card-body text-center py-4">
                            <i class="bi bi-info-circle display-5 text-info mb-3"></i>
                            <h6 class="text-info mb-2">Calendly integration not configured</h6>
                            <p class="text-muted">Configure access token to enable automatic booking assignment</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Show loading state
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    try {
        console.log('Fetching Calendly events...');
        const events = await calendlyService.getEnhancedEvents();
        
        if (events.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="card text-center">
                            <div class="card-body py-5">
                                <i class="bi bi-calendar-x display-4 text-muted mb-3"></i>
                                <h5 class="text-muted mb-3">No Calendly bookings for today</h5>
                                <p class="text-muted">New bookings will appear here automatically</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let pastEventCount = 0;

        let bookingsHtml = '';
        const bookingsForAssignment = [];
        
        for (const event of events) {
            try {
                // Check if this event has already been assigned
                const eventId = event.uri;
                const isAlreadyAssigned = await calendlyService.isEventAlreadyAssigned(
                    eventId, 
                    event.name, 
                    event.invitees && event.invitees.length > 0 ? event.invitees[0].phone : null, 
                    event.start_time
                );
                
                // **NEW: Check if this is a past event**
                const eventStartTime = new Date(event.start_time);
                const now = new Date();
                const currentTime = now.getTime();
                const eventStartTimeMs = eventStartTime.getTime();
                const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);
                const isPastEvent = eventStartTimeMs < thirtyMinutesAgo;
                
                const startDateTime = formatDateTime(event.start_time);
                const endDateTime = formatDateTime(event.end_time);

                // Get invitee details
                let inviteeDetails = '';
                let paxCount = 2; // Default pax count
                let phoneNumber = 'N/A';
                let customerName = 'Calendly Booking';
                let specialRequest = 'N/A';
                
                if (event.invitees && event.invitees.length > 0) {
                    for (const invitee of event.invitees) {
                        const name = invitee.name || 'N/A';
                        const email = invitee.email || 'N/A';
                        
                        // Use the first invitee's name as customer name
                        if (customerName === 'Calendly Booking' && name !== 'N/A') {
                            customerName = name;
                        }
                        
                        // Extract form responses
                        if (invitee.questions_and_answers) {
                            for (const qa of invitee.questions_and_answers) {
                                const question = qa.question.toLowerCase();
                                const answer = qa.answer || 'N/A';
                                
                                if (question.includes('phone') || question.includes('number')) {
                                    phoneNumber = answer;
                                } else if (question.includes('pax') || question.includes('guest') || question.includes('people')) {
                                    const extractedPax = parseInt(answer);
                                    if (!isNaN(extractedPax) && extractedPax > 0) {
                                        paxCount = extractedPax;
                                    }
                                } else if (question.includes('special') || question.includes('request') || question.includes('note')) {
                                    specialRequest = answer;
                                }
                            }
                        }

                        inviteeDetails += `
                            <div class="mt-2 p-2 bg-light rounded">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-person me-1"></i><strong>Name:</strong> ${name}
                                        </small>
                                        <small class="text-muted d-block">
                                            <i class="bi bi-envelope me-1"></i><strong>Email:</strong> ${email}
                                        </small>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-telephone me-1"></i><strong>Phone:</strong> ${phoneNumber}
                                        </small>
                                        <small class="text-muted d-block">
                                            <i class="bi bi-people me-1"></i><strong>Pax:</strong> ${paxCount}
                                        </small>
                                    </div>
                                    ${specialRequest !== 'N/A' ? `
                                        <div class="col-12">
                                            <small class="text-muted d-block">
                                                <i class="bi bi-chat-text me-1"></i><strong>Special Request:</strong> ${specialRequest}
                                            </small>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }
                }

                // Check if this booking has been assigned to a table
                let assignedTableInfo = '';
                const assignedTable = tables.find(table => 
                    table.reservations.some(res => 
                        res.source === 'calendly' && 
                        (
                            (res.customerName === customerName && Math.abs(new Date(res.startTime) - new Date(event.start_time)) < 300000) ||
                            (phoneNumber !== 'N/A' && res.phoneNumber === phoneNumber && Math.abs(new Date(res.startTime) - new Date(event.start_time)) < 300000)
                        )
                    )
                );

                if (isPastEvent) {
                    // **NEW: Past event - show as completed and don't try to assign**
                    pastEventCount++;
                    assignedTableInfo = `
                        <div class="d-flex align-items-center justify-content-between bg-secondary bg-opacity-10 rounded p-2">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-clock-history text-secondary me-2"></i>
                                <span class="text-secondary fw-bold">Past Reservation</span>
                            </div>
                            <small class="text-secondary">
                                ${Math.round((currentTime - eventStartTimeMs) / 60000)} min ago
                            </small>
                        </div>
                    `;
                } else if (assignedTable || isAlreadyAssigned) {
                    // Mark as assigned in service
                    calendlyService.markEventAsAssigned(eventId, customerName, phoneNumber, event.start_time);
                    
                    assignedTableInfo = `
                        <div class="d-flex align-items-center justify-content-between bg-success bg-opacity-10 rounded p-2">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-check-circle text-success me-2"></i>
                                <span class="text-success fw-bold">Table ${assignedTable ? assignedTable.id : 'Assigned'}</span>
                            </div>
                            <small class="text-success">
                                ${assignedTable ? `${assignedTable.capacity} pax capacity` : 'Assigned'}
                            </small>
                        </div>
                    `;
                } else {
                    // **FIXED: This booking needs assignment - add to queue (only if not past)**
                    const bookingForAssignment = {
                        eventId: eventId,
                        startTime: new Date(event.start_time),
                        endTime: new Date(event.end_time),
                        pax: paxCount,
                        customerName: customerName,
                        phoneNumber: phoneNumber !== 'N/A' ? phoneNumber : null,
                        specialRequest: specialRequest !== 'N/A' ? specialRequest : null
                    };
                    
                    bookingsForAssignment.push(bookingForAssignment);
                    
                    assignedTableInfo = `
                        <div class="d-flex align-items-center justify-content-between bg-warning bg-opacity-10 rounded p-2">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-hourglass-split text-warning me-2"></i>
                                <span class="text-warning fw-bold">Auto-assigning...</span>
                            </div>
                            <div class="spinner-border spinner-border-sm text-warning" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    `;
                }

                // Build the booking HTML as a card instead of list item
                const headerClass = isPastEvent ? 'bg-secondary' : 'bg-primary';
                const headerTextClass = isPastEvent ? 'text-white' : 'text-white';
                
                bookingsHtml += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100 shadow-sm ${isPastEvent ? 'opacity-75' : ''}">
                            <div class="card-header ${headerClass} ${headerTextClass}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">
                                        <i class="bi ${isPastEvent ? 'bi-clock-history' : 'bi-clock'} me-1"></i>
                                        ${startDateTime.time} - ${endDateTime.time}
                                    </h6>
                                    <small class="opacity-75">${startDateTime.date}</small>
                                </div>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title text-primary mb-2">
                                    <i class="bi bi-calendar-event me-1"></i>
                                    ${event.name || 'Dine-In Reservation'}
                                </h6>
                                
                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-person me-1"></i><strong>Customer</strong>
                                        </small>
                                        <span class="fw-bold">${customerName}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-people me-1"></i><strong>Guests</strong>
                                        </small>
                                        <span class="fw-bold">${paxCount} pax</span>
                                    </div>
                                </div>
                                
                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-telephone me-1"></i><strong>Phone</strong>
                                        </small>
                                        <span class="fw-bold">${phoneNumber}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-hourglass-split me-1"></i><strong>Duration</strong>
                                        </small>
                                        <span class="fw-bold">${Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000)} min</span>
                                    </div>
                                </div>
                                
                                ${specialRequest !== 'N/A' ? `
                                    <div class="mb-3">
                                        <small class="text-muted d-block">
                                            <i class="bi bi-chat-text me-1"></i><strong>Special Request</strong>
                                        </small>
                                        <span class="text-break">${specialRequest}</span>
                                    </div>
                                ` : ''}
                                
                                <div class="mb-2">
                                    <small class="text-muted d-block">
                                        <i class="bi bi-info-circle me-1"></i><strong>System Note</strong>
                                    </small>
                                    <span class="text-muted small">${isPastEvent ? 'Past reservation - not reassigned after completion' : 'Automatically assigned from Calendly booking'}</span>
                                </div>
                            </div>
                            
                            <div class="card-footer p-2">
                                ${assignedTableInfo}
                            </div>
                        </div>
                    </div>
                `;
            } catch (eventError) {
                console.error('Error processing individual event:', eventError);
                // Continue processing other events
            }
        }

        bookingsContainer.innerHTML = `<div class="row">${bookingsHtml}</div>`;



        // Automatically assign unassigned bookings with priority rules (skip past events)
        if (bookingsForAssignment.length > 0) {
            console.log(`Found ${bookingsForAssignment.length} unassigned Calendly bookings. Auto-assigning based on priority rules...`);
            
            try {
                // Process unassigned bookings with priority rules
                const normalizedBookings = bookingsForAssignment.map(booking => normalizeCalendlyBooking(booking));
                const assignmentResults = await processCalendlyBookings(normalizedBookings);
                
                // Mark successfully assigned events
                assignmentResults.successful.forEach(result => {
                    calendlyService.markEventAsAssigned(result.booking.eventId, result.booking.customerName, result.booking.phoneNumber, result.booking.startTime);
                });
                
                console.log('Auto-assignment results:', assignmentResults);
                
                // Update UI after processing all bookings
                if (assignmentResults.summary.assigned > 0) {
                    initialize(); // Refresh the UI
                    updateReservationCount();
                    updateFloorPlanTableStatuses();
                    
                    // **IMPORTANT: Refresh the Calendly bookings display to show updated assignments**
                    console.log('🔄 Refreshing Calendly bookings display to show new assignments...');
                    setTimeout(() => {
                        updateCalendlyBookings(); // Re-run this function to show updated status
                    }, 2000); // Small delay to ensure Airtable is updated
                    
                    // Show success message with more details
                    const successMessage = `Successfully assigned ${assignmentResults.summary.assigned} Calendly booking(s) to tables!`;
                    showSuccessMessage(successMessage);
                    
                    // Log detailed assignment information
                    console.log('Assignment Summary:', {
                        successful: assignmentResults.successful.map(s => ({
                            customer: s.booking.customerName,
                            pax: s.booking.pax,
                            time: s.booking.startTime.toLocaleString(),
                            assignedTable: s.assignment.table.id
                        })),
                        failed: assignmentResults.failed
                    });
                }
                
                // Show summary for failed assignments
                if (assignmentResults.summary.failed > 0) {
                    console.warn(`Failed to assign ${assignmentResults.summary.failed} booking(s)`);
                    
                    // Show detailed failure information
                    assignmentResults.failed.forEach(failure => {
                        console.warn('Failed booking:', failure.booking, 'Error:', failure.error);
                    });
                    
                    // Show user-friendly error message
                    const failedDetails = assignmentResults.failed.map(f => 
                        `${f.booking.customerName || 'Unknown'} (${f.booking.pax} pax) - ${f.error}`
                    ).join('\n');
                    
                    alert(`Some Calendly bookings could not be assigned:\n\n${failedDetails}\n\nPlease assign these manually or check for table availability.`);
                }
                
                return assignmentResults;
            } catch (assignmentError) {
                console.error('Error during automatic table assignment:', assignmentError);
            }
        } else {
            console.log('All Calendly bookings are already assigned to tables.');
        }

        // NEW: Also process cancelled bookings whenever we refresh the display
        console.log('🔄 Processing cancelled Calendly bookings...');
        try {
            await processCancelledCalendlyBookings();
        } catch (cancelError) {
            console.error('Error processing cancelled bookings during refresh:', cancelError);
        }

    } catch (error) {
        console.error('Error updating Calendly bookings:', error);
        const bookingsContainer = document.getElementById('calendly-bookings');
        if (bookingsContainer) {
        bookingsContainer.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="card border-danger">
                            <div class="card-body text-center py-4">
                                <i class="bi bi-exclamation-circle display-5 text-danger mb-3"></i>
                                <h6 class="text-danger mb-2">Calendly integration error</h6>
                                <p class="text-muted mb-3">${error.message}</p>
                                <button class="btn btn-outline-danger btn-sm" onclick="updateCalendlyBookings()">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Try Again
                                </button>
                            </div>
                        </div>
                    </div>
            </div>
        `;
        }
    } finally {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// NEW: Calculate duration for future booking based on time (before 5:30pm = 60 min, after 5:30pm = 90 min)
function calculateDurationForFutureBooking(startTime) {
    const eventDate = new Date(startTime);
    const eventHour = eventDate.getHours();
    const eventMinute = eventDate.getMinutes();
    
    // Convert to minutes since midnight
    const eventTimeInMinutes = eventHour * 60 + eventMinute;
    const cutoffTime = 17 * 60 + 30; // 5:30 PM in minutes
    
    if (eventTimeInMinutes < cutoffTime) {
        return 60; // 60 minutes before 5:30 PM
    } else {
        return 90; // 90 minutes after 5:30 PM
    }
}

// NEW: Normalize future Calendly booking with proper duration
function normalizeFutureCalendlyBooking(booking) {
    const duration = calculateDurationForFutureBooking(booking.startTime);
    const endTime = new Date(booking.startTime.getTime() + (duration * 60 * 1000));
    
    return {
        id: `calendly_future_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        pax: booking.pax,
        startTime: booking.startTime,
        endTime: endTime,
        duration: duration,
        status: 'confirmed',
        source: 'calendly',
        systemNotes: 'Automatically assigned from future Calendly booking',
        customerNotes: booking.specialRequest || '',
        priority: 'high',
        eventId: booking.eventId
    };
}

// NEW: Process future Calendly bookings (no UI display, only backend processing)
async function processFutureCalendlyBookings() {
    if (!calendlyService.isReady()) {
        console.log('Calendly not configured, skipping future booking processing');
        return;
    }

    try {
        console.log('Processing future Calendly bookings...');
        
        // IMPORTANT: Load existing assignments first - this is what prevents duplicates
        await calendlyService.loadExistingAssignments();
        
        const futureEvents = await calendlyService.getEnhancedFutureEvents();
        
        if (futureEvents.length === 0) {
            console.log('No future Calendly bookings found.');
            return;
        }
        
        console.log(`Found ${futureEvents.length} future Calendly events to process.`);
        const futureBookingsForAssignment = [];

        for (const event of futureEvents) {
            try {
                // Check if this event has already been assigned
                const eventId = event.uri;
                const customerName = event.invitees?.[0]?.name || 'Calendly Booking';
                const phoneNumber = event.invitees?.[0]?.questions_and_answers?.find(qa => 
                    qa.question.toLowerCase().includes('phone'))?.answer || null;
                
                // Use the same duplicate check as today's bookings
                const isAlreadyAssigned = await calendlyService.isEventAlreadyAssigned(
                    eventId, 
                    customerName,
                    phoneNumber,
                    event.start_time
                );

                if (isAlreadyAssigned) {
                    console.log(`Skipping future booking - already assigned: ${customerName}`);
                    continue;
                }
                
                // **NEW: Check if this is a past event (for future bookings that might be in the past)**
                const eventStartTime = new Date(event.start_time);
                const now = new Date();
                const currentTime = now.getTime();
                const eventStartTimeMs = eventStartTime.getTime();
                const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);
                const isPastEvent = eventStartTimeMs < thirtyMinutesAgo;
                
                if (isPastEvent) {
                    console.log(`Skipping past future booking - event is in the past: ${customerName} at ${eventStartTime.toLocaleString()}`);
                    continue;
                }

                // Get invitee details
                let paxCount = 2; // Default pax count
                let specialRequest = null;
                
                if (event.invitees && event.invitees.length > 0) {
                    for (const invitee of event.invitees) {
                        // Extract form responses
                        if (invitee.questions_and_answers) {
                            for (const qa of invitee.questions_and_answers) {
                                const question = qa.question.toLowerCase();
                                const answer = qa.answer || 'N/A';
                                
                                if (question.includes('pax') || question.includes('guest') || question.includes('people')) {
                                    const extractedPax = parseInt(answer);
                                    if (!isNaN(extractedPax) && extractedPax > 0) {
                                        paxCount = extractedPax;
                                    }
                                } else if (question.includes('special') || question.includes('request') || question.includes('note')) {
                                    specialRequest = answer !== 'N/A' ? answer : null;
                                }
                            }
                        }
                    }
                }

                // Add to queue for assignment
                const bookingForAssignment = {
                    eventId: eventId,
                    startTime: new Date(event.start_time),
                    endTime: new Date(event.end_time),
                    pax: paxCount,
                    customerName: customerName,
                    phoneNumber: phoneNumber,
                    specialRequest: specialRequest
                };
                
                futureBookingsForAssignment.push(bookingForAssignment);
                console.log(`Future booking queued for assignment: ${customerName}`);
            } catch (eventError) {
                console.error('Error processing individual future event:', eventError);
                // Continue processing other future events
            }
        }

        // Automatically assign unassigned future bookings with priority rules
        if (futureBookingsForAssignment.length > 0) {
            console.log(`Found ${futureBookingsForAssignment.length} unassigned future Calendly bookings. Auto-assigning...`);
            
            try {
                // Process unassigned future bookings with proper duration calculation
                const normalizedFutureBookings = futureBookingsForAssignment.map(booking => normalizeFutureCalendlyBooking(booking));
                const futureAssignmentResults = await processCalendlyBookings(normalizedFutureBookings);
                
                // Mark successfully assigned future events
                futureAssignmentResults.successful.forEach(result => {
                    // IMPORTANT: Mark as assigned in the service - this prevents duplicates on refresh
                    calendlyService.markEventAsAssigned(
                        result.booking.eventId, 
                        result.booking.customerName, 
                        result.booking.phoneNumber, 
                        result.booking.startTime
                    );
                });
                
                console.log(`Successfully assigned ${futureAssignmentResults.summary.assigned} future Calendly booking(s)`);
                
                // Update reservations if assignments were made (NO UI refresh needed for future bookings)
                if (futureAssignmentResults.summary.assigned > 0) {
                    updateReservationCount();
                }
                
                // Log failed future assignments for debugging
                if (futureAssignmentResults.summary.failed > 0) {
                    console.warn(`Failed to assign ${futureAssignmentResults.summary.failed} future booking(s)`);
                }
                
                return futureAssignmentResults;
            } catch (futureAssignmentError) {
                console.error('Error during future automatic table assignment:', futureAssignmentError);
            }
        } else {
            console.log('All future Calendly bookings are already assigned.');
        }
    } catch (error) {
        console.error('Error processing future Calendly bookings:', error);
    }
}

// NEW: Process and save cancelled Calendly bookings to Airtable
async function processCancelledCalendlyBookings() {
    if (!calendlyService.isReady()) {
        console.log('Calendly not configured, skipping cancelled booking processing');
        return;
    }

    if (!window.airtableService) {
        console.log('Airtable not available, skipping cancelled booking save');
        return;
    }

    try {
        console.log('🚫 Processing cancelled Calendly bookings...');
        
        const cancelledEvents = await calendlyService.getCancelledEvents();
        
        if (cancelledEvents.length === 0) {
            console.log('✅ No cancelled Calendly bookings found (this is normal).');
            return;
        }
        
        console.log(`📋 Found ${cancelledEvents.length} cancelled Calendly events to process.`);
        
        let processedCount = 0;
        let skippedCount = 0;
        
        for (const event of cancelledEvents) {
            try {
                // Debug: Log the full event object to see available fields
                console.log('Processing cancelled event:', event);
                
                // Extract cancellation reason from event object
                let cancellationReason = null;
                let cancelledBy = null;
                
                // Check various possible fields for cancellation information
                if (event.cancellation && event.cancellation.reason) {
                    cancellationReason = event.cancellation.reason;
                    cancelledBy = event.cancellation.canceled_by;
                } else if (event.cancellation_reason) {
                    cancellationReason = event.cancellation_reason;
                } else if (event.cancel_reason) {
                    cancellationReason = event.cancel_reason;
                } else if (event.reason) {
                    cancellationReason = event.reason;
                }
                
                // Also check for cancellation details in event object itself
                if (event.canceled_by) {
                    cancelledBy = event.canceled_by;
                }
                
                console.log('Extracted cancellation reason:', cancellationReason);
                console.log('Cancelled by:', cancelledBy);
                
                // Get invitee details
                let customerName = 'Calendly Booking';
                let phoneNumber = null;
                let paxCount = 2;
                let specialRequest = null;
                
                const invitees = await calendlyService.getEventInvitees(event.uri);
                
                if (invitees && invitees.length > 0) {
                    const invitee = invitees[0];
                    customerName = invitee.name || customerName;
                    
                    if (invitee.questions_and_answers) {
                        for (const qa of invitee.questions_and_answers) {
                            const question = qa.question.toLowerCase();
                            const answer = qa.answer || '';
                            
                            if (question.includes('phone') || question.includes('number')) {
                                phoneNumber = answer;
                            } else if (question.includes('pax') || question.includes('guest') || question.includes('people')) {
                                const extractedPax = parseInt(answer);
                                if (!isNaN(extractedPax) && extractedPax > 0) {
                                    paxCount = extractedPax;
                                }
                            } else if (question.includes('special') || question.includes('request') || question.includes('note')) {
                                specialRequest = answer;
                            }
                        }
                    }
                }
                
                // Find the existing "Reserved" record in Airtable that matches this cancelled event
                const existingReservations = await window.airtableService.getReservations();
                const eventTime = new Date(event.start_time);
                
                const existingReservation = existingReservations.find(res => {
                    if (res.reservationType && res.reservationType.toLowerCase() === 'calendly' && res.status !== 'Cancelled') {
                        const resTime = new Date(res.time);
                        const timeDiff = Math.abs(eventTime - resTime);
                        
                        // Check for same customer and similar time (within 5 minutes)
                        return (res.customerName === customerName && timeDiff < 300000) ||
                               (phoneNumber && res.phoneNumber === phoneNumber && timeDiff < 300000);
                    }
                    return false;
                });
                
                if (!existingReservation) {
                    console.log(`⚠️ No existing reservation found for cancelled event: ${customerName}`);
                    skippedCount++;
                    continue;
                }
                
                if (existingReservation.status === 'Cancelled') {
                    console.log(`⏭️ Reservation already marked as cancelled: ${customerName}`);
                    skippedCount++;
                    continue;
                }
                
                // UPDATE the existing reservation status from "Reserved" to "Cancelled"
                const updateFields = {
                    "Status": "Cancelled"
                };
                
                // Add cancellation reason to Customer Notes (append to existing notes)
                let existingNotes = existingReservation.customerNotes || "";
                let cancellationNote = "";
                
                if (cancellationReason) {
                    cancellationNote = cancellationReason;
                    // Add who cancelled if available
                    if (cancelledBy) {
                        cancellationNote = `Cancelled by ${cancelledBy}: ${cancellationReason}`;
                    }
                } else {
                    cancellationNote = "Cancelled via Calendly";
                }
                
                // Append cancellation reason to existing notes
                if (existingNotes) {
                    updateFields["Customer Notes"] = `${existingNotes}\n\n[CANCELLED] ${cancellationNote}`;
                } else {
                    updateFields["Customer Notes"] = `[CANCELLED] ${cancellationNote}`;
                }
                
                // Update system notes to include cancellation info
                let existingSystemNotes = existingReservation.systemNotes || "";
                if (existingSystemNotes) {
                    updateFields["System Notes"] = `${existingSystemNotes}\n\nCancelled via Calendly - Event URI: ${event.uri}`;
                } else {
                    updateFields["System Notes"] = `Cancelled Calendly booking - Event URI: ${event.uri}`;
                }

                console.log(`🔄 Updating existing reservation to cancelled status: ${customerName} (Record ID: ${existingReservation.id})`);

                // Update the existing record in Airtable
                const result = await window.airtableService.base('tbl9dDLnVa5oLEnuq').update([
                    {
                        id: existingReservation.id,
                        fields: updateFields
                    }
                ]);
                
                console.log(`✅ Updated reservation status to Cancelled: ${customerName} (ID: ${result[0].id})`);
                processedCount++;
                
            } catch (eventError) {
                console.error('❌ Error processing cancelled event:', eventError);
                // Continue processing other events
            }
        }
        
        // Show summary of processing results
        console.log(`📊 Cancelled booking processing complete: ${processedCount} saved, ${skippedCount} skipped (already existed), ${cancelledEvents.length - processedCount - skippedCount} failed`);
        
    } catch (error) {
        console.error('Error processing cancelled Calendly bookings:', error);
    }
}

// Update Calendly bookings on page load and periodically
window.addEventListener('load', async function() {
    console.log('Page loaded, checking Calendly configuration...');
    
    // Only initialize if Calendly is properly configured
    if (!calendlyService.isReady()) {
        console.log('Calendly not configured, skipping integration');
        const bookingsContainer = document.getElementById('calendly-bookings');
        if (bookingsContainer) {
            bookingsContainer.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="card border-info">
                            <div class="card-body text-center py-4">
                                <i class="bi bi-info-circle display-5 text-info mb-3"></i>
                                <h6 class="text-info mb-2">Calendly integration not configured</h6>
                                <p class="text-muted">Configure access token to enable automatic booking assignment</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    try {
    // Test connection first
        console.log('Testing Calendly connection...');
    const connectionOk = await testCalendlyConnection();
    
    if (connectionOk) {
            console.log('Calendly connection successful, loading bookings...');
            
            // Load existing assignments first to prevent duplicates
            await calendlyService.loadExistingAssignments();
            
            // **NEW: Clean up any existing duplicate Calendly reservations**
            if (window.cleanupDuplicateCalendlyReservations) {
                try {
                    const cleanupResult = await window.cleanupDuplicateCalendlyReservations();
                    if (cleanupResult.success && cleanupResult.cleanedCount > 0) {
                        console.log(`🧹 Cleaned up ${cleanupResult.cleanedCount} duplicate Calendly reservations`);
                    }
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up duplicate reservations:', cleanupError);
                }
            }
            
        updateCalendlyBookings();
            
            // NEW: Process future Calendly bookings
            processFutureCalendlyBookings();
            
            // NEW: Process cancelled Calendly bookings
            processCancelledCalendlyBookings();
            
            // Update every 5 minutes for real-time assignment
        setInterval(updateCalendlyBookings, 300000);
            
            // NEW: Process future bookings every 30 minutes
            setInterval(processFutureCalendlyBookings, 1800000);
            
            // NEW: Process cancelled bookings every 15 minutes
            setInterval(processCancelledCalendlyBookings, 900000);
            
            console.log('Calendly integration initialized successfully - Auto-assignment enabled for today and future bookings');
    } else {
        console.error('Failed to initialize Calendly integration');
            const bookingsContainer = document.getElementById('calendly-bookings');
            if (bookingsContainer) {
                bookingsContainer.innerHTML = `
                    <div class="row">
                        <div class="col-12">
                            <div class="card border-warning">
                                <div class="card-body text-center py-4">
                                    <i class="bi bi-exclamation-triangle display-5 text-warning mb-3"></i>
                                    <h6 class="text-warning mb-2">Failed to connect to Calendly</h6>
                                    <p class="text-muted mb-3">Check access token and try again</p>
                                    <button class="btn btn-outline-warning btn-sm" onclick="updateCalendlyBookings()">
                                        <i class="bi bi-arrow-clockwise me-1"></i>Retry Connection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error during Calendly initialization:', error);
        const bookingsContainer = document.getElementById('calendly-bookings');
        if (bookingsContainer) {
            bookingsContainer.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="card border-danger">
                            <div class="card-body text-center py-4">
                                <i class="bi bi-exclamation-circle display-5 text-danger mb-3"></i>
                                <h6 class="text-danger mb-2">Calendly integration error</h6>
                                <p class="text-muted mb-3">${error.message}</p>
                                <button class="btn btn-outline-danger btn-sm" onclick="updateCalendlyBookings()">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}); 