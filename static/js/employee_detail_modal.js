// static/js/employee_detail_modal.js

document.addEventListener('DOMContentLoaded', () => {
    const detailModal = document.getElementById('employeeDetailModal');
    const detailModalContent = document.getElementById('modalDetailContent');
    const modalError = document.getElementById('modalError');
    const closeDetailModalButton = document.getElementById('closeDetailModal');
    const modalEditButton = document.getElementById('modalEditButton'); // Button INSIDE modal
    const modalSaveButton = document.getElementById('modalSaveButton');
    const modalCancelButton = document.getElementById('modalCancelButton');

    // --- Get references to the Alert Modal elements ---
    const customAlertOverlay = document.getElementById('customAlertOverlay');
    const successAlertBox = document.getElementById('customSuccessAlert');
    const errorAlertBox = document.getElementById('customErrorAlert');
    const successAlertText = document.getElementById('customSuccessAlertText');
    const errorAlertText = document.getElementById('customErrorAlertText');
    let alertTimeout = null; // Variable to hold the auto-hide timeout ID

    // --- Confirmation Modal Elements ---
    const confirmOverlay = document.getElementById('customConfirmOverlay');
    const confirmBox = document.getElementById('customConfirmBox');
    const confirmTextElement = document.getElementById('customConfirmText');
    const confirmBtnYes = document.getElementById('confirmBtnYes');
    const confirmBtnNo = document.getElementById('confirmBtnNo');

    let isEditMode = false;
    let currentUuid = null;
    let currentEmployeeData = null; // Store fetched data

    // --- Function to open the modal ---
    function openModal() {
        if (detailModal) {
            // Use classList for better visibility control if you have CSS animations/transitions
            detailModal.style.display = 'block'; // Or use classList.add('is-visible')
        }
    }

    // --- Update Table Row ---
    function updateTableRow(uuid, updatedData) {
        const tableRow = document.querySelector(`tr[data-employee-uuid="${uuid}"]`);
        if (!tableRow) {
            console.warn(`Could not find table row with UUID: ${uuid} to update.`);
            return;
        }

        // Iterate through the updated data fields returned from the server
        for (const fieldName in updatedData) {
            if (updatedData.hasOwnProperty(fieldName)) {
                // Find the corresponding cell in the row using data-field
                const cell = tableRow.querySelector(`td[data-field="${fieldName}"]`);
                if (cell) {
                    let displayValue = (updatedData[fieldName] !== null && updatedData[fieldName] !== undefined)
                        ? updatedData[fieldName]
                        : 'N/A'; // Default display for null/undefined

                    cell.textContent = displayValue;
                }
            }
        }
    }

    let confirmCallback = null; // Store the action to run if user confirms

    function showConfirm(message, callback) {
        if (!confirmBox || !confirmOverlay || !confirmTextElement) return; // Safety check

        confirmTextElement.textContent = message; // Set the confirmation message
        confirmCallback = callback; // Store the function to call on 'Yes'

        confirmOverlay.style.display = 'block';
        confirmBox.style.display = 'block';
        // Optional: Add fadeIn animation class/style
        confirmBox.style.opacity = 1; // Simple fade-in start
        confirmBox.style.animation = 'fadeIn 0.3s ease-out forwards'; // Use your fadeIn animation
    }

    function hideConfirm() {
        if (!confirmBox || !confirmOverlay) return; // Safety check

        confirmBox.style.animation = 'fadeOut 0.3s ease-out forwards'; // Use fadeOut animation
        // Hide after animation
        setTimeout(() => {
            confirmBox.style.display = 'none';
            confirmOverlay.style.display = 'none';
            confirmBox.style.animation = ''; // Reset animation
        }, 300); // Match animation duration

        confirmCallback = null; // Clear the callback
    }

    // --- Add Event Listeners for Confirmation Buttons ---
    confirmBtnYes.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback(); // Execute the stored action (the actual delete)
        }
        hideConfirm(); // Close the confirmation modal
    });

    confirmBtnNo.addEventListener('click', () => {
        hideConfirm(); // Just close the modal on "No" / "Cancel"
    });

    // Close confirm modal if clicking overlay
    confirmOverlay.addEventListener('click', hideConfirm);


    // --- Function to close the modal ---
    function closeModal() {
        if (detailModal) {
            detailModal.style.display = 'none'; // Or use classList.remove('is-visible')
            // Don't clear content here, let the open action handle clearing/populating
            if (modalError) modalError.style.display = 'none';
            // Reset to view mode on close is usually a good idea
            toggleEditMode(false);
        }
    }

    // --- Function to clear modal fields before populating ---
    function clearModalContent() {
        // Clear view spans
        detailModalContent.querySelectorAll('span[data-field]').forEach(span => {
            span.textContent = 'Loading...';
        });
        // Clear edit inputs/selects
        detailModalContent.querySelectorAll('input[data-field], select[data-field]').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        if (modalError) {
            modalError.textContent = '';
            modalError.style.display = 'none';
        }
    }


    // --- Function to populate modal content (both view and edit) ---
    function populateModal(data) {
        clearModalContent();
        if (!data) { // Check if data exists
            console.error("populateModal called with invalid data:", data);
            if (modalError) {
                modalError.textContent = 'Failed to process employee details.';
                modalError.style.display = 'block';
            }
            return;
        }

        if (modalError) modalError.style.display = 'none';

        currentEmployeeData = data; // Store the fetched data
        currentUuid = data.uuid;

        // Populate both view spans and edit inputs/selects
        detailModalContent.querySelectorAll('[data-field]').forEach(element => {
            const fieldName = element.getAttribute('data-field');
            let value = (data[fieldName] !== null && data[fieldName] !== undefined) ? data[fieldName] : null; // Use null as a clearer "no value"

            if (element.tagName === 'SPAN') { // Populate view mode SPAN
                let displayValue = value ?? 'N/A'; // Use 'N/A' for null/undefined display

                // Formatting for display
                if ((fieldName === 'birthday' || fieldName === 'date') && value) {
                    try {
                        const date = new Date(value + 'T00:00:00'); // Prevent timezone shifting display date
                        displayValue = date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }); // Use locale date format
                    } catch (e) {
                        displayValue = 'Invalid Date';
                    }
                } else if (fieldName === 'is_active') { // Example for boolean
                    displayValue = value === true ? 'Yes' : 'No';
                }
                element.textContent = displayValue;

            } else if (element.tagName === 'INPUT' || element.tagName === 'SELECT') { // Populate edit mode INPUT/SELECT
                let inputValue = value ?? ''; // Use empty string for null/undefined input value

                if (element.type === 'date' && value) {
                    // Input type="date" requires YYYY-MM-DD
                    try {
                        // Server should ideally send YYYY-MM-DD directly if possible
                        const date = new Date(value + 'T00:00:00');
                        inputValue = date.toISOString().split('T')[0];
                    } catch (e) {
                        inputValue = '';
                    } // Clear if date is invalid
                } else if (element.tagName === 'SELECT' && typeof value === 'boolean') {
                    // Handle boolean mapping for selects if needed e.g., is_active
                    inputValue = value ? 'true' : 'false';
                }
                // Add other specific input formatting if needed

                element.value = inputValue;
            }
        });
    }


    // --- Function to toggle edit mode ---
    function toggleEditMode(editMode) { // Accepts true (edit) or false (view)
        isEditMode = editMode; // Update state

        const viewElements = detailModalContent.querySelectorAll('.view-mode');
        const editElements = detailModalContent.querySelectorAll('.edit-mode');

        viewElements.forEach(el => el.style.display = editMode ? 'none' : 'inline'); // Show if !editMode
        editElements.forEach(el => el.style.display = editMode ? 'inline-block' : 'none'); // Show if editMode (use inline-block or block as appropriate for inputs/selects)

        // Toggle visibility of buttons INSIDE the modal
        if (modalEditButton) modalEditButton.style.display = editMode ? 'none' : 'inline-block'; // Show Edit button only in view mode
        if (modalSaveButton) modalSaveButton.style.display = editMode ? 'inline-block' : 'none'; // Show Save only in edit mode
        if (modalCancelButton) modalCancelButton.style.display = editMode ? 'inline-block' : 'none'; // Show Cancel only in edit mode
    }

    // --- Event Listener for Detail/Edit Buttons (using Event Delegation) ---
    const tableBody = document.getElementById('employeeTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            // Find the closest ancestor button with the trigger class
            const triggerButton = event.target.closest('.employee-modal-trigger');

            if (triggerButton) {
                event.preventDefault(); // Prevent default <a> tag behavior

                const detailUrl = triggerButton.dataset.detailUrl;
                const initialMode = triggerButton.dataset.mode || 'view'; // Default to 'view' if mode is not set

                if (!detailUrl) {
                    console.error('Detail URL not found on button.');
                    showAlert('Configuration error: Detail URL missing.', 'error');
                    return;
                }

                clearModalContent(); // Clear previous content and show "Loading..."
                openModal();         // Show the modal shell

                // Fetch data from the API
                fetch(detailUrl)
                    .then(response => {
                        if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
                        return response.json();
                    })
                    .then(data => {
                        if (!data || data.success === false) { // Check success flag from your API response
                            throw new Error(data?.error || 'API returned an error or invalid data.');
                        }
                        populateModal(data);           // Populate both view and edit fields
                        toggleEditMode(initialMode === 'edit'); // Set initial state based on clicked button
                    })
                    .catch(error => {
                        console.error('Error fetching or processing employee details:', error);
                        clearModalContent(); // Clear loading message
                        if (modalError) {
                            modalError.textContent = `Failed to load details: ${error.message}`;
                            modalError.style.display = 'block';
                        }
                        // Optionally hide buttons if load failed completely
                        toggleEditMode(false); // Default to view mode on error
                        if (modalEditButton) modalEditButton.style.display = 'none';
                    });
                return;
            }
            // --- Handle Delete Trigger ---
            const deleteTriggerButton = event.target.closest('.delete-employee-trigger');
            if (deleteTriggerButton) {
                event.preventDefault(); // Prevent default <a> tag behavior

                const employeeUuid = deleteTriggerButton.dataset.uuid;
                const deleteUrl = deleteTriggerButton.dataset.deleteUrl;
                const employeeUsername = deleteTriggerButton.dataset.username || 'this employee'; // Get username for confirm message

                if (!employeeUuid || !deleteUrl) {
                    console.error('Delete trigger missing UUID or URL.');
                    showAlert('Configuration error: Cannot initiate delete.', 'error'); // Use new alert
                    return;
                }

                // --- Confirmation Dialog ---
                // Define the message for the custom confirmation box
                const confirmationMessage = `Are you sure you want to delete ${employeeUsername}? This action cannot be undone.`;

                // Define the function to execute IF the user clicks "Yes"
                const executeDelete = () => {
                    // --- Proceed with Deletion (Code previously inside the if(confirm(...)) block) ---
                    const csrfToken = getCsrfToken();
                    if (!csrfToken) {
                        showAlert('Security token missing. Cannot proceed with delete.', 'error');
                        return;
                    }

                    fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRFToken': csrfToken,
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            if (response.status === 204) {
                                return { success: true, message: `deleted successfully.` };
                            } else {
                                return response.json().then(data => ({ ok: true, data }));
                            }
                        } else {
                            return response.json().then(data => Promise.reject(data))
                                .catch(() => Promise.reject({ error: `Request failed with status ${response.status}` }));
                        }
                    })
                    .then(result => {
                        if (result.data?.success !== false) {
                            const successMessage = result.data?.message || `${employeeUsername} deleted successfully!`;
                            showAlert(successMessage, 'success');
                            const tableRow = document.querySelector(`tr[data-employee-uuid="${employeeUuid}"]`);
                            if (tableRow) {
                                tableRow.remove();
                            } else {
                                console.warn(`Could not find table row with UUID: ${employeeUuid} to remove after delete.`);
                            }
                        } else {
                            throw new Error(result.data?.error || 'Deletion failed.');
                        }
                    })
                    .catch(errorData => {
                        console.error('Error deleting employee:', errorData);
                        const errorMessage = errorData?.error || 'An error occurred during deletion. Please try again.';
                        showAlert(errorMessage, 'error');
                    });
                }; // End of executeDelete function definition
                // Call your custom confirmation function
                showConfirm(confirmationMessage, executeDelete);
            }
        });
    } else {
        console.warn("Element with ID 'employeeTableBody' not found for event delegation.");
    }

    // --- Event Listener for Edit Button INSIDE the modal ---
    if (modalEditButton) {
        modalEditButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default if it's an <a> or <button type="submit">
            toggleEditMode(true); // Switch to edit mode
        });
    }

    // --- Event Listener for Save Button INSIDE the modal ---
    if (modalSaveButton) {
        modalSaveButton.addEventListener('click', () => {
            // --- AJAX Save Logic (Keep your existing save logic here) ---
            const formData = {};
            const inputs = detailModalContent.querySelectorAll('input[data-field], select[data-field]');
            inputs.forEach(input => {
                const fieldName = input.getAttribute('data-field');
                // Add special handling if needed (e.g., checkboxes, booleans from select)
                if (input.type === 'checkbox') {
                    formData[fieldName] = input.checked;
                } else {
                    formData[fieldName] = input.value;
                }
            });

            // Make sure UUID is available
            if (!currentUuid) {
                showAlert('Error: Cannot save, employee identifier missing.', 'error');
                return;
            }

            const updateUrl = `/employee/${currentUuid}/update/`; // Use update URL
            const csrfToken = getCsrfToken();

            // Disable button during save
            modalSaveButton.disabled = true;
            modalSaveButton.textContent = 'Saving...';
            if (modalError) modalError.style.display = 'none';

            fetch(updateUrl, {
                method: 'POST', // Or PUT, match your view
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify(formData),
            })
                .then(response => response.json().then(data => ({
                    ok: response.ok,
                    status: response.status,
                    data
                }))) // Process response and status
                .then(({ok, status, data}) => {
                    if (ok && data.success) {
                        currentEmployeeData = data; // Update stored data with response (assuming your API returns the updated object)
                        populateModal(data); // Refresh modal fields with saved data
                        toggleEditMode(false); // Switch back to view mode
                        showAlert('save success!', 'success');
                        // --- UPDATE THE TABLE ---
                        updateTableRow(currentUuid, data); // Pass UUID and the updated data
                    } else {
                        // Handle validation errors or other server errors
                        const errorMessage = data?.error || `Failed to update (Status: ${status})`;
                        throw new Error(errorMessage);
                    }
                })
                .catch(error => {
                    console.error('Error updating employee:', error);
                    if (modalError) {
                        modalError.textContent = `Save failed: ${error.message}`;
                        modalError.style.display = 'block';
                    }
                    showAlert(`Save failed: ${error.message}`, 'error');
                })
                .finally(() => {
                    // Re-enable button
                    modalSaveButton.disabled = false;
                    modalSaveButton.textContent = 'Save';
                });
        });
    }

    // --- Event Listener for Cancel Button INSIDE the modal ---
    if (modalCancelButton) {
        modalCancelButton.addEventListener('click', () => {
            populateModal(currentEmployeeData); // Restore fields from last fetched/saved data
            toggleEditMode(false); // Switch back to view mode
            if (modalError) modalError.style.display = 'none'; // Clear any previous errors
        });
    }

    // --- Function to get CSRF Token (ensure this exists) ---
    function getCsrfToken() {
        const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfCookie ? csrfCookie.split('=')[1] : null;
    }

    // --- Alert Function Placeholder  ---
    function showAlert(message, type) {
        if (!customAlertOverlay || !successAlertBox || !errorAlertBox || !successAlertText || !errorAlertText) {
            console.error("Custom alert elements not found! Check HTML IDs.");
            // Fallback to standard alert
            window.alert(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        // Set message text
        const alertBoxToShow = (type === 'success') ? successAlertBox : errorAlertBox;
        const alertTextElement = (type === 'success') ? successAlertText : errorAlertText;
        const alertBoxToHide = (type === 'success') ? errorAlertBox : successAlertBox;

        // 1. Hide the other alert box immediately (if it was somehow visible)
        alertBoxToHide.style.display = 'none';
        alertBoxToHide.style.animation = ''; // Remove any lingering animation

        // 2. Set the message text
        alertTextElement.textContent = message;

        // 3. Clear any previous auto-hide timeout
        clearTimeout(alertTimeout);

        // 4. Show the overlay and the correct alert box
        customAlertOverlay.style.display = 'block';
        alertBoxToShow.style.display = 'flex'; // Use 'flex' as per CSS

        // 5. Apply the fadeIn animation
        alertBoxToShow.style.animation = 'fadeIn 0.5s ease-out forwards';

        // 6. Set timeout to auto-hide after ~3 seconds
        alertTimeout = setTimeout(() => {
            hideAlert();
        }, 3000); // 3000 milliseconds = 3 seconds
    }

    // --- Function to hide the custom alert ---
    function hideAlert() {
        // Only proceed if the overlay is currently visible
        if (customAlertOverlay && customAlertOverlay.style.display === 'block') {
            // Find which alert box is currently displayed
            const visibleAlertBox = successAlertBox.style.display === 'flex' ? successAlertBox : (errorAlertBox.style.display === 'flex' ? errorAlertBox : null);

            if (visibleAlertBox) {
                // Apply fadeOut animation
                visibleAlertBox.style.animation = 'fadeOut 0.5s ease-out forwards';

                // Hide the overlay (do this slightly before or concurrently)
                customAlertOverlay.style.display = 'none';

                // Wait for fadeOut animation to finish before setting display to none
                setTimeout(() => {
                    // Check again if it's still the one supposed to be hidden, in case user triggered another alert quickly
                    if (visibleAlertBox.style.animation.includes('fadeOut')) {
                        visibleAlertBox.style.display = 'none';
                        visibleAlertBox.style.animation = ''; // Reset animation property
                    }
                }, 500); // 500ms matches the fadeOut duration
            } else {
                // If somehow no alert box is visible but overlay is, just hide overlay
                customAlertOverlay.style.display = 'none';
            }
        }
        // Clear any pending auto-hide timeout
        clearTimeout(alertTimeout);
    }

    // --- Add Event Listeners for the Custom Alert ---
    // Close button listener
    if (customAlertOverlay) {
        customAlertOverlay.addEventListener('click', hideAlert);
    } else {
        console.warn("Custom alert overlay element not found.");
    }


    // --- Event Listener for Modal Close Button ---
    if (closeDetailModalButton) {
        closeDetailModalButton.addEventListener('click', closeModal);
    }

    // Close modal if clicking outside the content area ---
    if (detailModal) {
        detailModal.addEventListener('click', (event) => {
            if (event.target === detailModal) { // Check if the click is on the backdrop
                closeModal();
            }
        });
    }

});