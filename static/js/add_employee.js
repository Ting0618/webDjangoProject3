
    // --- AJAX Form Submission ---
    // const addEmployeeForm = document.getElementById('addEmployeeForm');
    // const generalErrorDivAjax = document.getElementById('general-error'); // Div for general AJAX errors

    // if (addEmployeeForm) {
    //     addEmployeeForm.addEventListener('submit', function(event) {
    //         event.preventDefault(); // Prevent default submission
    //
    //         // Clear previous JS errors and server errors if needed
    //         document.querySelectorAll('.js-error-message').forEach(el => el.textContent = '');
    //         // document.querySelectorAll('.server-error').forEach(el => el.style.display = 'none'); // Optionally hide server errors
    //         generalErrorDivAjax.textContent = '';
    //         generalErrorDivAjax.style.display = 'none';
    //
    //
    //         const formData = new FormData(addEmployeeForm);
    //         const submitButton = addEmployeeForm.querySelector('button[type="submit"]');
    //         const apiUrl = addEmployeeForm.action;
    //         const csrfToken = formData.get('csrfmiddlewaretoken');
    //
    //         submitButton.disabled = true;
    //         submitButton.textContent = 'Saving...';
    //
    //         fetch(apiUrl, {
    //             method: 'POST',
    //             headers: {
    //                 'X-CSRFToken': csrfToken,
    //                 'X-Requested-With': 'XMLHttpRequest',
    //             },
    //             body: formData
    //         })
    //         .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
    //         .then(({ ok, status, data }) => {
    //             if (ok && data.success) {
    //                 // --- SUCCESS ---
    //                 showAlert('success', data.message || 'Employee added successfully!');
    //                 addEmployeeForm.reset(); // Clear the form fields for the next entry
    //
    //             } else {
    //                 // --- FAILURE ---
    //                  let errorMessage = data.message || 'Failed to add employee. Please check the details.';
    //                  if (data.errors) {
    //                      // Display specific field errors
    //                     for (const field in data.errors) {
    //                         // Find the error span for this field
    //                         const errorElement = addEmployeeForm.querySelector(`[data-field-error="${field}"]`);
    //                         if (errorElement) {
    //                             errorElement.textContent = data.errors[field].join(' ');
    //                         } else if (field === '__all__') {
    //                              // Handle non-field errors (like password mismatch from UserCreationForm)
    //                              generalErrorDivAjax.textContent = data.errors[field].join(' ');
    //                              generalErrorDivAjax.style.display = 'block';
    //                          } else {
    //                              // Fallback to general error if specific span not found
    //                              console.warn(`No error element found for field: ${field}`);
    //                              generalErrorDivAjax.textContent += ` ${field}: ${data.errors[field].join(' ')}`;
    //                              generalErrorDivAjax.style.display = 'block';
    //                          }
    //                     }
    //                      showAlert('error', 'Please correct the errors indicated below.');
    //                  } else {
    //                      // Display general error message if no specific errors given
    //                      generalErrorDivAjax.textContent = errorMessage;
    //                      generalErrorDivAjax.style.display = 'block';
    //                      showAlert('error', errorMessage);
    //                  }
    //             }
    //         })
    //         .catch(error => {
    //             console.error('Add employee fetch error:', error);
    //             generalErrorDivAjax.textContent = 'An unexpected network or server error occurred.';
    //             generalErrorDivAjax.style.display = 'block';
    //             showAlert('error', 'An unexpected error occurred.');
    //         })
    //         .finally(() => {
    //             // Re-enable button after request completes
    //             submitButton.disabled = false;
    //             submitButton.textContent = 'Save Employee';
    //         });
    //     });
    // } else {
    //     console.error("Add Employee form not found!");
    // }

document.addEventListener('DOMContentLoaded', function() {
        const successAlerts = document.querySelectorAll('.alert-success'); // Find Django success messages
        if (successAlerts.length > 0) {
            // Optionally hide the default Django message display
            // successAlerts.forEach(el => el.style.display = 'none');

            // Get message text from the first success alert
            const successMessage = successAlerts[0].textContent.trim();
            // showAlert('success', successMessage || 'Employee added successfully!'); // Trigger custom alert
        }
    });