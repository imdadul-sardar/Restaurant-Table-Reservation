const tableData = [
  { id: 1, seats: 2 }, { id: 2, seats: 2 },
  { id: 3, seats: 4 }, { id: 4, seats: 4 },
  { id: 5, seats: 4 }, { id: 6, seats: 4 },
  { id: 7, seats: 6 }, { id: 8, seats: 6 }
];

const form = document.getElementById("reservationForm");
const tablesContainer = document.getElementById("tables");
const selectedTableText = document.getElementById("selectedTable");
const availabilityText = document.getElementById("availabilityText");
const reservationList = document.getElementById("reservationList");
const message = document.getElementById("message");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const guestsInput = document.getElementById("guests");

let selectedTable = null;

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString().split("T")[0];
dateInput.min = localToday;

function getReservations() {
  return JSON.parse(localStorage.getItem("restaurantReservations") || "[]");
}

function saveReservations(data) {
  localStorage.setItem("restaurantReservations", JSON.stringify(data));
}

function isReserved(tableId) {
  const date = dateInput.value;
  const time = timeInput.value;
  return getReservations().some(r =>
    r.tableId === tableId && r.date === date && r.time === time
  );
}

function renderTables() {
  const guests = Number(guestsInput.value) || 0;
  tablesContainer.innerHTML = "";

  tableData.forEach(table => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "table";
    btn.innerHTML = `Table ${table.id}<small>${table.seats} seats</small>`;

    const reserved = dateInput.value && timeInput.value && isReserved(table.id);

    if (reserved) {
      btn.classList.add("reserved");
      btn.disabled = true;
    } else if (guests > table.seats) {
      btn.disabled = true;
      btn.style.opacity = ".35";
      btn.style.cursor = "not-allowed";
    }

    if (selectedTable === table.id && !reserved && guests <= table.seats) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      selectedTable = table.id;
      selectedTableText.textContent = `Table ${table.id} (${table.seats} seats)`;
      renderTables();
    });

    tablesContainer.appendChild(btn);
  });

  const available = tableData.filter(t =>
    (!dateInput.value || !timeInput.value || !isReserved(t.id)) &&
    (!guests || t.seats >= guests)
  ).length;

  if (!dateInput.value || !timeInput.value) {
    availabilityText.textContent = "Choose a date and time to see availability.";
  } else {
    availabilityText.textContent = `${available} suitable table(s) available for this booking.`;
  }

  if (selectedTable) {
    const table = tableData.find(t => t.id === selectedTable);
    if (!table || isReserved(selectedTable) || (guests && table.seats < guests)) {
      selectedTable = null;
      selectedTableText.textContent = "None";
    }
  }
}

function renderReservations() {
  const reservations = getReservations();

  if (!reservations.length) {
    reservationList.innerHTML = `<div class="empty">No reservations yet. Book your first table above.</div>`;
    return;
  }

  reservationList.innerHTML = reservations.map(r => `
    <div class="reservation-item">
      <div>
        <h3>${escapeHTML(r.name)} · Table ${r.tableId}</h3>
        <p>${r.date} at ${r.time} · ${r.guests} guest(s) · ${escapeHTML(r.phone)}</p>
        <p>Booking ID: ${r.id}</p>
      </div>
      <button class="cancel-btn" onclick="cancelReservation('${r.id}')">Cancel</button>
    </div>
  `).join("");
}

function cancelReservation(id) {
  const updated = getReservations().filter(r => r.id !== id);
  saveReservations(updated);
  renderReservations();
  renderTables();
  showMessage("Reservation cancelled successfully.", "success");
}

window.cancelReservation = cancelReservation;

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  setTimeout(() => {
    message.textContent = "";
    message.className = "message";
  }, 4000);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

[dateInput, timeInput, guestsInput].forEach(input => {
  input.addEventListener("change", () => {
    selectedTable = null;
    selectedTableText.textContent = "None";
    renderTables();
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();

  if (!dateInput.value || !timeInput.value || !guestsInput.value || !selectedTable) {
    showMessage("Please complete all fields and select an available table.", "error");
    return;
  }

  const table = tableData.find(t => t.id === selectedTable);
  const guests = Number(guestsInput.value);

  if (!table || table.seats < guests) {
    showMessage("The selected table does not have enough seats.", "error");
    return;
  }

  if (isReserved(selectedTable)) {
    showMessage("Sorry, that table was just reserved. Please choose another.", "error");
    renderTables();
    return;
  }

  const reservation = {
    id: "TR-" + Date.now().toString().slice(-6),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    date: dateInput.value,
    time: timeInput.value,
    guests,
    tableId: selectedTable
  };

  const reservations = getReservations();
  reservations.push(reservation);
  saveReservations(reservations);

  showMessage(`Reservation confirmed! Your booking ID is ${reservation.id}.`, "success");

  form.reset();
  selectedTable = null;
  selectedTableText.textContent = "None";
  renderTables();
  renderReservations();

  document.getElementById("my-reservations").scrollIntoView({ behavior: "smooth" });
});

renderTables();
renderReservations();
