// Airtable Config
const AIRTABLE_CONFIG = {
    apiKey: 'patFAhxAehjS7ooW4.065ff8cc4680ea7a527f2315d465c76dc530b6fd692f4ad456ca75bd9aa1af9d',
    baseId: 'appHXyKvdB7cU3qF7'
};

// AirtableService Class
class AirtableService {
    constructor() {
        if (typeof Airtable === 'undefined') {
            throw new Error('Airtable library not loaded');
        }
        
        try {
            this.base = new Airtable({
                apiKey: AIRTABLE_CONFIG.apiKey
            }).base(AIRTABLE_CONFIG.baseId);
            this.cachedReservations = [];
            this.lastFetchTime = null;
            this.fetchingPromise = null;
        } catch (error) {
            console.error('Error initializing Airtable:', error);
            throw error;
        }
    }

    async deleteReservation(recordId) {
        try {
            console.log('Deleting reservation:', recordId);
            await this.base('tbl9dDLnVa5oLEnuq').destroy([recordId]);
            
            // Clear the cache so we fetch fresh data
            this.cachedReservations = [];
            this.lastFetchTime = null;
            
            console.log('Successfully deleted reservation');
            return true;
        } catch (error) {
            console.error('Error deleting reservation:', error);
            throw error;
        }
    }

    async updateReservationStatus(recordId, status) {
        try {
            console.log('Updating reservation status:', { recordId, status });
            
            // If status is available or no-show, delete the record
            if (status === 'available' || status === 'no-show') {
                console.log(`Status is ${status}, deleting reservation...`);
                return await this.deleteReservation(recordId);
            }
            
            // Map the new status system to Airtable values
            let airtableStatus;
            switch(status) {
                case 'reserved':
                    airtableStatus = 'Reserved';
                    break;
                case 'arrived':
                    airtableStatus = 'Arrived';
                    break;
                case 'paid':
                    airtableStatus = 'Paid';
                    break;
                case 'phone-call':
                    airtableStatus = 'Phone call';
                    break;
                case 'walk-in':
                    airtableStatus = 'Walk in';
                    break;
                default:
                    airtableStatus = 'Reserved'; // Default fallback
            }
            
            const updateData = {
                'Status': airtableStatus
            };
            
            console.log('Updating with data:', updateData);
            
            await this.base('tbl9dDLnVa5oLEnuq').update([{
                id: recordId,
                fields: updateData
            }]);
            
            // Clear the cache so we fetch fresh data
            this.cachedReservations = [];
            this.lastFetchTime = null;
            
            console.log('Successfully updated reservation status');
            return true;
        } catch (error) {
            console.error('Detailed error updating reservation:', error);
            throw error;
        }
    }

    async getReservations() {
        try {
            // Check if we already have a fetch in progress
            if (this.fetchingPromise) {
                return await this.fetchingPromise;
            }
            
            // Cache for 30 seconds to prevent excessive API calls
            const now = new Date();
            if (this.cachedReservations.length > 0 && this.lastFetchTime && 
                (now.getTime() - this.lastFetchTime.getTime() < 30000)) {
                return this.cachedReservations;
            }
            
            console.log('Fetching ALL reservations from Airtable (no date filtering)');

            // **FIXED: Remove date filtering to preserve future phone call reservations**
            // Fetch ALL reservations without date filtering
            // Date filtering for display will be done in handlers.js
            
            // Create a promise to store the fetch operation
            this.fetchingPromise = this.base('tbl9dDLnVa5oLEnuq')
                .select({
                    // No filterByFormula - fetch everything
                    sort: [{ field: 'DateandTime', direction: 'asc' }]
                })
                .all()
                .then(records => {
                    const result = [];
                    records.forEach(record => {
                        const tableField = record.get('Table');
                        console.log('Processing record:', {
                            id: record.id,
                            table: tableField,
                            time: record.get('DateandTime'),
                            type: record.get('Reservation Type'),
                            notes: record.get('Notes'),
                            duration: record.get('Duration')
                        });

                        if (!tableField) return;
                        const tableIds = tableField.split(',').map(t => t.trim());
                        console.log('Table IDs:', tableIds);

                        // For each table in the combined reservation
                        tableIds.forEach(tableId => {
                            result.push({
                                id: record.id,
                                tableId: tableId,
                                reservationType: record.get('Reservation Type'),
                                status: record.get('Status'),
                                pax: record.get('Pax'),
                                time: record.get('DateandTime'),
                                duration: record.get('Duration'), // Get duration directly from Duration field
                                customerName: record.get('Name'),
                                phoneNumber: record.get('PH Number'),
                                customerNotes: record.get('Customer Notes'),
                                notes: record.get('Notes'),
                                systemNotes: record.get('System Notes')
                            });
                        });
                    });
                    
                    console.log('Processed ALL reservations (including future):', result);
                    
                    this.cachedReservations = result;
                    this.lastFetchTime = new Date();
                    return result;
                })
                .finally(() => {
                    this.fetchingPromise = null;
                });
                
            return await this.fetchingPromise;
        } catch (error) {
            console.error('Error fetching reservations:', error);
            return this.cachedReservations.length > 0 ? this.cachedReservations : [];
        }
    }

