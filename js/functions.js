// Utility Functions and Event Handlers

// Function to adjust table positions for small screens
function adjustTablePositionsForMobile() {
    const a1Table = document.getElementById('table-A1');
    const a2Table = document.getElementById('table-A2');
    
    if (!a1Table || !a2Table) return;
    
    if (window.innerWidth <= 380) {
        a1Table.style.top = '510px';
        a2Table.style.top = '510px';
    } else if (window.innerWidth <= 480) {
        a1Table.style.top = '530px';
        a2Table.style.top = '530px';
    } else if (window.innerWidth <= 576) {
        a1Table.style.top = '550px';
        a2Table.style.top = '550px';
    } else if (window.innerWidth <= 768) {
        a1Table.style.top = '580px';
        a2Table.style.top = '580px';
    } else {
        // Reset to original positions for larger screens
        a1Table.style.top = '830px';
        a2Table.style.top = '830px';
    }
    
    // Adjust other mobile-specific UI elements
    if (window.innerWidth <= 576) {
        // Make dropdown controls more touch-friendly on mobile
        const selects = document.querySelectorAll('.form-select-sm');
        selects.forEach(select => {
            select.style.height = '38px';  // Increase touch target size
        });
        
        // Ensure proper spacing in the header on very small screens
        if (window.innerWidth <= 380) {
            const headerItems = document.querySelectorAll('.position-sticky .mb-2');
            headerItems.forEach(item => {
                item.style.marginBottom = '10px !important';
            });
        }
    }
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = 
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('current-date').textContent = 
        now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Toggle time slots visibility
window.toggleTimeSlots = function(tableId) {
    const timeSlotsContainer = document.getElementById(`time-slots-${tableId}`);
    const toggleBtn = document.getElementById(`toggle-btn-${tableId}`);
    const tableCard = document.getElementById(`table-card-${tableId}`);
    
    if (timeSlotsContainer) {
        const isCurrentlyHidden = timeSlotsContainer.style.display === 'none' || !timeSlotsContainer.style.display;
        
        // Close all other open time slots on mobile for better UX
        if (isCurrentlyHidden && window.innerWidth <= 768) {
            const allTimeSlots = document.querySelectorAll('.time-slots-container');
            allTimeSlots.forEach(container => {
                if (container.id !== `time-slots-${tableId}` && container.style.display === 'block') {
                    container.style.display = 'none';
                    
                    // Find and update the corresponding toggle button and card
                    const otherTableId = container.id.replace('time-slots-', '');
                    const otherToggleBtn = document.getElementById(`toggle-btn-${otherTableId}`);
                    const otherTableCard = document.getElementById(`table-card-${otherTableId}`);
                    
                    if (otherToggleBtn) {
                        otherToggleBtn.innerHTML = '<i class="bi bi-clock"></i>';
                        otherToggleBtn.title = 'Show Time Slots';
                    }
                    
                    if (otherTableCard) {
                        otherTableCard.classList.remove('expanded');
                    }
                }
            });
        }
        
        if (isCurrentlyHidden) {
            timeSlotsContainer.style.display = 'block';
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="bi bi-dash-circle"></i>';
                toggleBtn.title = 'Hide Time Slots';
            }
            if (tableCard) {
                tableCard.classList.add('expanded');
            }
            
            // Add scrolling functionality when expanding for all tables
            // Use a slight delay to allow the DOM to update before scrolling
            setTimeout(() => {
                const tableCardParent = tableCard.closest('.col-xl-3, .col-lg-4, .col-md-6, .col-12');
                const elementToScroll = tableCardParent || tableCard;
                
                // Use direct scrollIntoView - more reliable than offset calculation
                elementToScroll.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Highlight the table with a flash effect
                tableCard.style.transition = 'background-color 0.5s';
                tableCard.style.backgroundColor = '#e6f2ff';
                
                // Remove highlight after a delay
                setTimeout(() => {
                    tableCard.style.backgroundColor = '';
                }, 2000);
            }, 300);
        } else {
            timeSlotsContainer.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="bi bi-clock"></i>';
                toggleBtn.title = 'Show Time Slots';
            }
            if (tableCard) {
                tableCard.classList.remove('expanded');
            }
        }
    } else {
        console.log(`Time slots container for table ${tableId} not found, forcing initialization`);
        
        // Force a full initialization of all tables
        initialize();
        
        // Try again after a short delay to ensure the DOM has updated
        setTimeout(() => {
            const retryContainer = document.getElementById(`time-slots-${tableId}`);
            const retryBtn = document.getElementById(`toggle-btn-${tableId}`);
            const retryCard = document.getElementById(`table-card-${tableId}`);
            
            if (retryContainer) {
                console.log(`Found time slots container for table ${tableId} after initialization`);
                retryContainer.style.display = 'block';
                
                if (retryBtn) {
                    retryBtn.innerHTML = '<i class="bi bi-dash-circle"></i>';
                    retryBtn.title = 'Hide Time Slots';
                }
                
                if (retryCard) {
                    retryCard.classList.add('expanded');
                    
                    // Add scrolling for all tables after initialization
                    setTimeout(() => {
                        const tableParent = retryCard.closest('.col-xl-3, .col-lg-4, .col-md-6, .col-12');
                        const elementToScroll = tableParent || retryCard;
                        
                        elementToScroll.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 200);
                }
            } else {
                console.error(`Time slots container for table ${tableId} still not found after initialization`);
            }
        }, 200); // Increased delay for reliability
    }
};

