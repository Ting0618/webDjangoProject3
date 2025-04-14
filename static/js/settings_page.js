
document.addEventListener('DOMContentLoaded', function() {
    // Find the container holding the messages from Django
    const messageContainer = document.getElementById('django-message-container');

    // Check if the container exists (it might not if no messages were sent)
    if (!messageContainer) {
        // console.log("No message container found."); // Optional debug message
        return; // No messages to process
    }

    const messages = messageContainer.querySelectorAll('.django-message');

    messages.forEach(msgElement => {
        const messageText = msgElement.textContent.trim();
        const messageTag = msgElement.getAttribute('data-tag'); // e.g., "success", "error"

        // Check for the specific success messages we set in the view
        if (messageTag === 'success') {
            let displayPopupMessage = null; // The user-friendly message for the popup

            if (messageText === 'PASSWORD_CHANGE_SUCCESS') {
                displayPopupMessage = 'Password changed successfully!';
            } else if (messageText === 'AVATAR_UPDATE_SUCCESS') {
                displayPopupMessage = 'Avatar updated successfully!';
            }
            // Add checks for other specific success messages if needed

            // If we found a specific message to show in a popup
            // and the global showAlert function exists
            if (displayPopupMessage && typeof window.showAlert === 'function') {
                window.showAlert(displayPopupMessage, 'success'); // Call the globally exposed function
            } else if (displayPopupMessage) {
                console.error('window.showAlert function is not defined, but required for:', displayPopupMessage);
                 // Fallback to standard alert if custom one fails
                window.alert('Success: ' + displayPopupMessage);
            }
        }
    });
});