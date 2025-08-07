// Main Application Code

// Update reservation count - moved outside event listener to be globally available
window.updateReservationCount = function() {
    const totalReservations = window.tables ? window.tables.reduce((total, table) => {
        return total + (table.reservations ? table.reservations.length : 0);
    }, 0) : 0;
    
    const countElement = document.getElementById('reservations-count');
    if (countElement) {
        const span = countElement.querySelector('span');
        if (span) {
            span.textContent = `${totalReservations} Reservation${totalReservations !== 1 ? 's' : ''} Today`;
        }
    }
};

// Cleanup function to prevent duplicates
function cleanup() {
    // Clear existing intervals
    if (window.reservationUpdater) {
        clearInterval(window.reservationUpdater);
        window.reservationUpdater = null;
    }
    if (window.floorPlanUpdater) {
        clearInterval(window.floorPlanUpdater);
        window.floorPlanUpdater = null;
    }
    if (window.dateTimeUpdater) {
        clearInterval(window.dateTimeUpdater);
        window.dateTimeUpdater = null;
    }
    
    console.log('Cleaned up intervals and listeners');
}

// Run cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Prevent multiple initialization
if (window.appInitialized) {
    console.log('App already initialized, cleaning up first...');
    cleanup();
}

// Wait for all scripts to load - but only initialize once
window.addEventListener('load', function() {
    // Prevent multiple initializations
    if (window.appInitialized) {
        console.log('App already initialized, skipping...');
        return;
    }
    
    console.log('Initializing app for the first time...');
    window.appInitialized = true;

    // Initialize AirtableService
    let airtableService;
    try {
        airtableService = new AirtableService();
        // Make airtableService globally available
        window.airtableService = airtableService;
        console.log('AirtableService initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AirtableService:', error);
    }
    
    // Initialize tables with updated layout and simplified reservation system
    const tables = [
        { id: "A1", name: "A1", capacity: 1, type: "bar counter seating" },
        { id: "A2", name: "A2", capacity: 1, type: "bar counter seating" },
        { id: "A3", name: "A3", capacity: 1, type: "bar counter seating" },
        { id: "A4", name: "A4", capacity: 1, type: "bar counter seating" },
        { id: "A5", name: "A5", capacity: 1, type: "bar counter seating" },
        { id: "A6", name: "A6", capacity: 1, type: "bar counter seating" },
        { id: "A7", name: "A7", capacity: 1, type: "bar counter seating" },
        { id: "B1", name: "B1", capacity: 4, type: "table" },
        { id: "B2", name: "B2", capacity: 4, type: "table" },
        { id: "B3", name: "B3", capacity: 4, type: "table" },
        { id: "B4", name: "B4", capacity: 4, type: "table" },
        { id: "B5", name: "B5", capacity: 2, type: "table" },
        { id: "C1", name: "C1", capacity: 4, type: "table" },
        { id: "C2", name: "C2", capacity: 2, type: "table" },
        { id: "C3", name: "C3", capacity: 4, type: "table" },
        { id: "C4", name: "C4", capacity: 2, type: "table" },
        { id: "C5", name: "C5", capacity: 2, type: "table" },
        { id: "C7", name: "C7", capacity: 2, type: "table" },
        { id: "C6", name: "C6", capacity: 2, type: "table" },
        { id: "D1", name: "D1", capacity: 6, type: "table" },
        { id: "D2", name: "D2", capacity: 6, type: "table" },
        { id: "D3", name: "D3", capacity: 6, type: "table" },
        { id: "E1", name: "E1", capacity: 6, type: "outdoor seating" },
        { id: "E2", name: "E2", capacity: 6, type: "outdoor seating" },
        { id: "L1", name: "L1", capacity: 4, type: "loft table" },
        { id: "L2", name: "L2", capacity: 4, type: "loft table" },
        { id: "L3", name: "L3", capacity: 4, type: "loft table" },
        { id: "L4", name: "L4", capacity: 4, type: "loft table" },
        { id: "L5", name: "L5", capacity: 4, type: "loft table" },
        { id: "L6", name: "L6", capacity: 4, type: "loft table" },
        { id: "L7", name: "L7", capacity: 4, type: "loft table" },
        { id: "L8", name: "L8", capacity: 4, type: "loft table" }
    ].map(table => ({
        ...table,
        reservations: []  // Simple array to store reservations
    }));

    // Make tables globally available for other functions
    window.tables = tables;

    // Reset tables daily at midnight
    function resetTablesDaily() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            // Reset all tables to initial state - CLEAR ALL RESERVATIONS
            tables.forEach(table => {
                table.reservations = [];
            });
            
            // Update the UI
            initialize();
            console.log('Tables reset at midnight - all reservations cleared');
            
            // Set up next day's reset
            resetTablesDaily();
        }, timeUntilMidnight);
    }

    // Start the daily reset cycle
    resetTablesDaily();

    // Render table column - Split from renderTable for more modularity
    function renderTableColumn(table) {
        return `
            <div class="col-xl-3 col-lg-4 col-md-6 col-12 mb-4">
                ${renderTable(table)}
            </div>
        `;
    }
    
    // Render table with simplified reservation system
    function renderTable(table) {
        // Find current reservations
        const currentReservations = table.reservations || [];
        
        // Determine header class based on table type
        let headerClass = "bg-primary";
        if (table.type) {
            if (table.type.includes("bar")) {
                headerClass = "table-type-bar";
            } else if (table.type.includes("table")) {
                headerClass = "table-type-table";
            } else if (table.type.includes("outdoor")) {
                headerClass = "table-type-outdoor";
            }
        }
        
        return `
            <div id="table-card-${table.id}" class="card h-100 table-card">
                <div class="card-header ${headerClass} text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            ${table.name} 
                            ${currentReservations.length > 0 ? 
                              `<span class="badge bg-warning text-dark ms-2">${currentReservations.length}</span>` : 
                              ''}
                        </h5>
                        <div>
                            <button class="btn btn-sm btn-light qr-code-btn me-1" 
                                    data-table-id="${table.id}"
                                    title="Generate QR Code">
                                <i class="bi bi-qr-code"></i>
                            </button>
                            <button class="btn btn-sm btn-light make-reservation-btn" 
                                    data-table-id="${table.id}"
                                    title="Make Reservation">
                                <i class="bi bi-plus-circle"></i>
                            </button>
                        </div>
                    </div>
                    <small class="d-block text-white">${table.type ? table.type : ''} - ${table.capacity} pax capacity</small>
                </div>
                
                <div class="card-body p-0">
                    <!-- Current Reservations -->
                    <div class="list-group list-group-flush">
                        ${currentReservations.length > 0 ? 
                          currentReservations.map(reservation => renderReservationSummary(reservation, table)).join('') : 
                          `<div class="list-group-item border-0 text-center py-5">
                             <div class="text-muted mb-3">
                                 <i class="bi bi-calendar-x display-6"></i>
                             </div>
                             <h6 class="text-muted mb-3">No reservations today</h6>
                             <button class="btn btn-primary btn-sm make-reservation-btn" data-table-id="${table.id}">
                                 <i class="bi bi-plus-circle me-2"></i>Make Reservation
                             </button>
                           </div>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render reservation summary with clean, professional design
    function renderReservationSummary(reservation, table) {
        const startTime = new Date(reservation.startTime);
        const durationMinutes = reservation.duration || 60;
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + durationMinutes); // Use duration or default to 60 minutes
        const timeFormat = { hour: '2-digit', minute: '2-digit', hour12: true };

        // Get status color class
        const getStatusColor = (status) => {
            switch(status) {
                case 'reserved': return 'danger';
                case 'arrived': return 'warning';
                case 'paid': return 'success';
                case 'no-show': return 'dark';
                default: return 'secondary';
            }
        };

        // Get source icon and label
        const getSourceInfo = (source) => {
            switch(source) {
                case 'walk-in': return { icon: 'bi-person-walking', label: 'Walk-in' };
                case 'phone-call': return { icon: 'bi-telephone', label: 'Voice Agent' };
                case 'calendly': return { icon: 'bi-calendar-event', label: 'Calendly' };
                default: return { icon: 'bi-question-circle', label: 'Unknown' };
            }
        };

        const source = reservation.source || reservation.type || 'walk-in';
        const status = reservation.status || 'reserved';
        const sourceInfo = getSourceInfo(source);
        const statusColor = getStatusColor(status);

        // Handle notes properly for Calendly and other sources
        let customerNotes = null;
        let systemNotes = null;
        
        if (source === 'calendly' && reservation.specialRequest) {
            customerNotes = reservation.specialRequest;
        } else if (reservation.customerNotes) {
            customerNotes = reservation.customerNotes;
        }

        if (reservation.systemNotes) {
            systemNotes = reservation.systemNotes;
        }
        
        return `
            <div class="list-group-item border-0 p-2 border-start border-${statusColor} border-3" style="background: linear-gradient(90deg, var(--bs-${statusColor}) 0%, var(--bs-${statusColor}) 3px, rgba(var(--bs-${statusColor}-rgb), 0.05) 3px, rgba(var(--bs-${statusColor}-rgb), 0.05) 100%);">
                <div class="d-flex flex-column">
                    <!-- Source and Status Combined -->
                    <div class="d-flex gap-2 align-items-center mb-2">
                        <span class="badge bg-primary fs-6 px-3 py-2">
                            <i class="${sourceInfo.icon} me-1"></i>${sourceInfo.label}
                        </span>
                        <select class="form-select form-select-sm" style="width: auto; min-width: 130px;" 
                                onchange="updateReservationStatus('${table.id}', '${reservation.id}', this.value)">
                            <option value="reserved" ${status === 'reserved' ? 'selected' : ''}>🔴 Reserved</option>
                            <option value="arrived" ${status === 'arrived' ? 'selected' : ''}>🟠 Arrived</option>
                            <option value="paid" ${status === 'paid' ? 'selected' : ''}>🟢 Paid</option>
                            <option value="no-show" ${status === 'no-show' ? 'selected' : ''}>⚫ No Show</option>
                        </select>
                    </div>
                    <!-- Time on New Line -->
                    <div class="text-start">
                        <div class="fw-bold text-primary">
                            <i class="bi bi-clock me-1"></i>
                            ${startTime.toLocaleTimeString('en-US', timeFormat)} - ${endTime.toLocaleTimeString('en-US', timeFormat)}
                        </div>
                    </div>
                </div>
                
                <!-- Details - Clean Line by Line Display with Status Color Accent -->
                <div class="ms-2">
                    <div class="mb-1">
                        <strong class="text-${statusColor}">Guest:</strong> ${reservation.customerName || 'Walk-in Customer'}
                    </div>
                    <div class="mb-1">
                        <strong class="text-${statusColor}">Pax:</strong> ${(reservation.pax && reservation.pax !== "" ? reservation.pax : table.capacity)} guests
                    </div>
                    ${reservation.phoneNumber ? `
                        <div class="mb-1">
                            <strong class="text-${statusColor}">Phone:</strong> <a href="tel:${reservation.phoneNumber}" class="text-decoration-none text-${statusColor}">${reservation.phoneNumber}</a>
                        </div>
                    ` : ''}
                    <div class="mb-1">
                        <strong class="text-${statusColor}">Duration:</strong> ${durationMinutes} minutes
                    </div>
                    
                    ${customerNotes ? `
                        <div class="mt-2 mb-1">
                            <strong class="text-${statusColor}">Special Request:</strong>
                            <div class="text-muted small ms-2 p-2 bg-light rounded">${customerNotes}</div>
                        </div>
                    ` : ''}
                    
                    ${systemNotes ? `
                        <div class="mt-1">
                            <strong class="text-muted small">System Note:</strong>
                            <div class="text-muted small ms-2">${systemNotes}</div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Action Buttons -->
                <div class="mt-2 pt-2 border-top text-end">
                    <button class="btn btn-sm btn-outline-secondary me-2 edit-reservation-btn" data-table-id="${table.id}" data-reservation-id="${reservation.id}">
                        <i class="bi bi-pencil me-1"></i>Edit
                    </button>
                    ${systemNotes && (systemNotes.includes('combined') || systemNotes.includes('Assigned')) ? `
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditTablesModal('${reservation.id}', '${table.id}', '${systemNotes.replace(/'/g, "&apos;")}')">
                            <i class="bi bi-pencil-square me-1"></i>Edit Tables
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelReservation('${table.id}', '${reservation.id}')">
                        <i class="bi bi-trash me-1"></i>Cancel
                    </button>
                </div>
            </div>
        `;
    }

    // Make functions globally available
    window.renderTableColumn = renderTableColumn;
    window.renderTable = renderTable;
    window.renderReservationSummary = renderReservationSummary;
    window.editReservation = editReservation;

    // Initialize the page
    function initialize() {
        try {
            console.log('Initializing tables...');
            
            // Update reservation count first
            window.updateReservationCount();
            
            // Render all table sections
            renderTableSections();
            
            console.log('Tables data after fetch:', tables.map(t => ({
                id: t.id,
                reservations: t.reservations.length
            })));
            
            // Force update of tables with reservations
            tables.forEach((table, index) => {
                const reservationCount = table.reservations.length;
                
                if (reservationCount > 0) {
                    console.log(`Found ${reservationCount} reservations for table ${table.id}, forcing UI update`);
                    // UI is already updated by initialize() above
                }
            });
            
            console.log('All tables updated successfully');
        } catch (error) {
            console.error('Error during table initialization:', error);
        }
    }

    // Make initialize function globally available
    window.initialize = initialize;

    // Start the application
    initialize();

    // Initial fetch and start periodic updates
    // Debug logging for Airtable data
    console.log('Starting initial reservation fetch...');
    setTimeout(() => {
        fetchAndUpdateReservations().then(() => {
            console.log('Initial reservation fetch complete');
            console.log('Tables data after fetch:', tables.map(t => ({
                id: t.id,
                reservations: t.reservations.length
            })));
            
            // Force update of tables with reservations
            tables.forEach((table, index) => {
                const reservationCount = table.reservations.length;
                
                if (reservationCount > 0) {
                    console.log(`Found ${reservationCount} reservations for table ${table.id}, forcing UI update`);
                    // UI is already updated by initialize() above
                }
            });
            
            // Make sure floor plan is updated after fetch
            updateFloorPlanTableStatuses();
            
            // Force update again after a short delay to ensure DOM is ready
            setTimeout(() => {
                console.log('Forcing another floor plan update to ensure indicators are visible');
                updateFloorPlanTableStatuses();
                
                // Force one final UI refresh to ensure everything is in sync
                initialize();
            }, 1000);
        });
    }, 500); // Short delay to ensure DOM is fully loaded
    
    // Start intervals only if not already running
    if (!window.reservationUpdater) {
        window.reservationUpdater = setInterval(fetchAndUpdateReservations, 30000); // Update every 30 seconds
        console.log('Started reservation updater interval (one time only)');
    }
    
    // Add a separate interval to update floor plan indicators frequently
    if (!window.floorPlanUpdater) {
        window.floorPlanUpdater = setInterval(() => {
            console.log('Regular floor plan status update');
            updateFloorPlanTableStatuses();
        }, 5000); // Update every 5 seconds
        console.log('Started floor plan updater interval (one time only)');
    }

    // Render table sections
    function renderTableSections() {
            // Group tables by section
            const groupedTables = {};
            tables.forEach(table => {
                const section = table.id.charAt(0);
                if (!groupedTables[section]) {
                    groupedTables[section] = [];
                }
                groupedTables[section].push(table);
            });
            
            // Define section order explicitly (A should be first)
            const sectionOrder = ['A', 'B', 'C', 'D', 'E', 'L'];
            const sortedSections = sectionOrder.filter(section => groupedTables[section]);
            
            // Section descriptions
            const sectionDescriptions = {
                'A': 'Bar Counter Area',
                'B': 'Main Dining Area',
                'C': 'Central Tables',
                'D': 'Window Side Tables',
                'E': 'Outdoor Patio',
                'L': 'Loft Section'
            };
            
            // Render tables by section
            let html = '';
            sortedSections.forEach(section => {
                html += `
                    <div class="col-12 mb-4" id="section-container-${section}">
                        <h3 class="border-bottom pb-2" id="section-header-${section}">Section ${section} - ${sectionDescriptions[section] || ''}</h3>
                        <div class="row" id="section-tables-${section}">
                            ${groupedTables[section].map(table => renderTableColumn(table)).join('')}
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('tables-container').innerHTML = html;

        // Start date/time updates if not already started
        if (!window.dateTimeUpdater) {
            updateDateTime();
            window.dateTimeUpdater = setInterval(updateDateTime, 1000);
            console.log('Started date/time updater (one time only)');
        }
        
        // Update floor plan table statuses
        updateFloorPlanTableStatuses();
    }

    // Update floor plan table statuses
    window.updateFloorPlanTableStatuses = function() {
        tables.forEach(table => {
            const floorPlanTable = document.querySelector(`[onclick*="'${table.id}'"]`);
            if (floorPlanTable) {
                const indicator = floorPlanTable.querySelector('.table-status-indicator');
                if (indicator) {
                    const reservationCount = table.reservations ? table.reservations.length : 0;
                if (reservationCount > 0) {
                        indicator.innerHTML = `<span class="badge bg-danger">${reservationCount}</span>`;
                    } else {
                        indicator.innerHTML = '';
                    }
                }
            }
        });
    };

    // Add event delegation for make-reservation-btn (only add once)
    if (!window.reservationClickHandlerAdded) {
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.make-reservation-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const tableId = btn.getAttribute('data-table-id');
                console.log('Make reservation button clicked for table:', tableId);
                openMakeReservationModal(tableId, btn);
            }
        });
        window.reservationClickHandlerAdded = true;
        console.log('Added reservation click handler (one time only)');
    }

    // Add table click handler for floor plan tables to open reservation modal
    function handleTableClick(tableId) {
        console.log('Floor plan table clicked:', tableId);
        // Find the clicked table element for positioning
        const tableElement = document.querySelector(`[onclick*="'${tableId}'"]`);
        openMakeReservationModal(tableId, tableElement);
    }

    // Make table click handler globally available
    window.handleTableClick = handleTableClick;
    
    // Function to position modal relative to a clicked element
    function positionModalRelativeToElement(modal, clickedElement) {
        console.log('Positioning modal relative to element:', clickedElement);
        
        // Find the table card container to position relative to
        // Try multiple selectors to find the table card
        let tableCard = clickedElement.closest('.card');
        if (!tableCard) {
            // Try finding by data-table-id in case the button is outside the card
            const tableId = clickedElement.getAttribute('data-table-id');
            if (tableId) {
                // Look for the table section by ID
                const tableSection = document.querySelector(`[data-table="${tableId}"]`) || 
                                   document.querySelector(`[id*="${tableId}"]`) ||
                                   document.querySelector(`.table-card-${tableId}`);
                if (tableSection) {
                    tableCard = tableSection.closest('.card') || tableSection;
                }
            }
        }
        
        if (!tableCard) {
            console.warn('Could not find table card for positioning, using clicked element');
            tableCard = clickedElement.closest('.col') || clickedElement.parentElement;
        }
        
        const rect = tableCard.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = 420; // Slightly wider for better form spacing
        const modalHeight = Math.min(700, viewportHeight * 0.9);
        
        let left, top;
        
        console.log('Table card rect:', rect, 'Viewport:', { width: viewportWidth, height: viewportHeight });
        
        // Determine if modal should appear on the right or left of the table
        if (rect.right + modalWidth + 20 <= viewportWidth) {
            // Position to the right of table
            left = rect.right + 20;
            console.log('Positioning to the right of table');
        } else if (rect.left - modalWidth - 20 >= 0) {
            // Position to the left of table
            left = rect.left - modalWidth - 20;
            console.log('Positioning to the left of table');
        } else {
            // Center in viewport if no space on either side
            left = Math.max(10, (viewportWidth - modalWidth) / 2);
            console.log('Centering in viewport');
        }
        
        // Position vertically aligned with the table, but ensure it stays in viewport
        top = Math.max(10, Math.min(rect.top, viewportHeight - modalHeight - 10));
        
        // Account for scroll position
        top += window.scrollY;
        left += window.scrollX;
        
        console.log('Final calculated modal position:', { left, top, rect, scrollY: window.scrollY, scrollX: window.scrollX });
        
        // Apply positioning to modal dialog
        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.left = left + 'px';
            modalDialog.style.top = top + 'px';
            modalDialog.style.width = modalWidth + 'px';
            console.log('Applied positioning to modal dialog');
        }
    }
    
    // Add event delegation for edit buttons
    if (!window.editReservationClickHandlerAdded) {
        document.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-reservation-btn');
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                // Store current scroll position to prevent any scrolling
                const currentScrollY = window.scrollY;
                const currentScrollX = window.scrollX;
                
                const tableId = editBtn.getAttribute('data-table-id');
                const reservationId = editBtn.getAttribute('data-reservation-id');
                console.log('Edit reservation button clicked:', { tableId, reservationId });
                
                // Open edit modal
                editReservation(tableId, reservationId, editBtn);
                
                // Force restore scroll position immediately and with multiple attempts
                window.scrollTo(currentScrollX, currentScrollY);
                
                // Additional scroll position restoration with slight delays
                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScrollY);
                }, 10);
                
                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScrollY);
                }, 50);
                
                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScrollY);
                }, 100);
            }
        });
        window.editReservationClickHandlerAdded = true;
        console.log('Added edit reservation click handler');
    }
    
    // Add click outside to close modal handler
    document.addEventListener('click', function(e) {
        const editModal = document.getElementById('editReservationModal');
        if (editModal && editModal.classList.contains('show')) {
            const modalContent = editModal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target) && !e.target.closest('.edit-reservation-btn')) {
                const modal = bootstrap.Modal.getInstance(editModal);
                if (modal) {
                    modal.hide();
                    // Restore body scroll when modal closes
                    document.body.style.overflow = 'auto';
                }
            }
        }
    });

    // Function to open the edit reservation modal
    function editReservation(tableId, reservationId, clickedElement = null) {
        console.log('Opening edit modal for reservation:', { tableId, reservationId, clickedElement });
        
        // Find the reservation data
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
        
        console.log('Found reservation for editing:', reservation);
        
        // Populate the table dropdown
        const editTableSelect = document.getElementById('editTableId');
        if (editTableSelect) {
            editTableSelect.innerHTML = '';
            tables.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = `${t.name} (${t.type} - ${t.capacity} pax)`;
                if (t.id === tableId) {
                    option.selected = true;
                }
                editTableSelect.appendChild(option);
            });
        }
        
        // Set table information in modal
        const editSelectedTableInfo = document.getElementById('editSelectedTableInfo');
        const editSelectedTableDetails = document.getElementById('editSelectedTableDetails');
        
        if (editSelectedTableInfo) {
            editSelectedTableInfo.textContent = `Currently: Table ${table.name}`;
        }
        
        if (editSelectedTableDetails) {
            editSelectedTableDetails.textContent = `${table.type} - Capacity: ${table.capacity} pax`;
        }
        
        // Parse the reservation time
        const reservationTime = new Date(reservation.startTime);
        const timeString = reservationTime.toTimeString().slice(0, 5);
        const dateString = reservationTime.toISOString().slice(0, 10); // YYYY-MM-DD format
        
        // Map reservation type from Airtable format
        let mappedReservationType = 'walk-in';
        if (reservation.reservationType) {
            switch(reservation.reservationType.toLowerCase()) {
                case 'voice agent':
                case 'phone call':
                    mappedReservationType = 'phone-call';
                    break;
                case 'calendly':
                    mappedReservationType = 'calendly';
                    break;
                default:
                    mappedReservationType = 'walk-in';
            }
        }
        
        // Populate form fields with current reservation data
        document.getElementById('editReservationId').value = reservationId;
        document.getElementById('editOriginalTableId').value = tableId;
        document.getElementById('editReservationSource').value = mappedReservationType;
        document.getElementById('editReservationStatus').value = reservation.status || 'reserved';
        document.getElementById('editNumberOfGuests').value = reservation.pax || '';
        document.getElementById('editReservationDate').value = dateString;
        document.getElementById('editArrivalTime').value = timeString;
        document.getElementById('editDuration').value = reservation.duration || '60';
        document.getElementById('editCustomerName').value = reservation.customerName || '';
        document.getElementById('editPhoneNumber').value = reservation.phoneNumber || '';
        document.getElementById('editCustomerNotes').value = reservation.customerNotes || '';
        
        // Calculate modal position relative to clicked element
        const modalElement = document.getElementById('editReservationModal');
        
        if (modalElement) {
            // Calculate position based on clicked element
            if (clickedElement) {
                positionModalRelativeToElement(modalElement, clickedElement);
            }
            
            // Clear any existing modal instances
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
                existingModal.dispose();
            }
            
            // Create new modal instance configured without backdrop and focus
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: false,
                keyboard: true,
                focus: false  // Prevent auto-focus to avoid scrolling
            });
            
            // Show the modal
            modal.show();
            
            // Enhanced focus management for side panel - prevent auto-focus to avoid scrolling
            modalElement.addEventListener('shown.bs.modal', function() {
                // Intentionally do NOT focus any elements to prevent unwanted scrolling
                // The modal is positioned beside the table and focus would cause page to jump
                console.log('Modal shown - not focusing any elements to prevent scrolling');
            }, { once: true });
            
            // Restore body scroll when modal is hidden
            modalElement.addEventListener('hidden.bs.modal', function() {
                document.body.style.overflow = 'auto';
                console.log('Modal hidden - restored body scroll');
            }, { once: true });
        }
        
        // Set up form submission handler
        const confirmButton = document.getElementById('confirmEditReservation');
        if (confirmButton) {
            // Remove existing event listeners
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            // Add new event listener
            const finalConfirmButton = document.getElementById('confirmEditReservation');
            finalConfirmButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Disable button and show loading
                finalConfirmButton.disabled = true;
                finalConfirmButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
                
                try {
                    await handleEditReservationSubmit();
                } catch (error) {
                    console.error('Error updating reservation:', error);
                    alert('Failed to update reservation: ' + error.message);
                } finally {
                    // Re-enable button
                    finalConfirmButton.disabled = false;
                    finalConfirmButton.innerHTML = 'Update Reservation';
                }
            });
        }
    }
    
    // Function to handle edit reservation form submission
    async function handleEditReservationSubmit() {
        console.log('Handling edit reservation submission...');
        
        // Get form data
        const formData = {
            reservationId: document.getElementById('editReservationId').value,
            originalTableId: document.getElementById('editOriginalTableId').value,
            tableId: document.getElementById('editTableId').value,
            source: document.getElementById('editReservationSource').value,
            status: document.getElementById('editReservationStatus').value,
            numberOfGuests: document.getElementById('editNumberOfGuests').value,
            reservationDate: document.getElementById('editReservationDate').value,
            arrivalTime: document.getElementById('editArrivalTime').value,
            duration: document.getElementById('editDuration').value,
            customerName: document.getElementById('editCustomerName').value,
            phoneNumber: document.getElementById('editPhoneNumber').value,
            customerNotes: document.getElementById('editCustomerNotes').value
        };
        
        console.log('Edit form data:', formData);
        
        // Validate required fields
        if (!formData.reservationId || !formData.tableId || !formData.source || 
            !formData.status || !formData.numberOfGuests || !formData.reservationDate || !formData.arrivalTime || !formData.duration) {
            throw new Error('Please fill in all required fields');
        }
        
        // Create date object from reservation date and arrival time
        const [hours, minutes] = formData.arrivalTime.split(':');
        const reservationDate = new Date(formData.reservationDate);
        const arrivalDateTime = new Date(reservationDate.getFullYear(), reservationDate.getMonth(), reservationDate.getDate(), parseInt(hours), parseInt(minutes));
        
        // Prepare update data
        const updateData = {
            tableId: formData.tableId,
            dateTime: arrivalDateTime,
            status: formData.status,
            reservationType: formData.source,
            customerName: formData.customerName,
            phoneNumber: formData.phoneNumber,
            pax: parseInt(formData.numberOfGuests),
            duration: parseInt(formData.duration),
            customerNotes: formData.customerNotes,
            systemNotes: `Duration: ${formData.duration} minutes. Updated via floor plan.`
        };
        
        console.log('Updating reservation with data:', updateData);
        
        // Update the reservation in Airtable
        await window.airtableService.updateReservation(formData.reservationId, updateData);
        
        console.log('Successfully updated reservation in Airtable');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editReservationModal'));
        modal.hide();
        
        // Restore body scroll immediately when modal is closed programmatically
        document.body.style.overflow = 'auto';
        
        // Show success message
        showSuccessMessage('Reservation updated successfully!');
        
        // Update the UI
        setTimeout(async () => {
            await fetchAndUpdateReservations();
            updateFloorPlanTableStatuses();
            updateReservationCount();
        }, 500);
    }
    
    // Make edit function globally available
    window.editReservation = editReservation;

    // Function to open the make reservation modal
    function openMakeReservationModal(tableId, clickedElement = null) {
        const table = tables.find(t => t.id === tableId);
        if (!table) {
            console.error('Table not found:', tableId);
            return;
        }

        // Set table information in modal
        const selectedTableIdInput = document.getElementById('selectedTableId');
        const selectedTableInfo = document.getElementById('selectedTableInfo');
        const selectedTableDetails = document.getElementById('selectedTableDetails');
        
        if (selectedTableIdInput) {
            selectedTableIdInput.value = tableId;
            console.log('✅ Set selected table ID:', tableId);
        } else {
            console.error('❌ selectedTableId input not found');
        }
        
        if (selectedTableInfo) {
            selectedTableInfo.textContent = `Table ${table.name}`;
            console.log('✅ Set table info header');
        }
        
        if (selectedTableDetails) {
            selectedTableDetails.textContent = `${table.type} - Capacity: ${table.capacity} pax`;
            console.log('✅ Set table details');
        }

        // Set default arrival time to current time rounded to nearest 30 minutes
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 30) * 30;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        now.setMilliseconds(0);
        
        const arrivalTimeInput = document.getElementById('arrivalTime');
        if (arrivalTimeInput) {
            arrivalTimeInput.value = now.toTimeString().slice(0, 5);
            console.log('✅ Set default arrival time:', arrivalTimeInput.value);
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
        modal.show();
        console.log('✅ Showed reservation modal');

        // Set up form submission handler
        const confirmButton = document.getElementById('confirmReservation');

        // Remove any existing event listeners on the button
        if (confirmButton) {
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            console.log('✅ Cleaned up old button event listeners');

            // Set up the click handler
            const finalConfirmButton = document.getElementById('confirmReservation');
            finalConfirmButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 Confirm button clicked');

                // Disable the button to prevent double submission
                finalConfirmButton.disabled = true;
                finalConfirmButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

                try {
                    // Get the form data directly from the form elements
                    const formData = {
                        tableId: document.getElementById('selectedTableId').value,
                        source: document.getElementById('reservationSource').value,
                        status: document.getElementById('reservationStatus').value,
                        numberOfGuests: document.getElementById('numberOfGuests').value,
                        arrivalTime: document.getElementById('arrivalTime').value,
                        duration: document.getElementById('duration').value,
                        customerName: document.getElementById('customerName').value,
                        phoneNumber: document.getElementById('phoneNumber').value,
                        customerNotes: document.getElementById('customerNotes').value
                    };

                    console.log('📝 Form data collected:', formData);

                    // Validate required fields
                    if (!formData.tableId || !formData.source || !formData.status || 
                        !formData.numberOfGuests || !formData.arrivalTime || !formData.duration) {
                        throw new Error('Please fill in all required fields');
                    }

                    // Use the Airtable service directly instead of saveReservation
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
                            systemNotes: `Duration: ${formData.duration} minutes. Created via floor plan.`,
                            status: formData.status,
                            duration: parseInt(formData.duration)
                        }
                    );

                    console.log('✅ Reservation saved successfully:', airtableReservation);

                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
                    modal.hide();

                    // Show success message
                    showSuccessMessage('Reservation created successfully!');

                    // Update the UI
                    setTimeout(async () => {
                        await fetchAndUpdateReservations();
                        updateFloorPlanTableStatuses();
                        updateReservationCount();
                    }, 500);

                } catch (error) {
                    console.error('❌ Error saving reservation:', error);
                    alert('Failed to save reservation: ' + error.message);
                } finally {
                    // Re-enable the button
                    finalConfirmButton.disabled = false;
                    finalConfirmButton.innerHTML = 'Confirm Reservation';
                }
            });
            console.log('✅ Added click handler to confirm button');
        }
    }

    // Function to close modal (now handled by Bootstrap, but keeping for compatibility)
    function closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Prevent form submission to avoid page refresh
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🚫 Form submission prevented - using button click handler instead');
            return false;
        });
    }

    // Debug function to check system readiness
    function checkSystemReadiness() {
        const checks = {
            airtableService: !!window.airtableService,
            formExists: !!document.getElementById('reservationForm'),
            confirmButton: !!document.getElementById('confirmReservation'),
            selectedTableId: !!document.getElementById('selectedTableId'),
            sourceSelect: !!document.getElementById('reservationSource'),
            statusSelect: !!document.getElementById('reservationStatus')
        };
        
        console.log('🔍 System readiness check:', checks);
        
        const allReady = Object.values(checks).every(check => check);
        if (!allReady) {
            console.error('❌ System not ready:', checks);
            return false;
        }
        
        console.log('✅ All systems ready');
        return true;
    }

    // handleReservationSubmit function removed - using direct button click handler instead

    // Helper function to show success message
    function showSuccessMessage(message) {
        // Create or update success alert
        let alertContainer = document.getElementById('success-alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'success-alert-container';
            alertContainer.className = 'position-fixed top-0 start-50 translate-middle-x mt-3';
            alertContainer.style.zIndex = '9999';
            document.body.appendChild(alertContainer);
        }

        alertContainer.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }

    // Make helper functions globally available
    window.showSuccessMessage = showSuccessMessage;

    // Function to update reservation status
    async function updateReservationStatus(tableId, reservationId, newStatus) {
        try {
            if (!window.airtableService) {
                throw new Error('Airtable service not available');
            }

            // Update the reservation status in Airtable
            await window.airtableService.updateReservationStatus(reservationId, newStatus);

            // Update local state
            const table = tables.find(t => t.id === tableId);
            if (table) {
                const reservation = table.reservations.find(r => r.id === reservationId);
                if (reservation) {
                    reservation.status = newStatus;
                }
            }

            // Refresh the UI
            initialize();
            updateFloorPlanTableStatuses();

            // Show success message
            showSuccessMessage(`Reservation status updated to ${newStatus}`);

            console.log(`Updated reservation ${reservationId} status to ${newStatus}`);
        } catch (error) {
            console.error('Error updating reservation status:', error);
            alert('Failed to update reservation status. Please try again.');
        }
    }

    // Make the function globally available
    window.updateReservationStatus = updateReservationStatus;

    // Function to cancel reservation
    async function cancelReservation(tableId, reservationId) {
        if (!confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }

        try {
            if (!window.airtableService) {
                throw new Error('Airtable service not available');
            }

            // Delete the reservation from Airtable
            await window.airtableService.deleteReservation(reservationId);

            // Update local state
            const table = tables.find(t => t.id === tableId);
            if (table) {
                table.reservations = table.reservations.filter(r => r.id !== reservationId);
            }

            // Refresh the UI
            initialize();
            updateFloorPlanTableStatuses();

            showSuccessMessage('Reservation cancelled successfully');
            console.log(`Cancelled reservation ${reservationId} for table ${tableId}`);
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            alert('Failed to cancel reservation. Please try again.');
        }
    }

    // Make the function globally available
    window.cancelReservation = cancelReservation;

    // Add QR code button click handler
    if (!window.qrCodeClickHandlerAdded) {
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.qr-code-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const tableId = btn.getAttribute('data-table-id');
                console.log('QR code button clicked for table:', tableId);
                showCustomQRCode(tableId, btn);
            }
        });
        window.qrCodeClickHandlerAdded = true;
        console.log('Added QR code click handler (one time only)');
    }

    // Custom QR code display function that appears at the button location
    function showCustomQRCode(tableId, buttonElement) {
        // Get table information
        const table = tables.find(t => t.id === tableId);
        if (!table) {
            console.error('Table not found:', tableId);
            return;
        }
        
        // Remove any existing QR popup
        const existingPopup = document.getElementById('custom-qr-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup container
        const popup = document.createElement('div');
        popup.id = 'custom-qr-popup';
        popup.className = 'custom-qr-popup';
        
        // Get button position
        const buttonRect = buttonElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Create popup content
        popup.innerHTML = `
            <div class="qr-popup-header">
                <h5>QR Code for Table ${tableId}</h5>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="qr-popup-body">
                <div class="alert alert-info mb-3">
                    <strong>Table ${tableId}</strong><br>
                    <small>${table.type || 'Regular table'} - ${table.capacity} pax capacity</small>
                </div>
                <canvas id="custom-qrcode-canvas" width="200" height="200" class="mx-auto d-block border p-2"></canvas>
                <div class="mt-3 text-center">
                    <small class="text-muted" id="custom-qr-info"></small>
                </div>
            </div>
            <div class="qr-popup-footer">
                <a id="custom-download-link" class="btn btn-primary btn-sm me-2" style="display: none;">
                    <i class="bi bi-download me-1"></i>Download QR Code
                </a>
                <button type="button" class="btn btn-success btn-sm me-2" id="print-qr-btn">
                    <i class="bi bi-printer me-1"></i>Print QR Code
                </button>
                <button type="button" class="btn btn-secondary btn-sm close-btn">Close</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(popup);
        
        // Position popup
        const popupWidth = 300; // Fixed width for popup
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate position (try to center on button)
        let leftPos = buttonRect.left + scrollX + (buttonRect.width / 2) - (popupWidth / 2);
        let topPos = buttonRect.bottom + scrollY + 10; // 10px below button
        
        // Make sure it doesn't go off screen horizontally
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > windowWidth - 10) leftPos = windowWidth - popupWidth - 10;
        
        // If it would go off screen vertically, position it above the button instead
        if (topPos + 400 > window.scrollY + windowHeight) { // 400px is approximate height
            topPos = buttonRect.top + scrollY - 410; // Position above button
            if (topPos < window.scrollY + 10) {
                // If there's not enough space above either, just position it at current scroll position
                topPos = window.scrollY + 10;
            }
        }
        
        // Apply position
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`;
        
        // Generate QR code - using the canvas in our custom popup
        const BOT_USERNAME = "Angel_TUR_Waitress_Bot";
        const TABLE_NUMBER = tableId;

        // Create SG-time version of timestamp
        const sgOffset = 8 * 60 * 60 * 1000;
        const now = new Date(Date.now() + sgOffset); // Add 8 hours to UTC
        const pad = (n) => String(n).padStart(2, '0');

        const year = now.getUTCFullYear();
        const month = pad(now.getUTCMonth() + 1);
        const day = pad(now.getUTCDate());
        const hour = pad(now.getUTCHours());
        const minute = pad(now.getUTCMinutes());
        const second = pad(now.getUTCSeconds());

        const timestamp_str = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
        const payload = `table${TABLE_NUMBER}_${timestamp_str}`;
        const deep_link_url = `https://t.me/${BOT_USERNAME}?start=${payload}`;
        const filename = `qr_table${TABLE_NUMBER}_${timestamp_str}.png`;

        // Generate QR code on our custom canvas
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.getElementById('custom-qrcode-canvas'), deep_link_url, function(error) {
                if (error) {
                    console.error('QR code generation error:', error);
                    // Show error message in popup
                    const errorAlert = document.createElement('div');
                    errorAlert.className = 'alert alert-danger mt-2';
                    errorAlert.innerHTML = `
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Failed to generate QR code: ${error.message}
                    `;
                    popup.querySelector('.qr-popup-body').appendChild(errorAlert);
                } else {
                    console.log(`✅ QR code displayed on canvas`);
                    console.log(`🔗 Deep link: ${deep_link_url}`);
                }
            });
        } else {
            console.error('QRCode library not loaded');
            // Show error message in popup
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger mt-2';
            errorAlert.innerHTML = `
                <i class="bi bi-exclamation-triangle me-1"></i>
                QR Code library not loaded. Please refresh the page.
            `;
            popup.querySelector('.qr-popup-body').appendChild(errorAlert);
        }

        // Set up download link
        const downloadLink = document.getElementById('custom-download-link');
        if (downloadLink && typeof QRCode !== 'undefined') {
            QRCode.toDataURL(deep_link_url, function(err, url) {
                if (err) {
                    console.error('Failed to generate download link:', err);
                    downloadLink.style.display = 'none';
                } else {
                    downloadLink.href = url;
                    downloadLink.download = filename;
                    downloadLink.style.display = 'block';
                }

                // Set up print button
                const printBtn = document.getElementById('print-qr-btn');
                if (printBtn) {
                    printBtn.addEventListener('click', async () => {
                        try {
                            printBtn.disabled = true;
                            printBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Printing...';
                            
                            await window.starPrinter.printQRCode(tableId, url);
                            
                            // For iOS, we don't need to show success message immediately
                            // as the app will handle the printing
                            if (!window.starPrinter.isIOS) {
                                printBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Printed!';
                                setTimeout(() => {
                                    printBtn.innerHTML = '<i class="bi bi-printer me-1"></i>Print QR Code';
                                    printBtn.disabled = false;
                                }, 2000);
                            }
                        } catch (error) {
                            console.error('Failed to print:', error);
                            printBtn.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>Print Failed';
                            printBtn.disabled = false;
                            
                            // Show error message
                            const errorAlert = document.createElement('div');
                            errorAlert.className = 'alert alert-danger mt-2';
                            errorAlert.innerHTML = `
                                <i class="bi bi-exclamation-triangle me-1"></i>
                                ${error.message || 'Failed to print QR code. Please check if Star PassPRNT app is installed.'}
                            `;
                            popup.querySelector('.qr-popup-body').appendChild(errorAlert);
                            
                            setTimeout(() => {
                                errorAlert.remove();
                            }, 5000);
                        }
                    });
                }
            });
        }
        
        // Format current time for display - using Singapore time zone
        const formattedTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Singapore'
        });
        
        // Display table and time
        document.getElementById('custom-qr-info').textContent = `Table: ${tableId}, Time: ${formattedTime}`;
        
        // Add event listeners for close buttons
        popup.querySelector('.btn-close').addEventListener('click', () => popup.remove());
        popup.querySelector('.close-btn').addEventListener('click', () => popup.remove());
        
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target) && !buttonElement.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
        
        // Add CSS if not already added
        if (!document.getElementById('custom-qr-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-qr-popup-styles';
            style.textContent = `
                .custom-qr-popup {
                    position: absolute;
                    z-index: 9999;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                    width: 300px;
                    max-width: 95vw;
                    overflow: hidden;
                }
                .qr-popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid #dee2e6;
                    background-color: #f8f9fa;
                }
                .qr-popup-header h5 {
                    margin: 0;
                    font-size: 1rem;
                }
                .qr-popup-body {
                    padding: 15px;
                }
                .qr-popup-footer {
                    padding: 10px 15px;
                    border-top: 1px solid #dee2e6;
                    text-align: right;
                    background-color: #f8f9fa;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Make function globally available
    window.showCustomQRCode = showCustomQRCode;

    // Make functions globally available
    window.openMakeReservationModal = openMakeReservationModal;
    window.closeModal = closeModal;
}); 
