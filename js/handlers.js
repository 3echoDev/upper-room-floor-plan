// Event Handlers and Additional Functions

// Handle status change
window.handleStatusChange = async function(event) {
    const select = event.target;
    const tableId = select.dataset.tableId;
    const timeSlot = select.dataset.timeSlot;
    const newStatus = select.value;
    const previousStatus = select.getAttribute('data-previous-status') || 'available';
    
    console.log('Status change initiated:', {
        tableId,
        timeSlot,
        newStatus,
        previousStatus
    });
    
    // Store the selected value for reverting if needed
    select.setAttribute('data-previous-status', newStatus);

    try {
        // Handle changing to "available" status (including from phone-call)
        if (newStatus === 'available') {
            // Find the reservation in Airtable
            const reservations = await window.airtableService.getReservations();
            const matchingReservation = reservations.find(res => {
                if (!res.time) return false;
                const resDate = new Date(res.time);
                return res.tableId === tableId && isTimeInSlot(resDate, { rawTime: timeSlot });
            });

            if (matchingReservation) {
                console.log('Found matching reservation to delete:', matchingReservation);
                
                // If this is part of a combined table reservation
                if (matchingReservation.combinedTables && matchingReservation.combinedTables.length > 1) {
                    const remainingTables = matchingReservation.combinedTables
                        .filter(t => t !== tableId)
                        .join(', ');
                    
                    if (remainingTables) {
                        // Update the reservation to remove this table
                        await window.airtableService.base('tbl9dDLnVa5oLEnuq').update([{
                            id: matchingReservation.id,
                            fields: { "Table": remainingTables }
                        }]);
                    } else {
                        // If no tables left, delete the reservation
                        await window.airtableService.deleteReservation(matchingReservation.id);
                    }
                } else {
                    // Single table reservation - delete it
                    await window.airtableService.deleteReservation(matchingReservation.id);
                }
                
                console.log('Successfully processed reservation change');
                
                // Update local state
                const tableIndex = tables.findIndex(t => t.id === tableId);
                if (tableIndex !== -1) {
                    const slotIndex = tables[tableIndex].timeSlots.findIndex(s => s.rawTime === timeSlot || s.time === timeSlot);
                    if (slotIndex !== -1) {
                        tables[tableIndex].timeSlots[slotIndex].status = 'available';
                        tables[tableIndex].timeSlots[slotIndex].customerName = null;
                        tables[tableIndex].timeSlots[slotIndex].pax = null;
                    }
                }
                
                // Force a complete UI refresh
                initialize();
            }
        } else if (newStatus !== 'available' && previousStatus === 'available') {
            // Creating a new reservation
            try {
                // Generate a date object for this time slot
                const now = new Date();
                const { startDateTime } = parseTimeSlot({ rawTime: timeSlot }, now);
                
                // Create a walk-in or phone call reservation based on selection
                // Fix: Pass proper reservation type instead of status
                const reservationType = newStatus === 'phone-call' ? 'phone-call' : 'walk-in';
                const actualStatus = newStatus === 'phone-call' ? 'reserved' : 'arrived';
                
                await window.airtableService.createWalkInReservation(
                    tableId, 
                    startDateTime, 
                    reservationType, 
                    { status: actualStatus }
                );
                console.log(`Successfully created ${newStatus} reservation for ${tableId} at ${timeSlot}`);
                
                // Update local state
                const tableIndex = tables.findIndex(t => t.id === tableId);
                if (tableIndex !== -1) {
                    const slotIndex = tables[tableIndex].timeSlots.findIndex(s => s.rawTime === timeSlot || s.time === timeSlot);
                    if (slotIndex !== -1) {
                        tables[tableIndex].timeSlots[slotIndex].status = newStatus;
                    }
                }
                
                // Force a complete UI refresh
                initialize();
                
            } catch (error) {
                console.error('Error creating reservation:', error);
                select.value = previousStatus;
                select.setAttribute('data-previous-status', previousStatus);
                alert('Failed to create reservation. Please try again.');
            }
        } else {
            console.log('Status change not supported directly: ' + previousStatus + ' -> ' + newStatus);
            // For other status changes, first delete then recreate with new status
            if (previousStatus !== 'available' && newStatus !== 'available') {
                alert('To change between reservation types, please first make the table available, then create a new reservation.');
                select.value = previousStatus;
                select.setAttribute('data-previous-status', previousStatus);
            }
        }
    } catch (error) {
        console.error('Error handling status change:', error);
        // Reset to previous status
        select.value = previousStatus;
        select.setAttribute('data-previous-status', previousStatus);
        alert('Failed to update reservation status');
    }
};

