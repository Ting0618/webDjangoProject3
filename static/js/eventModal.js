document.addEventListener("DOMContentLoaded", function () {
    // --- Element References ---
    const eventModal = document.getElementById("eventModal");
    const openModalButton = document.getElementById("openModal");
    const closeModalButton = eventModal.querySelector(".close");
    const saveButton = document.getElementById("saveEvent");
    const modalTitle = document.getElementById("modalTitle");
    const titleInput = document.getElementById("event-title");

    // ****  Ensure this ID matches your date input in the modal ****
    const dateInput = document.getElementById("event-scheduled_push_time");
    const editorContainer = document.getElementById("editor");
    const tableBody = document.getElementById("eventTableBody");
    const modalErrorMsg = document.getElementById("customErrorAlertText");

    // --- Confirmation Modal Elements ---
    const confirmOverlay = document.getElementById('customConfirmOverlay');
    const confirmBox = document.getElementById('customConfirmBox');
    const confirmTextElement = document.getElementById('customConfirmText');
    const confirmBtnYes = document.getElementById('confirmBtnYes');
    const confirmBtnNo = document.getElementById('confirmBtnNo');

    // --- Alert Function (Assume global window.showAlert exists from alert.js) ---
    if (typeof showAlert === 'undefined') {
        console.error("Global function 'showAlert' is not defined. Make sure alert.js is loaded correctly.");
        // Provide a fallback alert so the UI doesn't completely break
        window.showAlert = function (message, type) {
            console.warn("Using fallback alert. Custom alerts unavailable.");
            window.alert(`[${type.toUpperCase()}] ${message}`);
        };
    }

    // --- Check Core Elements ---
    if (!eventModal || !openModalButton || !closeModalButton || !saveButton || !modalTitle || !titleInput || !dateInput || !editorContainer || !tableBody || !modalErrorMsg) {
        console.error("One or more required modal or table elements not found! Check HTML IDs.");
        // Disable buttons if core elements missing
        if (openModalButton) openModalButton.disabled = true;
        if (saveButton) saveButton.disabled = true;
        return; // Stop script execution if essential elements are missing
    }

    // --- Quill Initialization ---
    let quill;

    function initializeQuill(content = '') {
        if (!editorContainer) return; // Don't initialize if container missing
        if (!quill) {
            quill = new Quill("#editor", {theme: "snow", placeholder: "Enter event details..."});
        }
        if (content) {
            quill.root.innerHTML = content; // Set initial content for edit
        } else {
            quill.setContents([]); // Clear content
            quill.root.innerHTML = '';
        }
        quill.setSelection(0, 0);
    }

    // --- CSRF Token ---
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrfToken = getCookie('csrftoken');

    // --- Modal Helper Functions ---
    function clearModalForm() {
        eventModal.dataset.mode = 'create';
        eventModal.dataset.eventId = '';
        eventModal.dataset.updateUrl = ''; // Clear update URL
        modalTitle.textContent = 'Create Event';
        titleInput.value = '';
        dateInput.value = ''; // Clear date input
        initializeQuill(); // Clear Quill
        modalErrorMsg.style.display = 'none';
        modalErrorMsg.textContent = '';
        saveButton.textContent = 'Save';
        saveButton.disabled = false; // Ensure button is enabled
    }

    function showModal() {
        modalErrorMsg.style.display = 'none'; // Ensure error is hidden when opening
        eventModal.style.display = 'block';
    }

    function hideModal() {
        eventModal.style.display = 'none';
        clearModalForm(); // Reset form state on hide
    }

    // --- Event Listener for "+ Create Event" Button ---
    openModalButton.addEventListener("click", function () {
        clearModalForm();
        showModal();
    });

    // --- Event Listener for Modal Close Button ---
    closeModalButton.addEventListener("click", hideModal);

    // --- Event Listener for Clicking Outside Modal ---
    window.addEventListener("click", function (event) {
        if (event.target === eventModal) {
            hideModal();
        }
    });

    // --- Update Table Row Function ---
    function updateTableRow(eventId, responseData) {
        const row = tableBody.querySelector(`tr[data-event-row-id="${eventId}"]`);
        if (!row) {
            console.warn(`Could not find table row ${eventId} to update.`);
            return;
        }
        console.log("Updating row:", eventId, "with data:", responseData);

        // Expecting responseData.event to contain updated fields
        if (responseData && responseData.event) {
            const eventData = responseData.event;
            for (const field in eventData) {
                const cell = row.querySelector(`td[data-field="${field}"]`);
                if (cell) {
                    console.log(`Updating cell [${field}] with: ${eventData[field]}`);
                    cell.textContent = eventData[field] || 'N/A'; // Update text

                    // Update status class specifically
                    if (field === 'status') {
                        cell.className = `event-status status-${eventData[field].toLowerCase()}`;
                    }
                } else {
                    console.warn(`No cell found for field: ${field}`);
                }
            }
        } else {
            console.error("Invalid response data received for table update:", responseData);
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

    // --- MAIN EVENT LISTENER FOR TABLE ACTIONS (Edit, Delete, Publish) ---
    tableBody.addEventListener('click', function (event) {
        const targetButton = event.target.closest('button.action-btn'); // Find the button clicked
        if (!targetButton) {
            console.log("Click was not on or inside an action button.");
            return; // Exit if click wasn't on a relevant button
        }

        const eventId = targetButton.dataset.eventId;
        // --- HANDLE EDIT ---
        if (targetButton.classList.contains('edit-btn')) {
            event.preventDefault();
            const detailUrl = targetButton.dataset.detailUrl;
            const updateUrl = targetButton.dataset.updateUrl;

            if (!eventId || !detailUrl || !updateUrl) {
                console.error("Edit button missing data attributes.");
                showAlert('Cannot edit event: Configuration error.', 'error');
                return;
            }

            // Prepare modal for editing
            clearModalForm();
            eventModal.dataset.mode = 'edit';
            eventModal.dataset.eventId = eventId;
            eventModal.dataset.updateUrl = updateUrl; // Store update URL
            modalTitle.textContent = `Edit Event`;
            saveButton.textContent = 'Update Event';
            showModal(); // Show modal shell

            // Fetch current data
            fetch(detailUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
                    return response.json();
                })
                .then(data => {
                    // Populate the form
                    titleInput.value = data.title || '';
                    // **** IMPORTANT: Ensure 'scheduled_date' key matches the JSON from your detail API ****
                    dateInput.value = data.scheduled_push_time || '';
                    initializeQuill(data.content || '');
                })
                .catch(error => {
                    console.error('Error fetching event details for edit:', error);
                    modalErrorMsg.textContent = `Error loading details: ${error.message}`;
                    modalErrorMsg.style.display = 'block';
                    showAlert(`Failed to load event details: ${error.message}`, 'error');
                });
        }

        // --- HANDLE DELETE ---
        else if (targetButton.classList.contains('delete-btn')) {
            console.log(`Delete button clicked for event ID: ${eventId}`);
            event.preventDefault();

            const deleteUrl = targetButton.dataset.deleteUrl;
            const eventTitle = targetButton.dataset.eventTitle || 'this event';

            if (!eventId || !deleteUrl) {
                console.error("Delete button missing data attributes.");
                showAlert('Cannot delete event: Configuration error.', 'error');
                return;
            }

            // --- Show Custom Confirmation ---
            // Instead of confirm(), call showConfirm()
            // Pass the message and a function containing the delete logic as the callback
            showConfirm(`Are you sure you want to delete the event?`, () => {
                // --- This code runs ONLY if user clicks "Yes, Delete" ---

                console.log("User confirmed deletion.");
                // Disable button temporarily (optional, maybe less necessary now)
                targetButton.disabled = true;
                targetButton.textContent = 'Deleting...';

                fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrfToken
                    }
                })
                    .then(response => { /* ... (keep existing response handling) ... */
                        if (response.status === 204) {
                            return {success: true, message: `Event "${eventTitle}" deleted successfully.`};
                        }
                        if (!response.ok) {
                            return response.json().then(errData => {
                                throw new Error(errData.error || response.statusText);
                            })
                                .catch(() => {
                                    throw new Error(`Request failed with status ${response.status}`);
                                });
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            showAlert(data.message || 'Event deleted successfully!', 'success');
                            // Reload the page after successful delete
                            setTimeout(() => {
                                console.log("Reloading page after successful delete...");
                                window.location.reload();
                            }, 2500); // Shorter delay perhaps, as confirm is gone

                            // OR Remove row dynamically (if you prefer that)
                            // const row = targetButton.closest('tr');
                            // if (row) row.remove();

                        } else {
                            throw new Error(data.error || 'Deletion failed on server.');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting event:', error);
                        showAlert(`Error deleting event: ${error.message}`, 'error');
                        // Re-enable button on failure (important!)
                        targetButton.disabled = false;
                        targetButton.textContent = 'Delete';
                    });
            });
        }



        // --- HANDLE PUBLISH ---
        else if (targetButton.classList.contains('publish-btn') && !targetButton.disabled) {
            console.log(`Publish button clicked for event ID: ${eventId}`);
            const publishUrl = targetButton.dataset.publishUrl; // Get URL from button
            const eventTitle = targetButton.dataset.eventTitle || 'this event';
            if (!eventId || !publishUrl) {
                showAlert('Cannot publish: Configuration error (missing ID or URL).', 'error');
                return;
            }
            // Use custom confirmation
            showConfirm(`Are you sure you want to publish the event?`, () => {
                publishEvent(eventId, publishUrl, eventTitle, targetButton); // Pass button, URL, title
            });
        }

        // --- NEW: HANDLE REVOKE ---
        else if (targetButton.classList.contains('revoke-btn') && !targetButton.disabled) {
            console.log(`Revoke button clicked for event ID: ${eventId}`);
            const revokeUrl = targetButton.dataset.revokeUrl; // Get URL from button
            const eventTitle = targetButton.dataset.eventTitle || 'this event';
            if (!eventId || !revokeUrl) {
                showAlert('Cannot revoke: Configuration error (missing ID or URL).', 'error');
                return;
            }
            // Use custom confirmation
            showConfirm(`Are you sure you want to revoke the event ?`, () => {
                revokeEvent(eventId, revokeUrl, eventTitle, targetButton); // Pass button, URL, title
            });
        }

        // --- HANDLE DISABLED PUBLISH CLICK (Optional Feedback) ---
        else if (targetButton.classList.contains('publish-btn-disabled')) {
            showAlert("You do not have permission to publish this event.", 'error');
        }

    }); // --- END tableBody click listener ---


    // --- SAVE BUTTON Event Listener (Handles BOTH Create and Update) ---
    saveButton.addEventListener("click", function () {
        const mode = eventModal.dataset.mode || 'create';
        const currentEventId = eventModal.dataset.eventId;
        const updateUrl = eventModal.dataset.updateUrl;

        const title = titleInput.value.trim();
        // **** IMPORTANT: Get value from the correct date input ID ****
        const dateValue = dateInput.value;
        const content = quill ? quill.root.innerHTML.trim() : '';

        // Validation
        if (!title || !dateValue || content === '<p><br></p>' || !content) {
            showAlert("Title, Scheduled Date, and Content are required!", 'error');
            return;
        }

        // Prepare data and URL
        let apiUrl;
        let method;
        const eventData = {
            title: title,
            // **** IMPORTANT: Send key expected by backend API (e.g., 'scheduled_date' or 'scheduled_push_time') ****
            scheduled_push_time: dateValue, // Change this key if backend expects 'scheduled_push_time'
            content: content,
        };

        if (mode === 'edit') {
            if (!currentEventId || !updateUrl) {
                showAlert('Cannot update: Configuration error.', 'error');
                return;
            }
            apiUrl = updateUrl;
            method = 'PUT'; // Or 'POST', match your Django view
        } else {
            apiUrl = '/events/create/'; // Ensure this is correct create URL
            method = 'POST';
        }

        console.log(`${method} request to ${apiUrl} with data:`, eventData);

        // Perform Fetch
        saveButton.disabled = true;
        saveButton.textContent = (mode === 'edit') ? 'Updating...' : 'Saving...';
        modalErrorMsg.style.display = 'none';

        fetch(apiUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(eventData)
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (ok && (data.success || data.status === 'success')) { // Check for 'success' or 'status' field
                    hideModal();
                    showAlert(data.message || `Event ${mode === 'edit' ? 'updated' : 'created'} successfully!`, 'success');

                    if (mode === 'edit') {
                        updateTableRow(currentEventId, data); // Update the table row
                    } else {
                        // Reload after delay for create
                        setTimeout(() => {
                            window.location.reload();
                        }, 3500);
                    }
                } else {
                    // Handle backend error message
                    throw new Error(data.message || data.error || `Failed to ${mode} event.`);
                }
            })
            .catch(error => {
                console.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} event:`, error);
                showAlert(`Error: ${error.message}`, 'error');
                modalErrorMsg.textContent = `Error: ${error.message}`;
                modalErrorMsg.style.display = 'block';
            })
            .finally(() => {
                saveButton.disabled = false;
                saveButton.textContent = (mode === 'edit') ? 'Update Event' : 'Save';
            });
    }); // --- END saveButton click listener ---


    // --- Function to Create Action Button HTML ---
    function createActionButton(cssClass, text, eventId, urlDataAttr, url, titleDataAttr = '', title = '') {
        const button = document.createElement('button');
        button.className = `action-btn ${cssClass}`;
        button.dataset.eventId = eventId;
        button.textContent = text;
        // Use bracket notation for dataset when attribute name comes from variable
        if (urlDataAttr && url) {
             button.dataset[urlDataAttr.replace(/^data-/, '').replace(/-([a-z])/g, g => g[1].toUpperCase())] = url;
        }
         if (titleDataAttr && title) {
             button.dataset[titleDataAttr.replace(/^data-/, '').replace(/-([a-z])/g, g => g[1].toUpperCase())] = title;
        }
        return button;
    }


    // --- Publish Event Function ---
    function publishEvent(eventId, publishUrl, eventTitle, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Publishing...';
        const url = `/events/${eventId}/publish/`; // Ensure this URL is correct

        fetch(url, {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest'}
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (ok && data.status === 'success') {
                    showAlert(data.message || 'Event published!', 'success');
                    const row = buttonElement.closest('tr');
                    if (row) {
                        const statusCell = row.querySelector('.event-status');
                        if (statusCell) {
                            statusCell.textContent = data.event_status;
                            statusCell.className = `event-status status-${data.event_status.toLowerCase()}`;
                        }
                        const actionsCell = buttonElement.closest('td');
                        if (actionsCell) {
                            buttonElement.remove(); // Remove the publish button
                            const revokeUrl = `/events/${eventId}/revoke/`; // Construct revoke URL (or get from response if available)
                            const revokeBtn = createActionButton(
                                'revoke-btn',        // CSS Class
                                'Revoke',            // Button Text
                                eventId,             // Event ID
                                'revokeUrl',         // data-* attribute name (camelCase for dataset)
                                revokeUrl,           // URL
                                'eventTitle',        // data-* attribute for title
                                eventTitle           // Title value
                            );
                            actionsCell.appendChild(revokeBtn); // Add the new revoke button
                        }
                    } else {
                        setTimeout(() => {
                            window.location.reload();
                        }, 3500); // Fallback reload
                    }
                } else {
                    throw new Error(data.message || 'Failed to publish.');
                }
            })
            .catch(error => {
                console.error('Error publishing event:', error);
                showAlert(`Error publishing: ${error.message}`, 'error');
                buttonElement.disabled = false; // Re-enable on error
                buttonElement.textContent = 'Publish';
            });
    }

    // --- NEW: Revoke Event Function ---
    function revokeEvent(eventId, revokeUrl, eventTitle, buttonElement) { // Accept URL, title, button
        buttonElement.disabled = true;
        buttonElement.textContent = 'Revoking...';

        fetch(revokeUrl, { // Use passed URL
            method: 'POST', // Matches backend view decorator
            headers: {'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest'}
        })
            .then(response => response.json().then(data => ({ok: response.ok, data})))
            .then(({ok, data}) => {
                if (ok && data.success) { // Check success flag from backend
                    showAlert(data.message || 'Event revoked to draft!', 'success');
                    const row = buttonElement.closest('tr');
                    if (row) {
                        // Update status cell
                        const statusCell = row.querySelector('td[data-field="status"]');
                        if (statusCell) {
                            statusCell.textContent = data.event_status; // Should be 'Draft'
                            statusCell.className = `event-status status-${data.event_status.toLowerCase()}`;
                        }

                        // --- Replace Revoke button with Publish button ---
                        const actionsCell = buttonElement.closest('td');
                        if (actionsCell) {
                            buttonElement.remove(); // Remove the revoke button
                            const publishUrl = `/events/${eventId}/publish/`; // Construct publish URL
                            const publishBtn = createActionButton(
                                'publish-btn',       // CSS Class
                                'Publish',           // Button Text
                                eventId,             // Event ID
                                'publishUrl',        // data-* attribute name
                                publishUrl,          // URL
                                'eventTitle',        // data-* attribute for title
                                eventTitle           // Title value
                            );
                            actionsCell.appendChild(publishBtn); // Add the new publish button
                        }
                        // --- End Button Replacement ---

                    } else {
                        setTimeout(() => {
                            window.location.reload();
                        }, 3500); // Fallback reload
                    }
                } else {
                    throw new Error(data.message || data.error || 'Failed to revoke.');
                }
            })
            .catch(error => {
                console.error('Error revoking event:', error);
                showAlert(`Error revoking: ${error.message}`, 'error');
                buttonElement.disabled = false; // Re-enable on error
                buttonElement.textContent = 'Revoke';
            });
    }

}); // --- END DOMContentLoaded ---