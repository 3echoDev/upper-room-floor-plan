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
        { id: "B4", name: "B4", capacity: 2, type: "table" },
        { id: "B5", name: "B5", capacity: 2, type: "table" },
        { id: "B6", name: "B6", capacity: 2, type: "table" },
        { id: "C1", name: "C1", capacity: 4, type: "table" },
        { id: "C2", name: "C2", capacity: 2, type: "table" },
        { id: "C3", name: "C3", capacity: 4, type: "table" },
        { id: "C4", name: "C4", capacity: 2, type: "table" },
        { id: "C5", name: "C5", capacity: 2, type: "table" },
        { id: "D1", name: "D1", capacity: 6, type: "table" },
        { id: "D2", name: "D2", capacity: 6, type: "table" },
        { id: "D3", name: "D3", capacity: 6, type: "table" },
        { id: "E1", name: "E1", capacity: 6, type: "outdoor seating" },
        { id: "E2", name: "E2", capacity: 6, type: "outdoor seating" }
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
                case 'phone-call': return { icon: 'bi-telephone', label: 'Phone Call' };
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
                        <strong class="text-${statusColor}">Guest:</strong> ${reservation.customerName || (source === 'calendly' ? 'Calendly Booking' : 'Walk-in Customer')}
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
                
                <!-- Cancel Button -->
                <div class="mt-2 pt-2 border-top text-end">
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
            const sectionOrder = ['A', 'B', 'C', 'D', 'E'];
            const sortedSections = sectionOrder.filter(section => groupedTables[section]);
            
            // Section descriptions
            const sectionDescriptions = {
                'A': 'Bar Counter Area',
                'B': 'Main Dining Area',
                'C': 'Central Tables',
                'D': 'Window Side Tables',
                'E': 'Outdoor Patio'
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

    // Function to open the make reservation modal
    function openMakeReservationModal(tableId, clickedElement = null) {
        const table = tables.find(t => t.id === tableId);
        if (!table) {
            console.error('Table not found:', tableId);
            return;
        }

        // Store current scroll position and prevent body scrolling
        const currentScrollY = window.scrollY;
        const currentScrollX = window.scrollX;
        
        // Prevent any scrolling during modal operations
        document.body.style.position = 'fixed';
        document.body.style.top = `-${currentScrollY}px`;
        document.body.style.left = `-${currentScrollX}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Set table information in modal
        document.getElementById('selectedTableId').value = tableId;
        document.getElementById('selectedTableInfo').textContent = `${tableId} - ${table.type}`;
        document.getElementById('selectedTableDetails').textContent = `Capacity: ${table.capacity} guests`;

        // Reset form to clear any previous data
        const form = document.getElementById('reservationForm');
        if (form) {
            form.reset();
        }

        // Set current time as default arrival time
        const now = new Date();
        const timeString = now.toTimeString().slice(0, 5); // HH:MM format
        const arrivalTimeInput = document.getElementById('arrivalTime');
        if (arrivalTimeInput) {
            arrivalTimeInput.value = timeString;
        }

        // Set default number of guests to table capacity (but don't exceed dropdown options)
        const numberOfGuestsSelect = document.getElementById('numberOfGuests');
        if (numberOfGuestsSelect) {
            const maxOption = Math.min(table.capacity, 6); // Cap at 6 since that's our highest option
            numberOfGuestsSelect.value = maxOption.toString();
        }

        // Reset other optional fields
        const customerNameInput = document.getElementById('customerName');
        const phoneNumberInput = document.getElementById('phoneNumber');
        const notesInput = document.getElementById('customerNotes');
        
        if (customerNameInput) customerNameInput.value = '';
        if (phoneNumberInput) phoneNumberInput.value = '';
        if (notesInput) notesInput.value = '';

        // Set up duration help text based on time
        const updateDurationHelp = () => {
            const time = arrivalTimeInput.value;
            const durationRule = document.getElementById('durationRule');
            if (time && durationRule) {
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
        };
        
        if (arrivalTimeInput) {
            arrivalTimeInput.addEventListener('change', updateDurationHelp);
            updateDurationHelp(); // Set initial help text
        }

        // Function to restore scroll position
        const restoreScrollPosition = () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(currentScrollX, currentScrollY);
        };

        // Show Bootstrap modal with focus prevention
        const modalElement = document.getElementById('reservationModal');
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: false  // Prevent auto-focus which can cause scrolling
        });
        
        modal.show();
        
        // Handle modal events
        modalElement.addEventListener('shown.bs.modal', function () {
            // Focus on the first input without causing scroll
            setTimeout(() => {
                const firstSelect = document.getElementById('reservationSource');
                if (firstSelect) {
                    firstSelect.focus({ preventScroll: true });
                }
            }, 100);
        }, { once: true });
        
        // Restore scroll position when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', function () {
            restoreScrollPosition();
        }, { once: true });
        
        console.log('Make reservation modal opened for table:', tableId);
    }

    // Function to close modal (now handled by Bootstrap, but keeping for compatibility)
    function closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Handle reservation confirmation (only add once)
    if (!window.confirmationHandlerAdded) {
        document.getElementById('confirmReservation').addEventListener('click', async function() {
            const form = document.getElementById('reservationForm');
            
            // Get form values
            const tableId = document.getElementById('selectedTableId').value;
            const source = document.getElementById('reservationSource').value;
            const status = document.getElementById('reservationStatus').value;
            const numberOfGuests = document.getElementById('numberOfGuests').value;
            const arrivalTime = document.getElementById('arrivalTime').value;
            const duration = document.getElementById('duration').value;
            const customerName = document.getElementById('customerName').value.trim();
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const notes = document.getElementById('customerNotes').value.trim();

            // Validate required fields
            if (!tableId || !source || !status || !numberOfGuests || !arrivalTime || !duration) {
                // Highlight missing fields
                const requiredFields = [
                    { id: 'reservationSource', value: source },
                    { id: 'reservationStatus', value: status },
                    { id: 'numberOfGuests', value: numberOfGuests },
                    { id: 'arrivalTime', value: arrivalTime },
                    { id: 'duration', value: duration }
                ];

                requiredFields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (!field.value) {
                        element.classList.add('is-invalid');
                    } else {
                        element.classList.remove('is-invalid');
                    }
                });

                // Show validation message
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Please fill in all required fields (marked with red border).
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                
                // Remove any existing alert
                const existingAlert = form.querySelector('.alert-danger');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                form.appendChild(alertDiv);
                
                // Auto-remove validation message after 5 seconds
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 5000);

                return;
            }

            // Remove validation classes
            const allFormControls = form.querySelectorAll('.form-control, .form-select');
            allFormControls.forEach(control => {
                control.classList.remove('is-invalid');
            });

            // Show loading state
            const confirmButton = this;
            const originalText = confirmButton.innerHTML;
            confirmButton.disabled = true;
            confirmButton.innerHTML = '<span class="spinner"></span>Creating...';

            try {
                // Create date time from arrival time
                const today = new Date();
                const [hours, minutes] = arrivalTime.split(':');
                const arrivalDateTime = new Date(today);
                arrivalDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                // Create reservation object
                const reservationData = {
                    tableId: tableId,
                    source: source,
                    status: status,
                    pax: parseInt(numberOfGuests),
                    arrivalTime: arrivalDateTime.toISOString(),
                    duration: parseInt(duration),
                    customerName: customerName || null,
                    phoneNumber: phoneNumber || null,
                    notes: notes || null
                };

                // Debug log for pax value
                console.log('Creating reservation with pax:', reservationData.pax);

                // Create the reservation
                const airtableReservation = await window.airtableService.createWalkInReservation(
                    reservationData.tableId,
                    arrivalDateTime,
                    reservationData.source,
                    {
                        customerName: reservationData.customerName,
                        phoneNumber: reservationData.phoneNumber,
                        pax: reservationData.pax,
                        customerNotes: reservationData.notes,
                        systemNotes: `Duration: ${reservationData.duration} minutes. Created via manual reservation.`,
                        status: reservationData.status,
                        duration: reservationData.duration
                    }
                );

                // Hide the Bootstrap modal (this will trigger the hidden.bs.modal event and restore scroll)
                const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
                if (modal) {
                    modal.hide();
                }

                // Reset the form
                form.reset();

                // Show success message with more details
                const guestText = reservationData.pax === 1 ? 'guest' : 'guests';
                const customerText = customerName ? ` for ${customerName}` : '';
                const timeText = arrivalDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const successMessage = `Reservation created for Table ${tableId}${customerText} - ${reservationData.pax} ${guestText} at ${timeText}`;
                showSuccessMessage(successMessage);

                // Refresh the UI
                initialize();
                fetchAndUpdateReservations();
                updateFloorPlanTableStatuses();

            } catch (error) {
                console.error('Error creating reservation:', error);
                
                // Show error message
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to create reservation. Please check your connection and try again.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                
                // Remove any existing alert
                const existingAlert = form.querySelector('.alert-danger');
                if (existingAlert) {
                    existingAlert.remove();
                }
                
                form.appendChild(alertDiv);
            } finally {
                // Reset button state
                confirmButton.disabled = false;
                confirmButton.innerHTML = originalText;
            }
        });
        window.confirmationHandlerAdded = true;
        console.log('Added reservation confirmation handler (one time only)');
    }

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
                showQRCodeModal(tableId);
            }
        });
        window.qrCodeClickHandlerAdded = true;
        console.log('Added QR code click handler (one time only)');
    }

    // Function to show QR code modal
    function showQRCodeModal(tableId) {
        // Get table information
        const table = tables.find(t => t.id === tableId);
        if (!table) {
            console.error('Table not found:', tableId);
            return;
        }
        
        // Update modal title and table info
        document.getElementById('qrCodeModalLabel').textContent = `QR Code for Table ${tableId}`;
        document.getElementById('qrTableInfo').innerHTML = `
            <div class="alert alert-info">
                <strong>Table ${tableId}</strong><br>
                <small>${table.type || 'Regular table'} - ${table.capacity} pax capacity</small>
            </div>
        `;
        
        // Generate QR code
        const result = generateQRCode("TeleMenuTestBot", tableId);
        
        // Format current time
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Display table and time instead of deep link
        document.getElementById('qrDeepLink').textContent = `Table: ${tableId}, Time: ${formattedTime}`;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
        modal.show();
    }

    // Make function globally available
    window.showQRCodeModal = showQRCodeModal;

    // Make functions globally available
    window.openMakeReservationModal = openMakeReservationModal;
    window.closeModal = closeModal;
}); 