// Fetch and update reservations periodically - with throttling
let fetchInProgress = false;
async function fetchAndUpdateReservations() {
    if (!window.airtableService || fetchInProgress) return;

    try {
        fetchInProgress = true;
        const airtableReservations = await window.airtableService.getReservations();
        console.log('Fetched Airtable reservations:', airtableReservations);
        
        // **DEBUG: Log environment and cancelled reservation analysis**
        const cancelledReservations = airtableReservations.filter(res => 
            res.status && (res.status.toLowerCase() === 'cancelled' || res.status.toLowerCase() === 'canceled')
        );
        console.log('🔍 ENVIRONMENT DEBUG:', {
            hostname: window.location.hostname,
            totalReservations: airtableReservations.length,
            cancelledCount: cancelledReservations.length,
            cancelledReservations: cancelledReservations.map(res => ({
                id: res.id,
                customerName: res.customerName,
                status: res.status,
                statusType: typeof res.status
            }))
        });
        
        // **DEBUG: Log all phone call reservations from Airtable**
        console.log('=== DEBUGGING PHONE CALL RESERVATIONS ===');
        const phoneCallReservations = airtableReservations.filter(res => 
            res.reservationType && res.reservationType.toLowerCase().includes('phone')
        );
        console.log('Phone call reservations found in Airtable:', phoneCallReservations);
        
        // Clear all local reservations first (this doesn't affect Airtable data)
        tables.forEach(table => {
            table.reservations = [];
        });
        
        // Convert Airtable reservations to local format
        airtableReservations.forEach(airtableRes => {
            const table = tables.find(t => t.id === airtableRes.tableId);
            if (!table) {
                console.warn('Table not found for reservation:', airtableRes.tableId);
                return;
            }
            
            // **DEBUG: Log status values for debugging environment differences**
            if (airtableRes.status && airtableRes.status.toLowerCase().includes('cancel')) {
                console.log('🔍 DEBUGGING: Found cancelled reservation:', {
                    id: airtableRes.id,
                    customerName: airtableRes.customerName,
                    status: airtableRes.status,
                    statusType: typeof airtableRes.status,
                    statusLower: airtableRes.status.toLowerCase(),
                    tableId: airtableRes.tableId,
                    environment: window.location.hostname
                });
            }
            
            // **ORIGINAL LOGIC: Only process reservations for today (for display only)**
            const resDate = new Date(airtableRes.time);
            const today = new Date();
            const isSameDay = 
                resDate.getDate() === today.getDate() && 
                resDate.getMonth() === today.getMonth() && 
                resDate.getFullYear() === today.getFullYear();
                
            if (!isSameDay) {
                // **DEBUG: Log which reservations are being filtered from display**
                if (airtableRes.reservationType && airtableRes.reservationType.toLowerCase().includes('phone')) {
                    console.log('⚠️ PHONE CALL reservation filtered from display (different day):', {
                        id: airtableRes.id,
                        customerName: airtableRes.customerName,
                        reservationType: airtableRes.reservationType,
                        date: resDate.toLocaleDateString(),
                        today: today.toLocaleDateString(),
                        tableId: airtableRes.tableId
                    });
                } else {
                    console.log('Skipping reservation from different day (not displayed):', {
                        id: airtableRes.id,
                        date: resDate.toLocaleDateString(),
                        type: airtableRes.reservationType
                    });
                }
                return; // Skip for display, but data remains in Airtable
            }
            
            // **NEW: Filter out cancelled reservations from floor plan display (case-insensitive, multiple spellings)**
            if (airtableRes.status && 
                (airtableRes.status.toLowerCase() === 'cancelled' || 
                 airtableRes.status.toLowerCase() === 'canceled')) {
                console.log('🚫 Skipping cancelled reservation from display:', {
                    id: airtableRes.id,
                    customerName: airtableRes.customerName,
                    status: airtableRes.status,
                    statusLower: airtableRes.status.toLowerCase(),
                    tableId: airtableRes.tableId,
                    environment: window.location.hostname
                });
                return; // Skip cancelled reservations from display, but they remain in Airtable
            }
            
            // **DEBUG: Log phone call reservations being displayed**
            if (airtableRes.reservationType && airtableRes.reservationType.toLowerCase().includes('phone')) {
                console.log('✅ PHONE CALL reservation being displayed (today):', {
                    id: airtableRes.id,
                    customerName: airtableRes.customerName,
                    tableId: airtableRes.tableId,
                    time: resDate.toLocaleString()
                });
            }
            
            // Create local reservation object (for display only)
            const durationMinutes = airtableRes.duration ? parseInt(airtableRes.duration) : extractDuration(airtableRes.systemNotes);
            const localReservation = {
                id: airtableRes.id,
                tableId: airtableRes.tableId,
                // Map Airtable reservation type to source
                source: getSourceFromAirtableType(airtableRes.reservationType),
                // Map Airtable status to local status
                status: getStatusFromAirtableStatus(airtableRes.status),
                // Legacy support
                type: airtableRes.status === 'phone-call' ? 'phone-call' : 'walk-in',
                pax: airtableRes.pax || table.capacity,
                startTime: airtableRes.time,
                duration: durationMinutes,
                endTime: (() => {
                    if (airtableRes.time && durationMinutes) {
                        const start = new Date(airtableRes.time);
                        const end = new Date(start);
                        end.setMinutes(start.getMinutes() + durationMinutes);
                        return end.toISOString();
                    }
                    return null;
                })(),
                customerName: airtableRes.customerName || (airtableRes.customerNotes ? extractCustomerName(airtableRes.customerNotes) : null),
                phoneNumber: airtableRes.phoneNumber,
                customerNotes: airtableRes.customerNotes,
                // For Calendly bookings, extract special request from customer notes
                specialRequest: getSourceFromAirtableType(airtableRes.reservationType) === 'calendly' ? 
                    extractSpecialRequest(airtableRes.customerNotes) : null,
                systemNotes: airtableRes.systemNotes,
                createdAt: airtableRes.time,
                airtableId: airtableRes.id
            };
            
            // Debug log for pax value from Airtable
            console.log('Airtable reservation pax data:', {
                id: airtableRes.id,
                tableId: airtableRes.tableId,
                airtablePax: airtableRes.pax,
                tableCapacity: table.capacity,
                finalPax: localReservation.pax
            });
            
            table.reservations.push(localReservation);
        });
        
        // Sort reservations by start time for each table
        tables.forEach(table => {
            table.reservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        });
        
        // **DEBUG: Log final state**
        const phoneCallReservationsDisplayed = [];
        tables.forEach(table => {
            const phoneReservations = table.reservations.filter(r => 
                r.source === 'phone-call' || (r.type && r.type === 'phone-call')
            );
            phoneCallReservationsDisplayed.push(...phoneReservations);
        });
        console.log('Phone call reservations being displayed today:', phoneCallReservationsDisplayed);
        console.log('=== END PHONE CALL DEBUG ===');
        
        console.log('Updated local reservations for display:', tables.map(t => ({
            id: t.id,
            reservations: t.reservations.length
        })));
        
        // Update UI (this only affects display, not Airtable data)
        initialize();
        
    } catch (error) {
        console.error('Error fetching and updating reservations:', error);
    } finally {
        fetchInProgress = false;
    }
}

