document.addEventListener("DOMContentLoaded", function () {
    // handle all parent menu clicks with submenus
    var menuParents = document.querySelectorAll(".menu-parent");
    menuParents.forEach(function (parent) {
        parent.addEventListener("click", function (e) {
            // find the .submenu element after the parent link
            var submenu = parent.nextElementSibling;
            if (submenu && submenu.classList.contains("submenu")) {
                // close all other submenus before opening the current one
                document.querySelectorAll(".submenu").forEach(function (otherSubmenu) {
                    if (otherSubmenu !== submenu) {
                        otherSubmenu.style.display = "none";
                        // update the arrow indicator for the parent link
                        var otherParent = otherSubmenu.previousElementSibling;
                        if (otherParent && otherParent.classList.contains("menu-parent")) {
                            var arrow = otherParent.querySelector(".arrow");
                            if (arrow) {
                                arrow.innerHTML = "&#9662;";
                            }
                        }
                    }
                });
                // prevent the default link behavior
                e.preventDefault();
                // if the submenu is visible, hide it and update the arrow indicator
                if (submenu.style.display === "block") {
                    submenu.style.display = "none";
                    parent.querySelector(".arrow").innerHTML = "&#9662;";
                } else {
                    // otherwise, display the submenu and update the arrow indicator
                    submenu.style.display = "block";
                    parent.querySelector(".arrow").innerHTML = "&#9652;";
                }
            }
        });
    });


    // --- Logout Confirmation Logic ---
    const logoutLink = document.getElementById('logoutLink');

    if (logoutLink) {
        logoutLink.addEventListener('click', function (event) {
            event.preventDefault(); // Stop the link from doing anything by default

            // Get the actual logout URL from the data attribute
            const logoutUrl = logoutLink.dataset.logoutUrl;
            const csrfToken = getCsrfToken(); // *** NEED A FUNCTION TO GET CSRF TOKEN ***

            if (!logoutUrl) {
                console.error("Logout URL data attribute is missing!");
                alert("Logout failed: Configuration error."); // Inform user
                return;
            }
            if (!csrfToken) {
                console.error("CSRF token not found for logout form submission.");
                alert("Logout failed: Security token missing.");
                return;
            }

            // Show the confirmation dialog
            const isConfirmed = confirm('Are you sure you want to log out?');

            if (isConfirmed) {
                // If user clicks "OK", redirect the browser to the logout URL
                // Create a hidden form
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = logoutUrl;
                form.style.display = 'none'; // Hide the form

                // Add CSRF token input
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrfToken;
                form.appendChild(csrfInput);

                // Append form to body and submit
                document.body.appendChild(form);
                form.submit(); // Submits the form via POST
            }
            // If user clicks "Cancel", do nothing.
        });
    } else {
        console.warn("Logout link element not found."); // Helpful for debugging
    }

    // --- Function to get CSRF Token (ensure this exists) ---
    function getCsrfToken() {
        const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfCookie ? csrfCookie.split('=')[1] : null;
    }
});


// add click event to all top-level links (direct children of .sidebar)
var topLevelLinks = document.querySelectorAll(".sidebar > a");
topLevelLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        // when these links are clicked, close all sub
        document.querySelectorAll(".submenu").forEach(function (submenu) {
            submenu.style.display = "none";
            // update the arrow indicator to the default down state
            var parentLink = submenu.previousElementSibling;
            if (parentLink && parentLink.classList.contains("menu-parent")) {
                var arrow = parentLink.querySelector(".arrow");
                if (arrow) {
                    arrow.innerHTML = "&#9662;";
                }
            }
        });
    });
});