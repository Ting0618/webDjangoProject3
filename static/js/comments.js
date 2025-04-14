// static/js/comments.js

document.addEventListener('DOMContentLoaded', function() {

    const commentList = document.getElementById('comment-list');

    // Function to get CSRF token (needed for POST)
    function getCsrfToken() {
        const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfCookie ? csrfCookie.split('=')[1] : null;
    }

    // --- Event Delegation for Like Buttons ---
    if (commentList) {
        commentList.addEventListener('click', function(event) {
            // Target the like button specifically
            const likeButton = event.target.closest('.btn-like');

            if (!likeButton) {
                return; // Click wasn't on a like button or its icon
            }

            // Prevent default button action (important if it's inside a form)
            event.preventDefault();

            // Check if the button is already liked/disabled
            if (likeButton.classList.contains('liked') || likeButton.disabled) {
                // console.log('Already liked or button disabled.');
                return; // Do nothing if already liked
            }

            const commentId = likeButton.dataset.commentId;
            const likeUrl = likeButton.dataset.likeUrl;
            const csrfToken = getCsrfToken();

            if (!commentId || !likeUrl || !csrfToken) {
                console.error('Like button missing data attributes or CSRF token.');
                // Optionally show an error using window.showAlert if available
                if (typeof window.showAlert === 'function') {
                    window.showAlert('Could not process like. Configuration error.', 'error');
                }
                return;
            }

            // --- Send AJAX Request ---
            fetch(likeUrl, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,
                    // 'Content-Type': 'application/json' // Usually not needed for simple POST like this
                },
                // body: JSON.stringify({}) // No body needed unless sending extra data
            })
            .then(response => {
                if (!response.ok) {
                    // Try to get error details from JSON response if possible
                    return response.json().then(errData => {
                        throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
                    }).catch(() => {
                         // Fallback if response body isn't JSON
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    });
                }
                return response.json(); // Parse successful JSON response
            })
            .then(data => {
                if (data.success) {
                    // --- Update UI on Success ---
                    const countSpan = commentList.querySelector(`.like-count[data-comment-id="${commentId}"]`);

                    if (data.action === 'liked') {
                        likeButton.classList.add('liked'); // Add 'liked' class for styling
                        likeButton.disabled = true;       // Disable the button
                        likeButton.title = 'You liked this'; // Update tooltip
                        // Update count
                        if (countSpan) {
                            countSpan.textContent = data.like_count;
                        }
                        // Maybe show a temporary success indicator? (Optional)
                    } else if (data.action === 'unliked') {
                        // This code currently only implements LIKING.
                        // If your API also handles UNLIKING and you want the button
                        // to toggle back, you would handle the 'unliked' action here:
                        // likeButton.classList.remove('liked');
                        // likeButton.disabled = false;
                        // likeButton.title = 'Like this comment';
                        // if (countSpan) countSpan.textContent = data.like_count;
                    } else {
                         console.warn("Unknown action received from server:", data.action);
                    }

                } else {
                    // Handle success=false from API
                    throw new Error(data.error || 'Liking failed.');
                }
            })
            .catch(error => {
                console.error('Error liking comment:', error);
                // Show error popup using the globally defined function
                 if (typeof window.showAlert === 'function') {
                     window.showAlert(`Error: ${error.message}`, 'error');
                 } else {
                     // Fallback
                     alert(`Error: ${error.message}`);
                 }
            });
        }); // End event listener callback
    } // End if(commentList)

});