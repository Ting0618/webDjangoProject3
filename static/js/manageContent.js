document.addEventListener("DOMContentLoaded", function () {
    const eventTableBody = document.getElementById("eventTableBody");
    let events = JSON.parse(localStorage.getItem("events")) || [];

    function loadEvents() {
        eventTableBody.innerHTML = ""; // clear the table

        // populate the table with events
        events.forEach((event, index) => {
            let row = eventTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${event.title}</td>
                <td>${event.author}</td>
                <td>${event.date}</td>
                <td>${event.status}</td>
                <td>
                    <button class="btn btn-edit" data-id="${event.id}">Edit</button>
                    <button class="btn btn-delete" data-id="${event.id}">Delete</button>
                    <button class="btn ${event.status === 'Draft' ? 'btn-publish' : 'btn-revoke'}" data-id="${event.id}">
                        ${event.status === 'Draft' ? 'Publish' : 'Revoke'}
                    </button>
                </td>
            `;
        });
    }

    // listen to delete button
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-delete")) {
            const id = e.target.getAttribute("data-id");
            events = events.filter(event => event.id !== id);
            localStorage.setItem("events", JSON.stringify(events));
            loadEvents();
        }
    });

    // listen to publish/revoke button
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-publish") || e.target.classList.contains("btn-revoke")) {
            const id = e.target.getAttribute("data-id");
            events = events.map(event => 
                event.id === id ? { ...event, status: event.status === "Draft" ? "Published" : "Draft" } : event
            );
            localStorage.setItem("events", JSON.stringify(events));
            loadEvents();
        }
    });

    loadEvents(); // load events when the page is loaded
});

document.addEventListener("DOMContentLoaded", function () {
    const eventTableBody = document.getElementById("eventTableBody");
    let events = JSON.parse(localStorage.getItem("events")) || [];

    // format date and time
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return ""; // handle empty date
        const dateObj = new Date(dateTimeStr);
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // load events
    function loadEvents() {
        eventTableBody.innerHTML = ""; // clear the table
        // populate the table with events
        events.forEach((event, index) => {
            let row = eventTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${event.title}</td>
                <td>${event.author}</td>
                <td>${formatDateTime(event.date)}</td>
                <td>${event.status}</td>
                <td>
                    <button class="btn btn-edit" data-id="${event.id}">Edit</button>
                    <button class="btn btn-delete" data-id="${event.id}">Delete</button>
                    <button class="btn ${event.status === 'Draft' ? 'btn-publish' : 'btn-revoke'}" data-id="${event.id}">
                        ${event.status === 'Draft' ? 'Publish' : 'Revoke'}
                    </button>
                </td>
            `;
        });
    }
    loadEvents();
});