// Helper function to calculate end time from start time and system notes
function calculateEndTime(startTimeStr, systemNotes) {
    const startTime = new Date(startTimeStr);
    const duration = extractDuration(systemNotes);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime.toISOString();
}

// Helper function to extract duration from system notes
function extractDuration(systemNotes) {
    if (!systemNotes) return null;
    
    const durationMatch = systemNotes.match(/Duration:\s*(\d+)\s*minutes/);
    return durationMatch ? parseInt(durationMatch[1]) : null;
}

// Update a single table UI instead of re-rendering everything
function updateTableUI(tableIndex) {
    if (tableIndex < 0 || tableIndex >= tables.length) return;
    
    const table = tables[tableIndex];
    console.log(`Updating UI for table ${table.id}`);
    console.log(`Table ${table.id} has ${table.reservations ? table.reservations.length : 0} reservations`);
    
    // Just use the full initialize approach since we've simplified the system
    initialize();
}

// Function to update floor plan table statuses
function updateFloorPlanTableStatuses() {
    console.log('Updating floor plan table statuses...');
    tables.forEach(table => {
        // Find if this table has any reservations using the new system
        const reservationCount = table.reservations ? table.reservations.length : 0;
        const hasReservations = reservationCount > 0;
        
        if (table.id === 'A1' || table.id === 'A2') {
            console.log(`Table ${table.id} has ${reservationCount} reservations:`, table.reservations);
        }
        
        // Find the corresponding table block in the floor plan - first by ID
        const tableBlockById = document.querySelector(`#table-${table.id}`);
        // If not found by ID, try by the onclick attribute
        const tableBlockByOnClick = document.querySelector(`.table-block[onclick*="'${table.id}'"]`);
        
        const tableBlock = tableBlockById || tableBlockByOnClick;
        
        if (!tableBlock) {
            console.error(`Could not find tableBlock for ${table.id}`);
            return;
        }
        
        if (table.id === 'A1' || table.id === 'A2') {
            console.log(`Found tableBlock for ${table.id}:`, tableBlock);
        }
        
        // Get the existing status indicator
        const existingIndicator = tableBlock.querySelector('.table-status-indicator');
        
        if (existingIndicator) {
            // Clear existing indicator content
            existingIndicator.innerHTML = '';
            
            // Update indicator with reservation info if needed
            if (hasReservations) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-danger rounded-circle';
                badge.textContent = reservationCount;
                badge.style.fontWeight = 'bold';
                badge.style.border = '3px solid white';
                badge.style.zIndex = '100';
                badge.style.textShadow = '0 0 3px black';
                badge.style.fontSize = '1rem';
                badge.style.width = '28px';
                badge.style.height = '28px';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.backgroundColor = '#ff0000';
                badge.style.boxShadow = '0 3px 6px rgba(0,0,0,0.5)';
                badge.style.animation = 'pulse-badge 2s infinite';
                existingIndicator.appendChild(badge);
                
                if (table.id === 'A1' || table.id === 'A2') {
                    console.log(`Added status indicator badge to ${table.id} with count ${reservationCount}`);
                }
            } else {
                if (table.id === 'A1' || table.id === 'A2') {
                    console.log(`No reservations for ${table.id}, no badge added`);
                }
            }
        } else {
            console.error(`No status indicator found for ${table.id}`);
            
            // Create indicator if it doesn't exist but has reservations
            if (hasReservations) {
                const indicator = document.createElement('div');
                indicator.className = 'table-status-indicator';
                const badge = document.createElement('span');
                badge.className = 'badge bg-danger rounded-circle';
                badge.textContent = reservationCount;
                badge.style.fontWeight = 'bold';
                badge.style.border = '3px solid white'; 
                badge.style.zIndex = '100';
                badge.style.textShadow = '0 0 3px black';
                badge.style.fontSize = '1rem';
                badge.style.width = '28px';
                badge.style.height = '28px';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.backgroundColor = '#ff0000';
                badge.style.boxShadow = '0 3px 6px rgba(0,0,0,0.5)';
                badge.style.animation = 'pulse-badge 2s infinite';
                indicator.appendChild(badge);
                tableBlock.appendChild(indicator);
                
                if (table.id === 'A1' || table.id === 'A2') {
                    console.log(`Created new status indicator for ${table.id}`);
                }
            }
        }
    });
}