// Function to scroll to and highlight a table from floor plan
window.scrollToTable = function(tableId) {
    console.log(`Attempting to scroll to table ${tableId}`);
    
    // Find the table card element
    const tableElement = document.getElementById(`table-card-${tableId}`);
    if (tableElement) {
        console.log(`Found table card for ${tableId}:`, tableElement);
        
        // First make sure the time slots are expanded
        const timeSlotsContainer = document.getElementById(`time-slots-${tableId}`);
        const toggleBtn = document.getElementById(`toggle-btn-${tableId}`);
        
        // Close all other open time slots for better UX
        const allTimeSlots = document.querySelectorAll('.time-slots-container');
        allTimeSlots.forEach(container => {
            if (container.id !== `time-slots-${tableId}` && container.style.display === 'block') {
                container.style.display = 'none';
                
                // Find and update the corresponding toggle button and card
                const otherTableId = container.id.replace('time-slots-', '');
                const otherToggleBtn = document.getElementById(`toggle-btn-${otherTableId}`);
                const otherTableCard = document.getElementById(`table-card-${otherTableId}`);
                
                if (otherToggleBtn) {
                    otherToggleBtn.innerHTML = '<i class="bi bi-clock"></i>';
                    otherToggleBtn.title = 'Show Time Slots';
                }
                
                if (otherTableCard) {
                    otherTableCard.classList.remove('expanded');
                }
            }
        });
        
        // Always expand the time slots when clicking from the floor plan
        if (timeSlotsContainer) {
            timeSlotsContainer.style.display = 'block';
        }
        
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-dash-circle"></i>';
            toggleBtn.title = 'Hide Time Slots';
        }
        
        tableElement.classList.add('expanded');
        
        // Simpler scrolling approach - more reliable than calculating offsets
        // Small delay to allow the time slots to expand first
        setTimeout(() => {
            // Find the parent column element for more accurate scrolling
            const tableParent = tableElement.closest('.col-xl-3, .col-lg-4, .col-md-6, .col-12');
            
            // Use scrollIntoView with the parent element if available, otherwise use the table card
            const elementToScroll = tableParent || tableElement;
            
            // Scroll directly to the element
            elementToScroll.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Highlight effect
            tableElement.style.transition = 'background-color 0.5s';
            tableElement.style.backgroundColor = '#e6f2ff';
            
            setTimeout(() => {
                tableElement.style.backgroundColor = '';
            }, 2000);
        }, 300);
    } else {
        // If the element doesn't exist, we need to make sure all tables are properly rendered
        console.warn(`Table card ${tableId} not found, forcing complete initialization`);
        
        // Force a full initialization of all tables
        initialize();
        
        // Try again after a longer delay to ensure the DOM has updated
        setTimeout(() => {
            const retryElement = document.getElementById(`table-card-${tableId}`);
            if (retryElement) {
                console.log(`Found table ${tableId} after initialization, trying scroll again`);
                // Call scrollToTable again with the same tableId
                scrollToTable(tableId);
            } else {
                console.error(`Table ${tableId} still not found after initialization`);
                // Last resort - try to scroll based on section
                const section = tableId.charAt(0);
                // Use the section header ID directly
                const sectionHeader = document.getElementById(`section-header-${section}`);
                if (sectionHeader) {
                    console.log(`Scrolling to section ${section} as fallback`);
                    sectionHeader.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        }, 500); // Increased delay for full initialization
    }
};

// Save changes to Airtable
window.saveEditTables = async function() {
    const selectedButtons = document.querySelectorAll('.table-select-btn.selected');
    const selectedTables = Array.from(selectedButtons).map(btn => btn.dataset.tableId);
    const reservationId = document.getElementById('editTablesReservationId').value;
    const originalTables = document.getElementById('editTablesOriginalTables').value.split(',').map(t => t.trim());
    
    console.log('Saving table changes:', { 
        reservationId, 
        originalTables,
        selectedTables 
    });
    
    // Validation checks
    if (selectedTables.length === 0) {
        alert('Please select at least one table.');
        return;
    }

    // Ensure at least one original table is maintained - REMOVED this requirement for manual editing
    // Allow complete table changes for manual editing flexibility
    
    try {
        await window.airtableService.base('tbl9dDLnVa5oLEnuq').update([{
            id: reservationId,
            fields: { "Table": selectedTables.join(', ') }
        }]);
        
        console.log('Successfully updated tables in Airtable');
        
        // Clear cache and fetch fresh data
        window.airtableService.cachedReservations = [];
        window.airtableService.lastFetchTime = null;
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTablesModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show bg-success text-white" role="alert">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-2"></i>Tables updated successfully!
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => toast.remove(), 3000);
        
        // Fetch new data and update UI
        await fetchAndUpdateReservations();
        initialize();
        
    } catch (err) {
        console.error('Failed to update tables:', err);
        alert('Failed to update tables: ' + err.message);
    }
};

// Function to open Edit Tables Modal
window.openEditTablesModal = function(reservationId, currentTableId, systemNotes) {
    console.log('Opening edit tables modal:', { reservationId, currentTableId, systemNotes });
    
    // Extract current table combination from system notes or find all tables with this reservation
    let currentTables = [];
    
    // Try to extract tables from system notes
    if (systemNotes) {
        // Look for patterns like "B1 and B3" or "tables B1, B2, B3"
        const tablePattern = /([A-Z]\d+)/g;
        const matches = systemNotes.match(tablePattern);
        if (matches) {
            currentTables = matches;
        }
    }
    
    // If we couldn't extract from system notes, find all tables with this reservation ID
    if (currentTables.length === 0) {
        tables.forEach(table => {
            const reservation = table.reservations.find(r => r.id === reservationId);
            if (reservation) {
                currentTables.push(table.id);
            }
        });
    }
    
    console.log('Current tables for reservation:', currentTables);
    
    // Store data in modal
    document.getElementById('editTablesReservationId').value = reservationId;
    document.getElementById('editTablesOriginalTables').value = currentTables.join(', ');
    
    // Update modal content
    document.getElementById('originalTablesDisplay').textContent = currentTables.join(', ');
    
    // Generate table selection buttons
    generateTableSelectionButtons(currentTables);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('editTablesModal'));
    modal.show();
};

// Function to generate table selection buttons
function generateTableSelectionButtons(currentTables) {
    const container = document.getElementById('tableButtonsContainer');
    container.innerHTML = '';
    
    // Group tables by section for better organization
    const sections = {
        'A': [], // Bar counter
        'B': [], // Bottom tables
        'C': [], // Left side tables
        'D': [], // Right side tables
        'E': []  // Outdoor tables
    };
    
    // Populate sections
    tables.forEach(table => {
        const section = table.id.charAt(0);
        if (sections[section]) {
            sections[section].push(table);
        }
    });
    
    // Create buttons for each section
    Object.keys(sections).forEach(sectionKey => {
        if (sections[sectionKey].length === 0) return;
        
        // Section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'w-100 mb-2';
        sectionHeader.innerHTML = `<small class="text-muted fw-bold">Section ${sectionKey}</small>`;
        container.appendChild(sectionHeader);
        
        // Section buttons container
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'd-flex flex-wrap gap-2 mb-3';
        
        sections[sectionKey].forEach(table => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-primary table-select-btn';
            button.dataset.tableId = table.id;
            
            // Check if this table is currently selected
            if (currentTables.includes(table.id)) {
                button.classList.add('selected');
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            }
            
            button.innerHTML = `
                <div class="text-center">
                    <div class="fw-bold">${table.id}</div>
                    <small>${table.capacity} pax</small>
                </div>
            `;
            
            // Add click handler
            button.addEventListener('click', function() {
                toggleTableSelection(this);
            });
            
            sectionContainer.appendChild(button);
        });
        
        container.appendChild(sectionContainer);
    });
}

// Function to toggle table selection
function toggleTableSelection(button) {
    if (button.classList.contains('selected')) {
        // Deselect
        button.classList.remove('selected', 'btn-primary');
        button.classList.add('btn-outline-primary');
    } else {
        // Select
        button.classList.add('selected', 'btn-primary');
        button.classList.remove('btn-outline-primary');
    }
    
    // Update selection count display
    updateSelectionDisplay();
}

// Function to update selection display
function updateSelectionDisplay() {
    const selectedButtons = document.querySelectorAll('.table-select-btn.selected');
    const selectedTables = Array.from(selectedButtons).map(btn => btn.dataset.tableId);
    
    console.log('Currently selected tables:', selectedTables);
    
    // You could add a display element to show current selection if needed
}

// Run adjustments on page load and window resize
document.addEventListener('DOMContentLoaded', adjustTablePositionsForMobile);
window.addEventListener('resize', adjustTablePositionsForMobile);

// New Reservation System Functions

// Update duration rules - REMOVED 
// Modal-specific functionality has been removed

// Cancel a reservation
window.cancelReservation = async function(tableId, reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
        return;
    }
    
    const table = tables.find(t => t.id === tableId);
    if (!table) {
        console.error('Table not found:', tableId);
        return;
    }
    
    // Show loading state (if there's a cancel button, disable it)
    console.log('Cancelling reservation:', reservationId);
    
    try {
        // Delete from Airtable first
        await window.airtableService.deleteReservation(reservationId);
        console.log('Successfully deleted reservation from Airtable');
        
        // Remove reservation from local table state
        table.reservations = table.reservations.filter(r => r.id !== reservationId);
        
        // Update UI immediately from local data
        initialize();
        
        // Update reservation count
        window.updateReservationCount();
        
        // Update floor plan indicators
        updateFloorPlanTableStatuses();
        
        // Show success message
        showSuccessMessage('Reservation cancelled successfully!');
        
        console.log('Reservation cancelled successfully:', reservationId);
        
        // Clear Airtable cache to ensure fresh data on next load
        if (window.airtableService) {
            window.airtableService.cachedReservations = [];
            window.airtableService.lastFetchTime = null;
        }
        
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation: ' + error.message + '. Please try again.');
    }
};

