(function() {
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

    // --- Define Alert Function ---
    function showAlertInternal(message, type) { // Rename internal function
        if (!customAlertOverlay || !successAlertBox || !errorAlertBox || !successAlertText || !errorAlertText) {
            console.error("Custom alert elements not found! Check HTML IDs.");
            // Fallback to standard alert
            window.alert(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        // (Keep the rest of the logic inside this function exactly as before)
        // ... (set text, clear timeout, show overlay/box, apply animation, set new timeout) ...
         // Set message text
        const alertBoxToShow = (type === 'success') ? successAlertBox : errorAlertBox;
        const alertTextElement = (type === 'success') ? successAlertText : errorAlertText;
        const alertBoxToHide = (type === 'success') ? errorAlertBox : successAlertBox;

        // 1. Hide the other alert box immediately
        alertBoxToHide.style.display = 'none';
        alertBoxToHide.style.animation = '';

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
            hideAlertInternal(); // Call internal hide function
        }, 3000);
    }

    // --- Define Function to hide the custom alert ---
    function hideAlertInternal() { // Rename internal function
        // (Keep the logic inside this function exactly as before)
        // ... (check overlay display, find visible box, apply fadeOut, hide overlay, setTimeout to set display: none) ...
        if (customAlertOverlay && customAlertOverlay.style.display === 'block') {
            const visibleAlertBox = successAlertBox.style.display === 'flex' ? successAlertBox : (errorAlertBox.style.display === 'flex' ? errorAlertBox : null);

            if (visibleAlertBox) {
                visibleAlertBox.style.animation = 'fadeOut 0.5s ease-out forwards';
                customAlertOverlay.style.display = 'none';

                setTimeout(() => {
                    if (visibleAlertBox.style.animation.includes('fadeOut')) {
                        visibleAlertBox.style.display = 'none';
                        visibleAlertBox.style.animation = '';
                    }
                }, 500);
            } else {
                 customAlertOverlay.style.display = 'none';
            }
        }
        clearTimeout(alertTimeout);
    }


    // --- Wait for DOMContentLoaded to attach listener for overlay ---
    document.addEventListener('DOMContentLoaded', () => {
        // Re-fetch overlay in case it wasn't ready when script first ran
        const overlay = document.getElementById('customAlertOverlay');
         if (overlay) {
             overlay.addEventListener('click', hideAlertInternal); // Use internal function
         } else {
             console.warn("Custom alert overlay element not found when attaching listener.");
         }
    });

    // --- Expose functions globally ---
    // Assign the internal functions to properties of the window object
    window.showAlert = showAlertInternal;
    window.hideAlert = hideAlertInternal;

})(); 