    async createWalkInReservation(tableId, dateTime, reservationType = 'walk-in', additionalData = {}) {
        try {
            console.log('Creating reservation:', { tableId, dateTime, reservationType, additionalData });
            
            // Use the actual status from additionalData if provided, otherwise use reservationType for backward compatibility
            let airtableStatus = 'Reserved'; // Default status
            let airtableReservationType = 'Walk in'; // Default reservation type
            
            // Map status from additionalData.status first (new system)
            if (additionalData.status) {
                switch(additionalData.status) {
                    case 'reserved':
                        airtableStatus = 'Reserved';
                        break;
                    case 'arrived':
                        airtableStatus = 'Arrived';
                        break;
                    case 'paid':
                        airtableStatus = 'Paid';
                        break;
                    case 'no-show':
                        airtableStatus = 'No Show';
                        break;
                    default:
                        // For phone calls, default to Reserved
                        airtableStatus = reservationType === 'phone-call' ? 'Reserved' : 'Arrived';
                }
            } else {
                // If no status provided, set based on reservation type
                airtableStatus = reservationType === 'phone-call' ? 'Reserved' : 'Arrived';
            }
            
            // Map reservation type - use reservationType parameter for the Airtable field
            switch(reservationType) {
                case 'walk-in':
                    airtableReservationType = 'Floor Plan';
                    break;
                case 'phone-call':
                    airtableReservationType = 'Phone call';
                    break;
                case 'calendly':
                    airtableReservationType = 'Calendly';
                    break;
                default:
                    airtableReservationType = 'Floor Plan';
            }
            
            console.log('🔍 RESERVATION TYPE MAPPING DEBUG:');
            console.log('Original form source value:', reservationType);
            console.log('Mapped Airtable reservation type:', airtableReservationType);
            console.log('(Note: walk-in maps to "Floor Plan" to match Airtable options)');
            console.log('Original status from form:', additionalData.status);
            console.log('Mapped Airtable status:', airtableStatus);
            console.log('===========================================');
            
            const reservationData = {
                fields: {
                    "Table": tableId,
                    "DateandTime": dateTime.toISOString(),
                    "Status": airtableStatus,
                    "Reservation Type": airtableReservationType
                }
            };
            
            // Add optional fields if provided
            if (additionalData.customerName) {
                // Put customer name in Customer Notes with a prefix
                const nameNote = `Customer: ${additionalData.customerName}`;
                if (additionalData.customerNotes) {
                    reservationData.fields["Customer Notes"] = `${nameNote}\n${additionalData.customerNotes}`;
                } else {
                    reservationData.fields["Customer Notes"] = nameNote;
                }
            } else if (additionalData.customerNotes) {
                reservationData.fields["Customer Notes"] = additionalData.customerNotes;
            }
            
            if (additionalData.phoneNumber) {
                reservationData.fields["PH Number"] = additionalData.phoneNumber;
            }
            
            // Add Pax field - convert to string since it's a Single Line Text field
            if (typeof additionalData.pax !== 'undefined' && additionalData.pax !== null && additionalData.pax !== '') {
                const paxValue = parseInt(additionalData.pax, 10);
                if (!isNaN(paxValue) && paxValue > 0) {
                    reservationData.fields["Pax"] = paxValue.toString();
                } else {
                    // If pax is 0 or invalid, still save as string (for edge cases)
                    reservationData.fields["Pax"] = additionalData.pax.toString();
                }
            }
            
            if (additionalData.duration) {
                // Calculate end time for duration tracking
                const endTime = new Date(dateTime);
                endTime.setMinutes(endTime.getMinutes() + additionalData.duration);
                reservationData.fields["System Notes"] = `Duration: ${additionalData.duration} minutes (until ${endTime.toLocaleTimeString()})`;
            }

            console.log('📤 FINAL DATA BEING SAVED TO AIRTABLE:');
            console.log('Table:', reservationData.fields.Table);
            console.log('Reservation Type:', reservationData.fields["Reservation Type"]);
            console.log('Status:', reservationData.fields.Status);
            console.log('Full reservation data:', reservationData);
            console.log('===========================================');
            
            try {
                const record = await this.base('tbl9dDLnVa5oLEnuq').create([reservationData]);
                console.log(`Created reservation:`, record);
                
                // Clear the cache so we fetch fresh data
                this.cachedReservations = [];
                this.lastFetchTime = null;
                
                return record;
            } catch (airtableError) {
                console.error('Airtable API Error Details:', {
                    error: airtableError.error,
                    message: airtableError.message,
                    statusCode: airtableError.statusCode,
                    fullError: airtableError
                });
                
                // If Pax field is causing issues, try without it
                if (airtableError.message && (airtableError.message.includes('Pax') || airtableError.message.includes('INVALID_MULTIPLE_CHOICE_OPTIONS'))) {
                    console.warn('Field error detected, retrying with basic fields only...');
                    
                    // Keep only essential fields and retry
                    const basicReservationData = {
                        fields: {
                            "Table": tableId,
                            "DateandTime": dateTime.toISOString(),
                            "Status": airtableStatus,
                            "Reservation Type": airtableReservationType
                        }
                    };
                    
                    // Add customer notes if available
                    if (reservationData.fields["Customer Notes"]) {
                        basicReservationData.fields["Customer Notes"] = reservationData.fields["Customer Notes"];
                    }
                    
                    const retryRecord = await this.base('tbl9dDLnVa5oLEnuq').create([basicReservationData]);
                    console.log(`Created reservation with basic fields:`, retryRecord);
                    
                    this.cachedReservations = [];
                    this.lastFetchTime = null;
                    
                    return retryRecord;
                }
                
                throw airtableError;
            }
        } catch (error) {
            console.error('Detailed error:', error);
            throw error;
        }
    }
} 