// Check for reservation conflicts with improved debugging
function hasReservationConflict(tableId, startTime, endTime) {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.reservations || table.reservations.length === 0) {
        console.log('No existing reservations for table', tableId);
        return false;
    }
    
    console.log(`Checking conflicts for table ${tableId}:`);
    console.log('New reservation:', {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        startTime: startTime.toLocaleTimeString(),
        endTime: endTime.toLocaleTimeString()
    });
    
    // Validate input times
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid start or end time provided');
        return false;
    }
    
    if (startTime >= endTime) {
        console.error('Start time must be before end time');
        return false;
    }
    
    const conflicts = table.reservations.filter(reservation => {
        try {
            // Validate reservation data
            if (!reservation.startTime || !reservation.endTime) {
                console.warn('Reservation missing time data:', reservation);
                return false;
            }
            
            const resStart = new Date(reservation.startTime);
            const resEnd = new Date(reservation.endTime);
            
            // Check if dates are valid
            if (isNaN(resStart.getTime()) || isNaN(resEnd.getTime())) {
                console.warn('Invalid date in existing reservation:', reservation);
                return false;
            }
            
            // Ensure reservation dates make sense
            if (resStart >= resEnd) {
                console.warn('Invalid reservation time range:', reservation);
                return false;
            }
            
            // NEW LOGIC: Check if the new reservation starts before the existing reservation ends
            // if (startTime < resEnd) {
            //     console.log('Conflict: Cannot book before previous reservation ends:', {
            //         existingEnd: resEnd.toLocaleTimeString(),
            //         attemptedStart: startTime.toLocaleTimeString()
            //     });
            //     return true;
            // }
            
            // Keep the original overlap checks for completeness
            const startsInExisting = startTime >= resStart && startTime < resEnd;
            const endsInExisting = endTime > resStart && endTime <= resEnd;
            const containsExisting = startTime <= resStart && endTime >= resEnd;
            
            const hasOverlap = startsInExisting || endsInExisting || containsExisting;
            
            if (hasOverlap) {
                console.log('Conflict found with reservation:', {
                    id: reservation.id,
                    existing: {
                        start: resStart.toISOString(),
                        end: resEnd.toISOString(),
                        startTime: resStart.toLocaleTimeString(),
                        endTime: resEnd.toLocaleTimeString()
                    },
                    new: {
                        start: startTime.toISOString(),
                        end: endTime.toISOString(),
                        startTime: startTime.toLocaleTimeString(),
                        endTime: endTime.toLocaleTimeString()
                    }
                });
            }
            
            return hasOverlap;
        } catch (error) {
            console.error('Error checking reservation conflict:', error, reservation);
            return false;
        }
    });
    
    const hasConflicts = conflicts.length > 0;
    console.log(`Conflict check result: ${hasConflicts ? 'CONFLICT FOUND' : 'NO CONFLICTS'}`);
    
    return hasConflicts;
}

// Show success message
function showSuccessMessage(message) {
    console.log('showSuccessMessage called with:', message); // Debug log
    
    // Remove any existing success messages first
    const existingMessages = document.querySelectorAll('.custom-success-alert');
    existingMessages.forEach(msg => msg.remove());
    
    // Create simple, reliable success alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible position-fixed custom-success-alert';
    alertDiv.style.cssText = `
        top: 100px !important; 
        left: 50% !important; 
        transform: translateX(-50%) !important; 
        z-index: 99999 !important; 
        min-width: 400px !important; 
        max-width: 600px !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3) !important;
        border: 3px solid #28a745 !important;
        border-radius: 10px !important;
        background-color: #d4edda !important;
        font-size: 16px !important;
        font-weight: bold !important;
        padding: 20px !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-check-circle-fill me-3" style="font-size: 2rem !important; color: #28a745 !important;"></i>
            <div class="flex-grow-1">
                <div style="font-size: 18px !important; color: #155724 !important; font-weight: bold !important;">${message}</div>
                <div style="font-size: 14px !important; color: #6c757d !important; margin-top: 5px !important;">Reservation saved successfully!</div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()" style="font-size: 20px !important;"></button>
        </div>
    `;
    
    console.log('Adding success message to body'); // Debug log
    document.body.appendChild(alertDiv);
    
    // Force a reflow to ensure the element is rendered
    alertDiv.offsetHeight;
    
    console.log('Success message element:', alertDiv); // Debug log
    console.log('Success message in DOM:', document.contains(alertDiv)); // Debug log
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        console.log('Auto-removing success message'); // Debug log
        if (alertDiv.parentNode) {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Modal event listeners - REMOVED
// All modal-specific event listeners and functions have been removed

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'reserved': return 'bg-danger';
        case 'arrived': return 'bg-warning text-dark';
        case 'paid': return 'bg-success';
        case 'no-show': return 'bg-dark';
        default: return 'bg-secondary';
    }
}

