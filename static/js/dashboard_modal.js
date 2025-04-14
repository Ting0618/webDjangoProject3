document.addEventListener('DOMContentLoaded', () => {
    const announcementList = document.getElementById('announcementList');
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalEventTitle');
    const modalContent = document.getElementById('modalEventContent');
    const closeModalButton = modal.querySelector('.modal-close');
    const viewCommentsLink = document.getElementById('viewCommentsLink'); // Link to comments page


    if (!announcementList || !modal || !closeModalButton || !viewCommentsLink) {
        console.error('Modal elements not found!');
        return;
    }

    // --- Function to open the modal ---
    function openModal(title, content, eventId) {
        modalTitle.textContent = title;
        modalContent.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`; // Basic formatting for newlines

        // Construct the URL for the specific event's comment page
         // Adjust path if needed
        viewCommentsLink.href = `/events/${eventId}/comments/`;

        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
        closeModalButton.focus(); // Focus the close button for accessibility
    }

    // --- Function to close the modal ---
    function closeModal() {
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
    }

    // --- Event Listener for Announcement List (Event Delegation) ---
    announcementList.addEventListener('click', (event) => {
        const listItem = event.target.closest('.announcement-item');
        if (listItem && listItem.dataset.eventId) {
            event.preventDefault(); // Prevent default anchor behavior

            const eventId = listItem.dataset.eventId;
            const title = listItem.dataset.eventTitle;
            // Decode potential HTML entities (though escapejs should handle most)
            const tempElem = document.createElement('textarea');
            tempElem.innerHTML = listItem.dataset.eventContent;
            const content = tempElem.value;


            openModal(title, content, eventId);
        }
    });

    // --- Event Listener for Modal Close Button ---
    closeModalButton.addEventListener('click', closeModal);

    // --- Event Listener for Clicking Outside the Modal Content ---
    modal.addEventListener('click', (event) => {
        // Close only if clicked directly on the overlay, not the content inside
        if (event.target === modal) {
            closeModal();
        }
    });

    // --- Event Listener for Escape Key ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('visible')) {
            closeModal();
        }
    });

});