document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    // listen to all input fields
    const inputs = document.querySelectorAll("input, select");
    // --- Alert Box Logic (copy showAlert and hideAlert from previous step) ---
    const customAlertOverlay = document.getElementById('customAlertOverlay');
    const successAlertBox = document.getElementById('customSuccessAlert');
    const errorAlertBox = document.getElementById('customErrorAlert');
    const successAlertText = document.getElementById('customSuccessAlertText');
    const errorAlertText = document.getElementById('customErrorAlertText');
    let alertTimeout = null;

    function showAlert(type, message) {
        if (!customAlertOverlay || !successAlertBox || !errorAlertBox || !successAlertText || !errorAlertText) {
            return;
        }
        const alertBoxToShow = (type === 'success') ? successAlertBox : errorAlertBox;
        const alertTextElement = (type === 'success') ? successAlertText : errorAlertText;
        const alertBoxToHide = (type === 'success') ? errorAlertBox : successAlertBox;
        alertBoxToHide.style.display = 'none';
        alertBoxToHide.style.animation = '';
        alertTextElement.textContent = message;
        clearTimeout(alertTimeout);
        customAlertOverlay.style.display = 'block';
        alertBoxToShow.style.display = 'flex';
        alertBoxToShow.style.animation = 'fadeIn 0.5s ease-out forwards';
        alertTimeout = setTimeout(() => {
            hideAlert();
        }, 3000); // Auto-hide after 3s
    }

    function hideAlert() {
        // ... (Paste the full hideAlert function implementation here) ...
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

    if (customAlertOverlay) {
        customAlertOverlay.addEventListener('click', hideAlert);
    }


    // --- AJAX Form Submission ---
    const registrationForm = document.getElementById('registrationForm');
    const generalErrorDiv = document.getElementById('general-error');

    if (registrationForm) {
        registrationForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission

            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            generalErrorDiv.textContent = '';

            const formData = new FormData(registrationForm);
            const submitButton = registrationForm.querySelector('button[type="submit"]');
            const apiUrl = registrationForm.action; // Get URL from form's action attribute
            const csrfToken = formData.get('csrfmiddlewaretoken'); // Get CSRF token from form data

            submitButton.disabled = true; // Disable button during request
            submitButton.textContent = 'Registering...';

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest', // Indicate AJAX
                },
                body: formData // Send form data directly
            })
                .then(response => response.json().then(data => ({ok: response.ok, status: response.status, data})))
                .then(({ok, status, data}) => {
                    if (ok && data.success) {
                        // --- SUCCESS ---
                        showAlert('success', data.message || 'Registration successful! Redirecting...');

                        // Redirect after a short delay (e.g., 2 seconds) to allow user to see the alert
                        setTimeout(() => {
                            window.location.href = data.redirect_url; // Get redirect URL from response
                        }, 1500); // 1500ms = 1.5 seconds

                    } else {
                        // --- FAILURE ---
                        let errorMessage = data.message || 'Registration failed. Please check the details below.';
                        if (data.errors) {
                            // Display specific field errors
                            for (const field in data.errors) {
                                const errorElement = document.getElementById(`${field}-error`);
                                if (errorElement) {
                                    errorElement.textContent = data.errors[field].join(' '); // Join multiple errors for a field
                                } else {
                                    // If no specific field, add to general error
                                    errorMessage += `\n${field}: ${data.errors[field].join(' ')}`;
                                }
                            }
                            generalErrorDiv.textContent = "Please correct the errors above.";
                            showAlert('error', 'Registration failed. See errors above.'); // Show generic error alert
                        } else {
                            // Display general error message
                            generalErrorDiv.textContent = errorMessage;
                            showAlert('error', errorMessage);
                        }
                    }
                })
                .catch(error => {
                    console.error('Registration fetch error:', error);
                    generalErrorDiv.textContent = 'An unexpected error occurred. Please try again.';
                    showAlert('error', 'An unexpected error occurred.');
                })
                .finally(() => {
                    // Re-enable button unless redirecting soon
                    // We don't re-enable here because we redirect on success
                    if (!generalErrorDiv.textContent && !document.querySelector('.error-message:not(:empty)')) {
                        // If there were no errors shown, keep button disabled during redirect delay
                    } else {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Register Now';
                    }
                });
        });
    } else {
        console.error("Registration form not found!");
    }

    // validate fields when user types
    inputs.forEach(input => {
        input.addEventListener("input", function () {
            validateField(input);
        });
    });

    form.addEventListener("submit", function (event) {
        let isValid = true;

        // traverse all fields to check if there is any error
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        // if there is any error, prevent form submission
        if (!isValid) {
            event.preventDefault();
        }
    });

    function validateField(input) {
        const value = input.value.trim();
        let errorMessage = "";

        // remove old error message
        removeError(input);

        // validate rules
        if (value === "") {
            errorMessage = "This field cannot be empty.";
        } else if (input.id === "email" && !value.endsWith("@gmail.com")) {
            errorMessage = "Email must end with '@gmail.com'.";
        } else if (input.id === "phone" && !/^\d{9}$/.test(value)) {
            errorMessage = "Phone number must be 9 digits.";
        } else if (input.id === "zipcode" && !/^\d{5}$/.test(value)) {
            errorMessage = "ZIP Code must be 5 digits.";
        } else if (input.id === "confirm-password") {
            const password = document.getElementById("password").value.trim();
            if (value !== password) {
                errorMessage = "Passwords do not match.";
            }
        }

        // if there is an error, show the error message
        if (errorMessage) {
            showError(input, errorMessage);
            return false;
        }

        return true;
    }

    // show error message
    function showError(input, message) {
        removeError(input);

        const error = document.createElement("div");
        error.className = "error-message";
        error.style.color = "red";
        error.style.fontSize = "12px";
        error.style.marginTop = "5px";
        error.innerText = message;
        input.parentNode.appendChild(error);
    }

    // remove error message
    function removeError(input) {
        const existingError = input.parentNode.querySelector(".error-message");
        if (existingError) {
            existingError.remove();
        }
    }
});