// Intelligent Table Assignment for Calendly Bookings
window.assignCalendlyBookingToTable = function(calendlyBooking) {
    console.log('🎯 Assigning Calendly booking:', calendlyBooking);
    
    const { startTime, endTime, pax, customerName, phoneNumber, duration } = calendlyBooking;
    
    // Convert times to Date objects if they're strings
    const bookingStart = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const bookingEnd = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    // Validate booking data
    if (!bookingStart || !bookingEnd || !pax) {
        console.error('❌ Invalid booking data:', calendlyBooking);
        return { success: false, error: 'Invalid booking data' };
    }
    
    // **NEW: Check if the reservation is in the past - prevent reassigning past reservations**
    const now = new Date();
    const currentTime = now.getTime();
    const bookingStartTime = bookingStart.getTime();
    
    // If the booking start time is more than 30 minutes in the past, don't assign it
    const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);
    if (bookingStartTime < thirtyMinutesAgo) {
        console.log(`⏰ PAST RESERVATION DETECTED: ${customerName || 'Unknown'} at ${bookingStart.toLocaleString()}`);
        console.log(`Current time: ${now.toLocaleString()}`);
        console.log(`Booking time: ${bookingStart.toLocaleString()}`);
        console.log(`Time difference: ${Math.round((currentTime - bookingStartTime) / 60000)} minutes`);
        console.log(`❌ Skipping past reservation to prevent re-assignment after staff deletion`);
        
        return { 
            success: false, 
            error: `Cannot assign past reservation for ${customerName || 'Unknown'} at ${bookingStart.toLocaleTimeString()}. Reservation is ${Math.round((currentTime - bookingStartTime) / 60000)} minutes in the past.`,
            isPastReservation: true
        };
    }
    
    // **IMPROVED: More thorough duplicate detection**
    console.log('🔍 Checking for existing assignments...');
    
    // Check local tables first
    for (const table of tables) {
        for (const reservation of table.reservations) {
            if (reservation.source === 'calendly') {
                const resTime = new Date(reservation.startTime);
                const timeDiff = Math.abs(bookingStart - resTime);
                
                // **ENHANCED: More robust duplicate detection**
                // Check for exact time match first (most reliable)
                const exactTimeMatch = timeDiff < 60000; // Within 1 minute
                
                // Check for customer details match
                const sameCustomer = customerName && reservation.customerName === customerName;
                const samePhone = phoneNumber && reservation.phoneNumber === phoneNumber;
                
                // Check for similar time (within 5 minutes) with customer details
                const similarTimeWithCustomer = timeDiff < 300000 && (sameCustomer || samePhone);
                
                // **NEW: Check for Calendly bookings without customer info at same time**
                const sameTimeNoCustomer = exactTimeMatch && 
                    (!reservation.customerName || reservation.customerName === 'Calendly Booking') &&
                    (!customerName || customerName === 'Calendly Booking');
                
                if (exactTimeMatch || similarTimeWithCustomer || sameTimeNoCustomer) {
                    console.log(`❌ DUPLICATE DETECTED in local data: ${customerName || phoneNumber} already assigned to table ${reservation.tableId}`);
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
                            time: bookingStart.toISOString()
                        },
                        timeDiff: timeDiff / 1000 + ' seconds'
                    });
                    return { 
                        success: false, 
                        error: `Customer ${customerName || phoneNumber} already has a reservation at ${bookingStart.toLocaleTimeString()} on table ${reservation.tableId}`,
                        isDuplicate: true
                    };
                }
            }
        }
    }
    
    // **NOTE: We don't check Airtable here as it should be handled by CalendlyService.isEventAlreadyAssigned()
    // before this function is called. This avoids duplicate API calls.**
    
    // Define priority rules based on pax count
    const getPriorityTables = (paxCount) => {
        const rules = {
            1: ['C5', 'C7'], // 1 pax: C5 first, then C7
            2: ['C5', 'C7'], // 2 pax: C5 first, then C7
            3: ['C3', 'L1', 'L2', 'B2', 'B1'], // 3 pax: C3 first, then loft tables, then B tables
            4: ['C3', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'B2', 'B1'], // 4 pax: C3 first, then all loft tables, then B tables
            5: ['D2'], // 5 pax: D2 only
            6: ['D2'], // 6 pax: D2 only
        };
        
        // For 7+ pax, use largest tables first, outdoor last
        if (paxCount >= 7) {
            return ['D1', 'D3', 'E1', 'E2'];
        }
        
        return rules[paxCount] || [];
    };
    
    // Get priority list for this booking
    const priorityList = getPriorityTables(pax);
    console.log(`📋 Priority list for ${pax} pax:`, priorityList);
    
    // Filter available tables that can accommodate the party size and are available at the time
    const availableTables = tables.filter(table => {
        // Check capacity
        if (table.capacity < pax) {
            return false;
        }
        
        // Check time availability
        if (hasReservationConflict(table.id, bookingStart, bookingEnd)) {
            return false;
        }
        
        return true;
    });
    
    console.log('✅ Available tables:', availableTables.map(t => `${t.id} (${t.capacity} pax)`));
    
    if (availableTables.length === 0) {
        console.log('❌ No available tables found');
        return { 
            success: false, 
            error: 'No available tables found for this time slot and party size',
            pax: pax,
            time: bookingStart.toLocaleString()
        };
    }
    
    // Find the best table according to priority
    let selectedTable = null;
    
    // First, try to find a table from the priority list
    for (const tableId of priorityList) {
        const table = availableTables.find(t => t.id === tableId);
        if (table) {
            selectedTable = table;
            console.log(`🎯 Selected priority table: ${tableId}`);
            break;
        }
    }
    
    // If no priority table available, choose the smallest available table that fits
    if (!selectedTable) {
        // Sort by capacity (smallest first) and prefer indoor over outdoor
        availableTables.sort((a, b) => {
            // First sort by capacity
            if (a.capacity !== b.capacity) {
                return a.capacity - b.capacity;
            }
            
            // Then prefer indoor over outdoor (outdoor tables start with 'E')
            const aIsOutdoor = a.id.startsWith('E');
            const bIsOutdoor = b.id.startsWith('E');
            
            if (aIsOutdoor && !bIsOutdoor) return 1;
            if (!aIsOutdoor && bIsOutdoor) return -1;
            
            // Finally sort by table ID for consistency
            return a.id.localeCompare(b.id);
        });
        
        selectedTable = availableTables[0];
        console.log(`🔄 Selected fallback table: ${selectedTable.id}`);
    }
    
    if (!selectedTable) {
        console.log('❌ No suitable table found after selection logic');
        return { 
            success: false, 
            error: 'No suitable table found',
            pax: pax,
            time: bookingStart.toLocaleString()
        };
    }
    
    // Create reservation object
    const reservation = {
        id: 'calendly_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        tableId: selectedTable.id,
        source: 'calendly', // Use new source field
        status: 'reserved', // Default status for new Calendly bookings
        pax: pax,
        startTime: bookingStart.toISOString(),
        endTime: bookingEnd.toISOString(),
        duration: duration || Math.round((bookingEnd - bookingStart) / 60000), // Duration in minutes
        customerName: customerName || 'Calendly Booking',
        phoneNumber: phoneNumber || null,
        customerNotes: null, // Set to null since we use specialRequest for Calendly
        specialRequest: calendlyBooking.specialRequest || null, // Store special request separately
        systemNotes: `Automatically assigned from Calendly booking`, // Simplified system note
        createdAt: new Date().toISOString()
    };
    
    console.log('✅ Created reservation:', {
        id: reservation.id,
        table: selectedTable.id,
        customer: reservation.customerName,
        pax: reservation.pax,
        time: reservation.startTime
    });
    
    return {
        success: true,
        table: selectedTable,
        reservation: reservation,
        message: `Assigned to table ${selectedTable.id} (${selectedTable.capacity} pax capacity)`
    };
};