// Helper function to map Airtable reservation type to local source
function getSourceFromAirtableType(airtableType) {
    if (!airtableType) return 'walk-in';
    
    // Log what we're receiving from Airtable for debugging
    if (airtableType.toLowerCase() === 'floor plan') {
        console.log('✅ Found "Floor Plan" in Airtable data - this is correct for walk-in reservations');
        console.log('Airtable reservation type received:', airtableType);
    }
    
    switch(airtableType.toLowerCase()) {
        case 'calendly':
            return 'calendly';
        case 'phone call':
        case 'voice agent':
            return 'phone-call';
        case 'floor plan':
        case 'walk in':  // Keep this for backward compatibility
        default:
            return 'walk-in';
    }
}

// Helper function to map Airtable status to local status
function getStatusFromAirtableStatus(airtableStatus) {
    if (!airtableStatus) return 'reserved'; // Default to reserved for new reservations
    
    switch(airtableStatus.toLowerCase()) {
        case 'reserved':
            return 'reserved';
        case 'arrived':
            return 'arrived';
        case 'paid':
            return 'paid';
        case 'no show':
        case 'no-show':
            return 'no-show';
        case 'cancelled':
        case 'canceled':
            return 'cancelled'; // Handle both spellings of cancelled
        case 'phone call':
            return 'reserved'; // Phone calls always default to reserved status
        case 'floor plan':
        case 'walk in':  // Keep this for backward compatibility
            return 'arrived'; // Walk-ins and floor plan reservations default to arrived status
        default:
            return 'reserved'; // Default to reserved for any unknown status
    }
}

// Helper function to extract customer name from customer notes
function extractCustomerName(customerNotes) {
    if (!customerNotes) return null;
    
    // Try to find "Customer: " followed by text
    const match = customerNotes.match(/Customer:\s*([^\n]+)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return null;
}

// Helper function to extract special request from customer notes for Calendly bookings
function extractSpecialRequest(customerNotes) {
    if (!customerNotes) return null;
    
    // Look for special request pattern, excluding the "Customer: Name" part
    const lines = customerNotes.split('\n');
    
    // Find lines after "Customer:" that contain special requests
    let foundCustomerLine = false;
    let specialRequest = '';
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('Customer:')) {
            foundCustomerLine = true;
            continue;
        }
        
        if (foundCustomerLine && trimmedLine) {
            specialRequest += (specialRequest ? ' ' : '') + trimmedLine;
        }
    }
    
    return specialRequest || null;
} 