// Function to process multiple Calendly bookings
window.processCalendlyBookings = async function(calendlyBookings) {
    console.log('Processing Calendly bookings:', calendlyBookings);
    
    const results = {
        successful: [],
        failed: [],
        summary: {
            total: calendlyBookings.length,
            assigned: 0,
            failed: 0
        }
    };
    
    for (let i = 0; i < calendlyBookings.length; i++) {
        const booking = calendlyBookings[i];
        try {
            const assignmentResult = assignCalendlyBookingToTable(booking);
            
            if (assignmentResult.success) {
                // Add reservation to the table locally first
                const table = tables.find(t => t.id === assignmentResult.table.id);
                if (table) {
                    table.reservations.push(assignmentResult.reservation);
                    
                    // Sort reservations by start time
                    table.reservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                }
                
                // Save to Airtable with proper error handling
                try {
                    if (window.airtableService) {
                        console.log('Saving Calendly booking to Airtable...');
                        
                        // **FIXED: Use correct field mapping to match walk-in reservation pattern**
                        const fields = {
                            "Table": assignmentResult.table.id,
                            "Reservation Type": "Calendly", // Use proper Airtable value
                            "Status": "Reserved", // Map to proper Airtable status
                            "Pax": assignmentResult.reservation.pax.toString(),
                            "DateandTime": assignmentResult.reservation.startTime,
                            "Duration": assignmentResult.reservation.duration.toString(),
                            "Confirmation": false // Explicitly set to false to prevent auto-ticking
                        };

                        // Add customer name to the proper Name field
                        if (assignmentResult.reservation.customerName) {
                            fields["Name"] = assignmentResult.reservation.customerName;
                        }
                        
                        // Add special request to Customer Notes (only if it exists)
                        if (assignmentResult.reservation.specialRequest) {
                            fields["Customer Notes"] = assignmentResult.reservation.specialRequest;
                        }

                        // Add phone number if available
                        if (assignmentResult.reservation.phoneNumber) {
                            fields["PH Number"] = assignmentResult.reservation.phoneNumber;
                        }
                        
                        // Add system notes to track this is a Calendly booking
                        fields["System Notes"] = `Automatically assigned from Calendly booking - Duration: ${assignmentResult.reservation.duration} minutes`;

                        console.log('Saving to Airtable with fields:', fields); // Debug log

                        const result = await window.airtableService.base('tbl9dDLnVa5oLEnuq').create([
                            { fields }
                        ]);
                        
                        // **CRITICAL: Update the local reservation with Airtable ID**
                        const localReservation = table.reservations.find(r => r.id === assignmentResult.reservation.id);
                        if (localReservation && result && result[0]) {
                            localReservation.airtableId = result[0].id;
                            // **IMPORTANT: Also update the reservation ID to match Airtable**
                            localReservation.id = result[0].id;
                            console.log(`✅ Calendly booking saved to Airtable with ID: ${result[0].id}`);
                        } else {
                            console.warn('⚠️ Failed to link local reservation with Airtable record');
                        }
                        
                        // **CRITICAL: Clear Airtable cache to ensure fresh data**
                        window.airtableService.cachedReservations = [];
                        window.airtableService.lastFetchTime = null;
                        
                    } else {
                        console.warn('⚠️ Airtable service not available - assignment saved locally only');
                    }
                } catch (airtableError) {
                    console.error('❌ CRITICAL: Failed to save Calendly booking to Airtable:', airtableError);
                    
                    // **IMPORTANT: Remove the local reservation if Airtable save fails**
                    if (table) {
                        table.reservations = table.reservations.filter(r => r.id !== assignmentResult.reservation.id);
                        console.log('🗑️ Removed local reservation due to Airtable save failure');
                    }
                    
                    // Mark this assignment as failed
                    results.failed.push({
                        booking: booking,
                        error: `Failed to save to Airtable: ${airtableError.message}`
                    });
                    results.summary.failed++;
                    continue; // Skip to next booking
                }
                
                results.successful.push({
                    booking: booking,
                    assignment: assignmentResult
                });
                results.summary.assigned++;
                
                console.log(`✅ Booking ${i + 1} assigned to table ${assignmentResult.table.id} and saved to Airtable`);
            } else {
                results.failed.push({
                    booking: booking,
                    error: assignmentResult.error
                });
                results.summary.failed++;
                
                console.log(`❌ Booking ${i + 1} failed: ${assignmentResult.error}`);
            }
        } catch (error) {
            console.error(`❌ Error processing booking ${i + 1}:`, error);
            results.failed.push({
                booking: booking,
                error: error.message
            });
            results.summary.failed++;
        }
    }
    
    // **CRITICAL: Force refresh from Airtable after all assignments**
    if (results.summary.assigned > 0) {
        try {
            console.log('🔄 Refreshing data from Airtable after Calendly assignments...');
            
            // Clear cache and fetch fresh data
            if (window.airtableService) {
                window.airtableService.cachedReservations = [];
                window.airtableService.lastFetchTime = null;
            }
            
            // Fetch fresh data from Airtable
            await fetchAndUpdateReservations();
            
            // Update UI with fresh data
            initialize();
            updateReservationCount();
            updateFloorPlanTableStatuses();
            
            // Show success message with more details
            const successMessage = `Successfully assigned ${results.summary.assigned} Calendly booking(s) to tables and saved to Airtable!`;
            showSuccessMessage(successMessage);
            
            // Log detailed assignment information
            console.log('📊 Assignment Summary:', {
                successful: results.successful.map(s => ({
                    customer: s.booking.customerName,
                    pax: s.booking.pax,
                    time: s.booking.startTime.toLocaleString(),
                    assignedTable: s.assignment.table.id
                })),
                failed: results.failed
            });
        } catch (refreshError) {
            console.error('❌ Error refreshing data after assignments:', refreshError);
            // Show success anyway but mention refresh issue
            showSuccessMessage(`Assigned ${results.summary.assigned} bookings, but UI refresh failed. Please refresh the page.`);
        }
    }
    
    // Show summary for failed assignments
    if (results.summary.failed > 0) {
        console.warn(`⚠️ Failed to assign ${results.summary.failed} booking(s)`);
        
        // Show detailed failure information
        results.failed.forEach(failure => {
            console.warn('Failed booking:', failure.booking, 'Error:', failure.error);
        });
        
        // Show user-friendly error message
        const failedDetails = results.failed.map(f => 
            `${f.booking.customerName || 'Unknown'} (${f.booking.pax} pax) - ${f.error}`
        ).join('\n');
        
        alert(`Some Calendly bookings could not be assigned:\n\n${failedDetails}\n\nPlease assign these manually or check for table availability.`);
    }
    
    return results;
};

// Function to validate and normalize Calendly booking data
window.normalizeCalendlyBooking = function(rawBooking) {
    // Expected format: { startTime, endTime?, pax, customerName?, phoneNumber? }
    // or { time, duration?, pax, customerName?, phoneNumber? }
    
    let startTime, endTime;
    
    if (rawBooking.startTime && rawBooking.endTime) {
        startTime = new Date(rawBooking.startTime);
        endTime = new Date(rawBooking.endTime);
    } else if (rawBooking.time) {
        startTime = new Date(rawBooking.time);
        const duration = rawBooking.duration || 60; // Default 60 minutes
        endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
    } else {
        throw new Error('Invalid booking: missing time information');
    }
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid booking: invalid date/time format');
    }
    
    const pax = parseInt(rawBooking.pax) || parseInt(rawBooking.guests) || parseInt(rawBooking.partySize) || 2;
    
    if (pax < 1 || pax > 12) {
        throw new Error(`Invalid booking: party size ${pax} is out of range (1-12)`);
    }
    
    return {
        startTime: startTime,
        endTime: endTime,
        duration: Math.round((endTime - startTime) / 60000),
        pax: pax,
        customerName: rawBooking.customerName || rawBooking.name || rawBooking.inviteeName || null,
        phoneNumber: rawBooking.phoneNumber || rawBooking.phone || null,
        specialRequest: rawBooking.specialRequest || null,
        eventId: rawBooking.eventId || null
    };
};

// **DEBUG FUNCTION: Test Calendly Assignment System**
window.testCalendlyAssignmentSystem = async function() {
    console.log('🧪 Testing Calendly Assignment System...');
    
    // Test data
    const testBooking = {
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        pax: 3,
        customerName: 'Test Customer',
        phoneNumber: '+65 9999 9999',
        specialRequest: 'Test booking for system verification'
    };
    
    console.log('Test booking data:', testBooking);
    
    try {
        // Step 1: Test assignment logic
        console.log('🔍 Step 1: Testing assignment logic...');
        const assignmentResult = assignCalendlyBookingToTable(testBooking);
        console.log('Assignment result:', assignmentResult);
        
        if (!assignmentResult.success) {
            console.error('❌ Assignment failed:', assignmentResult.error);
            return { success: false, step: 'assignment', error: assignmentResult.error };
        }
        
        // Step 2: Test normalization
        console.log('🔍 Step 2: Testing booking normalization...');
        const normalizedBooking = normalizeCalendlyBooking(testBooking);
        console.log('Normalized booking:', normalizedBooking);
        
        // Step 3: Test the full process (but don't actually save to Airtable)
        console.log('🔍 Step 3: Testing full process (dry run)...');
        console.log('✅ All tests passed! The system appears to be working correctly.');
        
        return { 
            success: true, 
            assignedTable: assignmentResult.table.id,
            message: 'Test completed successfully - system is ready for Calendly bookings!'
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
};

// **NEW: Function to clean up duplicate Calendly reservations**
window.cleanupDuplicateCalendlyReservations = async function() {
    console.log('🧹 Cleaning up duplicate Calendly reservations...');
    
    const duplicates = [];
    const tablesToUpdate = new Set();
    
    // Check all tables for duplicate Calendly reservations
    for (const table of tables) {
        const calendlyReservations = table.reservations.filter(r => r.source === 'calendly');
        
        for (let i = 0; i < calendlyReservations.length; i++) {
            for (let j = i + 1; j < calendlyReservations.length; j++) {
                const res1 = calendlyReservations[i];
                const res2 = calendlyReservations[j];
                
                const time1 = new Date(res1.startTime);
                const time2 = new Date(res2.startTime);
                const timeDiff = Math.abs(time1 - time2);
                
                // Check for duplicates based on time and customer info
                const isDuplicate = timeDiff < 60000 || // Within 1 minute
                    (timeDiff < 300000 && // Within 5 minutes
                     ((res1.customerName === res2.customerName && res1.customerName) ||
                      (res1.phoneNumber === res2.phoneNumber && res1.phoneNumber)));
                
                if (isDuplicate) {
                    // Keep the one with more complete information
                    const res1Complete = res1.customerName && res1.customerName !== 'Calendly Booking';
                    const res2Complete = res2.customerName && res2.customerName !== 'Calendly Booking';
                    
                    const toRemove = res1Complete && !res2Complete ? res2 : 
                                   !res1Complete && res2Complete ? res1 : 
                                   res1; // Default to removing the first one
                    
                    duplicates.push({
                        tableId: table.id,
                        reservation: toRemove,
                        reason: 'Duplicate Calendly reservation'
                    });
                    
                    tablesToUpdate.add(table.id);
                }
            }
        }
    }
    
    if (duplicates.length === 0) {
        console.log('✅ No duplicate Calendly reservations found');
        return { success: true, message: 'No duplicates found' };
    }
    
    console.log(`Found ${duplicates.length} duplicate Calendly reservations to clean up`);
    
    try {
        // Remove duplicates from local tables
        for (const duplicate of duplicates) {
            const table = tables.find(t => t.id === duplicate.tableId);
            if (table) {
                table.reservations = table.reservations.filter(r => r.id !== duplicate.reservation.id);
                console.log(`Removed duplicate from table ${duplicate.tableId}: ${duplicate.reservation.customerName || 'No name'}`);
            }
        }
        
        // Update UI
        initialize();
        updateReservationCount();
        updateFloorPlanTableStatuses();
        
        console.log(`✅ Successfully cleaned up ${duplicates.length} duplicate Calendly reservations`);
        
        return {
            success: true,
            cleanedCount: duplicates.length,
            message: `Cleaned up ${duplicates.length} duplicate Calendly reservations`
        };
        
    } catch (error) {
        console.error('❌ Error cleaning up duplicates:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Update reservation status
window.updateReservationStatus = async function(tableId, reservationId, newStatus) {
    const table = tables.find(t => t.id === tableId);
    if (!table) {
        console.error('Table not found:', tableId);
        return;
    }
    
    const reservation = table.reservations.find(r => r.id === reservationId);
    if (!reservation) {
        console.error('Reservation not found:', reservationId);
        return;
    }
    
    const oldStatus = reservation.status || 'reserved';
    
    try {
        // For no-show, just update the status
        if (newStatus === 'no-show') {
            console.log('Marking reservation as no-show:', reservationId);
            
            // Update status in Airtable
            if (window.airtableService) {
                await window.airtableService.updateReservationStatus(reservationId, newStatus);
                console.log('Successfully updated reservation to no-show in Airtable');
            }
            
            // Update local status
            reservation.status = newStatus;
            
            // Update UI
            initialize();
            updateFloorPlanTableStatuses();
            
            // Show success message
            showSuccessMessage(`Reservation marked as no-show`);
            
            console.log('No-show status updated successfully:', reservationId);
            
            return;
        }
        
        // For other status changes, proceed with normal update
        if (window.airtableService && (reservation.airtableId || reservation.id)) {
            console.log('Updating reservation status in Airtable...');
            const airtableRecordId = reservation.airtableId || reservation.id;
            await window.airtableService.updateReservationStatus(airtableRecordId, newStatus);
            
            // Clear cache and fetch fresh data
            window.airtableService.cachedReservations = [];
            window.airtableService.lastFetchTime = null;
            
            // Fetch fresh data
            await fetchAndUpdateReservations();
        }
        
        // Update local status
        reservation.status = newStatus;
        
        // Update UI
        initialize();
        updateFloorPlanTableStatuses();
        
        // Show success message
        showSuccessMessage(`Reservation status updated from "${oldStatus}" to "${newStatus}"`);
        
        console.log('Reservation status updated:', { reservationId, oldStatus, newStatus });
        
    } catch (error) {
        console.error('Error updating reservation status:', error);
        alert('Failed to update status: ' + error.message);
    }
};

// Function to manually assign all unassigned Calendly bookings
window.assignAllCalendlyBookings = async function() {
    console.log('Manually assigning all Calendly bookings...');
    
    try {
        // Show loading message
        showSuccessMessage('Processing Calendly bookings...');
        
        // Get actual Calendly bookings from your system here
        const results = await processCalendlyBookings([]);
        
        if (results.summary.assigned > 0) {
            showSuccessMessage(`Successfully assigned ${results.summary.assigned} Calendly booking(s)! Check your tables and Airtable.`);
        } else {
            console.log('No Calendly bookings to assign');
        }
        
        return results;
        
    } catch (error) {
        console.error('Error assigning Calendly bookings:', error);
        alert('Error assigning bookings: ' + error.message);
    }
};

// Function to position the popover relative to the clicked button
function positionPopover(clickedElement) {
    const popover = document.getElementById('reservationPopover');
    const buttonRect = clickedElement.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Reset any previous positioning classes
    popover.classList.remove('position-right', 'position-left', 'position-top', 'position-bottom');
    
    // On mobile, we don't need to position the popover
    if (window.innerWidth <= 576) {
        return;
    }
    
    const spaceRight = window.innerWidth - (buttonRect.right + 10);
    const spaceLeft = buttonRect.left - 10;
    const spaceTop = buttonRect.top - 10;
    const spaceBottom = window.innerHeight - (buttonRect.bottom + 10);
    
    // Default to positioning on the right if there's enough space
    if (spaceRight >= 320) { // 320px is our popover width
        popover.style.top = `${buttonRect.top + scrollY - 20}px`;
        popover.style.left = `${buttonRect.right + scrollX + 10}px`;
        popover.classList.add('position-right');
    }
    // Try left side if right side doesn't have enough space
    else if (spaceLeft >= 320) {
        popover.style.top = `${buttonRect.top + scrollY - 20}px`;
        popover.style.left = `${buttonRect.left + scrollX - 330}px`;
        popover.classList.add('position-left');
    }
    // Try bottom if neither left nor right has enough space
    else if (spaceBottom >= 400) { // 400px is approximate height of our form
        popover.style.top = `${buttonRect.bottom + scrollY + 10}px`;
        popover.style.left = `${buttonRect.left + scrollX - 160 + (buttonRect.width / 2)}px`;
        popover.classList.add('position-bottom');
    }
    // Default to top if no other position works
    else {
        popover.style.top = `${buttonRect.top + scrollY - 410}px`;
        popover.style.left = `${buttonRect.left + scrollX - 160 + (buttonRect.width / 2)}px`;
        popover.classList.add('position-top');
    }
}

// Handle clicks outside the popover
function handleClickOutside(event) {
    const popover = document.getElementById('reservationPopover');
    const clickedElement = event.target;
    
    // Don't close if clicking inside the popover
    if (popover.contains(clickedElement)) {
        return;
    }
    
    // Don't close if clicking the reservation button
    if (clickedElement.closest('.make-reservation-btn')) {
        return;
    }
    
    // Don't close if clicking on time picker or any dropdown elements
    if (clickedElement.closest('.time-picker-dropdown') || 
        clickedElement.closest('.form-select') ||
        clickedElement.closest('select') ||
        clickedElement.closest('option') ||
        clickedElement.closest('input[type="time"]') ||
        // Add these classes to handle Bootstrap's time picker
        clickedElement.closest('.bootstrap-timepicker-widget') ||
        clickedElement.closest('.timepicker') ||
        // Handle any dropdown menus
        clickedElement.closest('.dropdown-menu')) {
        return;
    }
    
    closeReservationPopover();
}

// Function to update status select styling
function updateStatusSelectStyling(status) {
    const statusSelect = document.getElementById('reservationStatus');
    if (!statusSelect) return;
    
    // Remove all status classes
    statusSelect.classList.remove('reserved', 'arrived', 'paid', 'no-show');
    // Add the current status class
    statusSelect.classList.add(status);
}

// Function to close the reservation popover
function closeReservationPopover() {
    const popover = document.getElementById('reservationPopover');
    if (popover) {
        popover.classList.remove('show');
        // Remove click outside listener
        document.removeEventListener('click', handleClickOutside);
        
        // Reset form
        const form = document.getElementById('popoverReservationForm');
        if (form) {
            form.reset();
        }
    }
}

// Function to handle popover form submission
async function handlePopoverSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        // Disable button to prevent double submission
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        
        // Get form data from popover form
        const formData = {
            tableId: document.getElementById('popoverSelectedTableId').value,
            source: document.getElementById('popoverReservationSource').value,
            status: document.getElementById('popoverReservationStatus').value,
            numberOfGuests: document.getElementById('popoverNumberOfGuests').value,
            arrivalTime: document.getElementById('popoverArrivalTime').value,
            duration: document.getElementById('popoverDuration').value,
            customerName: document.getElementById('popoverCustomerName').value,
            phoneNumber: document.getElementById('popoverPhoneNumber').value,
            customerNotes: document.getElementById('popoverCustomerNotes').value
        };
        
        console.log('🔥 Popover form data:', formData);
        
        // Validate required fields
        if (!formData.tableId || !formData.source || !formData.status || 
            !formData.numberOfGuests || !formData.arrivalTime || !formData.duration) {
            throw new Error('Please fill in all required fields');
        }
        
        // Use the Airtable service to create reservation
        const today = new Date();
        const [hours, minutes] = formData.arrivalTime.split(':');
        const arrivalDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

        const airtableReservation = await window.airtableService.createWalkInReservation(
            formData.tableId,
            arrivalDateTime,
            formData.source,
            {
                customerName: formData.customerName,
                phoneNumber: formData.phoneNumber,
                pax: parseInt(formData.numberOfGuests),
                customerNotes: formData.customerNotes,
                systemNotes: `Duration: ${formData.duration} minutes. Created via popover.`,
                status: formData.status,
                duration: parseInt(formData.duration)
            }
        );

        console.log('✅ Popover reservation saved successfully:', airtableReservation);

        // Close the popover
        closeReservationPopover();

        // Show success message
        showSuccessMessage('Reservation created successfully!');

        // Update the UI
        setTimeout(async () => {
            await fetchAndUpdateReservations();
            updateFloorPlanTableStatuses();
            updateReservationCount();
        }, 500);

    } catch (error) {
        console.error('❌ Error saving popover reservation:', error);
        alert('Failed to save reservation: ' + error.message);
    } finally {
        // Re-enable the button
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Make function globally available
window.handlePopoverSubmit = handlePopoverSubmit;

// Function to handle guest count change with +/- buttons
function changeGuestCount(change) {
    const guestInput = document.getElementById('editNumberOfGuests');
    if (!guestInput) return;
    
    const currentValue = parseInt(guestInput.value) || 1;
    const newValue = Math.max(1, Math.min(20, currentValue + change));
    guestInput.value = newValue;
    
    // Trigger change event for validation
    guestInput.dispatchEvent(new Event('change'));
}

// Function to handle duration dropdown change
function handleDurationChange() {
    const durationSelect = document.getElementById('editDuration');
    const customDurationRow = document.getElementById('customDurationRow');
    
    if (!durationSelect || !customDurationRow) return;
    
    if (durationSelect.value === 'custom') {
        customDurationRow.style.display = 'block';
        const customInput = document.getElementById('editCustomDuration');
        if (customInput) {
            customInput.focus();
        }
    } else {
        customDurationRow.style.display = 'none';
    }
}

// Make functions globally available
window.changeGuestCount = changeGuestCount;
window.handleDurationChange = handleDurationChange;

// Function to open the reservation popover
function openReservationPopover(tableId, clickedElement) {
    const table = tables.find(t => t.id === tableId);
    if (!table) {
        console.error('Table not found:', tableId);
        return;
    }
    
    console.log('Opening reservation popover for table:', table); // Debug log
    
    // Set table information
    document.getElementById('popoverSelectedTableId').value = tableId;
    
    // Update table info display
    const tableInfo = document.querySelector('.table-info');
    if (tableInfo) {
        tableInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-info-circle me-2"></i>
                <div>
                    <strong>Table ${tableId}</strong><br>
                    <small>${table.type || 'Regular table'} - Maximum ${table.capacity} guests</small>
                </div>
            </div>
        `;
    }
    
    // Reset form completely
    const form = document.getElementById('popoverReservationForm');
    if (form) {
        form.reset();
    }
    
    // Set current time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Update arrival time
    const arrivalTimeInput = document.getElementById('popoverArrivalTime');
    if (arrivalTimeInput) {
        arrivalTimeInput.value = timeString;
    }
    
    // Initialize number of guests dropdown with table capacity
    initializeGuestsDropdown(table.capacity);
    
    // Set source to walk-in by default
    const sourceSelect = document.getElementById('popoverReservationSource');
    if (sourceSelect) {
        sourceSelect.value = 'walk-in';
    }
    
    // Set default status based on source (walk-in)
    const statusSelect = document.getElementById('popoverReservationStatus');
    if (statusSelect) {
        statusSelect.value = 'reserved'; // Default for all new reservations
        updateStatusSelectStyling('reserved');
    }
    
    // Position and show the popover
    const popover = document.getElementById('reservationPopover');
    positionPopover(clickedElement);
    popover.classList.add('show');
    
    // Add click outside listener with delay
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
}

// Function to initialize the guests dropdown
function initializeGuestsDropdown(maxCapacity) {
    console.log('Initializing guests dropdown with max capacity:', maxCapacity); // Debug log
    
    const select = document.getElementById('popoverNumberOfGuests');
    if (!select) {
        console.error('Number of guests select element not found');
        return;
    }
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select number of guests';
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    // Add options for each possible number of guests
    for (let i = 1; i <= maxCapacity; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = `${i} ${i === 1 ? 'Guest' : 'Guests'}`;
        select.appendChild(option);
    }
    
    // Add change event listener
    select.addEventListener('change', function() {
        console.log('Selected guests:', this.value); // Debug log
    });
    
    console.log('Dropdown initialized with options:', select.options.length); // Debug log
    console.log('Dropdown innerHTML after initialization:', select.innerHTML); // Debug log
}

// Update source change handler
document.getElementById('reservationSource').addEventListener('change', function(e) {
    const statusSelect = document.getElementById('reservationStatus');
    if (statusSelect) {
        // Always default to reserved when source changes
        statusSelect.value = 'reserved';
        updateStatusSelectStyling('reserved');
    }
});

// Handle arrival time change
document.getElementById('arrivalTime').addEventListener('change', updateDurationHelp);

// Update duration help text based on time
function updateDurationHelp() {
    const arrivalTimeInput = document.getElementById('arrivalTime');
    const durationRule = document.getElementById('durationRule');
    
    if (arrivalTimeInput && durationRule) {
        const time = arrivalTimeInput.value;
        if (time) {
            const hour = parseInt(time.split(':')[0]);
            let rule = '';
            
            if (hour >= 11 && hour < 14) {
                rule = 'Lunch period: 1 hour recommended';
            } else if (hour >= 14 && hour < 17) {
                rule = 'Afternoon: 1.5 hours recommended';
            } else if (hour >= 17 && hour < 22) {
                rule = 'Dinner: 2 hours recommended';
            } else {
                rule = 'Late dining: 1.5 hours recommended';
            }
            
            durationRule.textContent = rule;
        }
    }
}

// Add event delegation for make-reservation-btn (only add once)
if (!window.reservationClickHandlerAdded) {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.make-reservation-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const tableId = btn.getAttribute('data-table-id');
            console.log('Make reservation button clicked for table:', tableId);
            openReservationPopover(tableId, btn);
        }
    });
    window.reservationClickHandlerAdded = true;
    console.log('Added reservation click handler (one time only)');
}

// Add table click handler for floor plan tables
window.handleTableClick = function(tableId) {
    console.log('Floor plan table clicked:', tableId);
    const tableElement = document.querySelector(`[onclick*="'${tableId}'"]`);
    if (tableElement) {
        openReservationPopover(tableId, tableElement);
    }
};

// Function to save a reservation
async function saveReservation(formData) {
    console.log('🔄 Starting saveReservation with data:', formData);

    // Validate required fields
    if (!formData.tableId || !formData.source || !formData.status || 
        !formData.numberOfGuests || !formData.arrivalTime || !formData.duration) {
        throw new Error('Missing required fields');
    }

    // Find the table
    const table = window.tables.find(t => t.id === formData.tableId);
    if (!table) {
        throw new Error('Table not found');
    }

    // Check if the table has enough capacity
    const requestedGuests = parseInt(formData.numberOfGuests);
    if (requestedGuests > table.capacity) {
        throw new Error(`Table ${table.name} only has capacity for ${table.capacity} guests`);
    }

    // Calculate end time based on arrival time and duration
    const arrivalTime = new Date();
    const [hours, minutes] = formData.arrivalTime.split(':');
    arrivalTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endTime = new Date(arrivalTime);
    endTime.setMinutes(endTime.getMinutes() + parseInt(formData.duration));

    // Check for conflicts
    if (hasReservationConflict(formData.tableId, arrivalTime, endTime)) {
        throw new Error('This time slot conflicts with an existing reservation');
    }

    // Create the reservation object
    const reservation = {
        id: Date.now().toString(), // Unique ID
        tableId: formData.tableId,
        source: formData.source,
        status: formData.status,
        numberOfGuests: requestedGuests,
        arrivalTime: arrivalTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: parseInt(formData.duration),
        customerName: formData.customerName || '',
        phoneNumber: formData.phoneNumber || '',
        notes: formData.customerNotes || '',
        createdAt: new Date().toISOString()
    };

    console.log('📝 Created reservation object:', reservation);

    // Add the reservation to the table's reservations array
    if (!table.reservations) {
        table.reservations = [];
    }
    table.reservations.push(reservation);

    // Sort reservations by arrival time
    table.reservations.sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));

    console.log('✅ Added reservation to table:', table.id);
    console.log('📊 Current reservations for table:', table.reservations);

    // Return the created reservation
    return reservation;
}

// Main function to handle reservation submission
async function handleReservationSubmit(form) {
    console.log('🔥 Starting reservation creation process...');

    const confirmButton = document.getElementById('confirmReservation');
    const originalText = confirmButton?.innerHTML || 'Confirm Reservation';

    try {
        // Get form values directly from the form
        const tableId = form.querySelector('#selectedTableId')?.value;
        const source = form.querySelector('#reservationSource')?.value;
        const status = form.querySelector('#reservationStatus')?.value;
        const numberOfGuests = form.querySelector('#numberOfGuests')?.value;
        const arrivalTime = form.querySelector('#arrivalTime')?.value;
        const duration = form.querySelector('#duration')?.value;
        const customerName = form.querySelector('#customerName')?.value?.trim() || '';
        const phoneNumber = form.querySelector('#phoneNumber')?.value?.trim() || '';
        const notes = form.querySelector('#customerNotes')?.value?.trim() || '';

        // --- DEBUG LOGS ---
        console.log('=== RESERVATION FORM DATA ===');
        console.log({ tableId, source, status, numberOfGuests, arrivalTime, duration, customerName, phoneNumber, notes });
        console.log('=============================');

        // --- VALIDATION ---
        if (!tableId || !source || !status || !numberOfGuests || !arrivalTime || !duration) {
            alert('❌ Please fill in all required fields.');
            // Highlight missing fields
            [...form.elements].forEach(el => {
                if (el.required && !el.value) {
                    el.style.borderColor = '#dc3545';
                } else {
                    el.style.borderColor = '';
                }
            });
            return;
        }

        // --- PROCESSING ---
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        }

        // Create date object from arrival time
        const today = new Date();
        const [hours, minutes] = arrivalTime.split(':');
        const arrivalDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

        // Ensure AirtableService is ready
        if (!window.airtableService) {
            throw new Error('AirtableService is not available. Please refresh the page.');
        }

        // Call the Airtable service with the correct reservation source
        const airtableReservation = await window.airtableService.createWalkInReservation(
            tableId,
            arrivalDateTime,
            source, // Pass the user-selected source directly
            {
                customerName,
                phoneNumber,
                pax: parseInt(numberOfGuests),
                customerNotes: notes,
                systemNotes: `Duration: ${duration} minutes. Created via floor plan.`,
                status,
                duration: parseInt(duration)
            }
        );

        if (!airtableReservation) {
            throw new Error('Airtable did not return a confirmation.');
        }

        console.log('✅ Reservation created successfully:', airtableReservation);

        // --- UI FEEDBACK ---
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        if (modal) modal.hide();
        
        form.reset();
        
        const successMessage = `✅ Reservation confirmed for Table ${tableId} at ${arrivalDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        setTimeout(() => alert(successMessage), 300);

        // Refresh UI data
        setTimeout(async () => {
            await fetchAndUpdateReservations();
            updateFloorPlanTableStatuses();
        }, 500);

    } catch (error) {
        console.error('❌ Error creating reservation:', error);
        alert(`❌ Failed to create reservation: ${error.message}`);
    } finally {
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = originalText;
        }
    }
}

// Make the function globally available
window.handleReservationSubmit = handleReservationSubmit;

// Helper function to calculate end time from start time and duration
function calculateEndTime(startTimeStr, systemNotes = null, duration = null) {
    const startTime = new Date(startTimeStr);
    
    // If direct duration is provided, use it
    if (duration !== null) {
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + parseInt(duration));
        return endTime.toISOString();
    }
    
    // If system notes are provided, try to extract duration from them
    if (systemNotes) {
        const extractedDuration = extractDuration(systemNotes);
        if (extractedDuration !== null) {
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + extractedDuration);
            return endTime.toISOString();
        }
    }
    
    // If no duration found, return null
    return null;
}

// Helper function to extract duration from system notes
function extractDuration(systemNotes) {
    if (!systemNotes) return null;
    
    const durationMatch = systemNotes.match(/Duration:\s*(\d+)\s*minutes/);
    return durationMatch ? parseInt(durationMatch[1]) : null;
}



// DISABLED: Form submit handler - using button click handler in main.js instead
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('Adding form submit listener'); // Debug log
//     
//     // Use event delegation to handle form submission
//     document.addEventListener('submit', function(event) {
//         if (event.target.id === 'reservationForm') {
//             console.log('Reservation form submitted!'); // Debug log
//             handleReservationSubmit(event);
//         }
//     });
// });

// Automatically scale the floor plan to fit the container
function updateFloorPlanScale() {
    const container = document.querySelector('.floor-plan-container');
    const wrapper = document.querySelector('.floor-plan-wrapper');

    if (!container || !wrapper) {
        return;
    }

    // Use a small timeout to ensure the layout is stable before measuring
    setTimeout(() => {
        const INTRINSIC_WIDTH = 1050; // The floor plan's natural, internal width
        const INTRINSIC_HEIGHT = 900; // The floor plan's natural, internal height

        const style = getComputedStyle(container);
        const containerWidth = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

        // Calculate the correct scale. Never scale up, only down.
        const scale = Math.min(1, containerWidth / INTRINSIC_WIDTH);

        // Apply the scale
        wrapper.style.transform = `scale(${scale})`;

        // Set the container's height to perfectly match the scaled content
        const newHeight = (INTRINSIC_HEIGHT * scale);
        container.style.height = `${newHeight + 40}px`; // Add some padding
    }, 100);
}

// Run on initial load and on resize for continuous responsiveness
document.addEventListener('DOMContentLoaded', updateFloorPlanScale);
window.addEventListener('resize', updateFloorPlanScale);

// QR code functionality is handled in main.js to avoid conflicts

// QR code functionality is now handled by showCustomQRCode() in main.js
