const API_URL = "https://script.google.com/macros/s/AKfycbzCuMN24bHLJo9FL_Ii_L9rg5TU7a9TASFWTorpbiMGtzgKZDSWpjQxevOApaHy41QEog/exec";


document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  if (!role) {
    window.location.replace("index.html");
    return;
  }

  const isOp = role === "operator";
  const calendarEl = document.getElementById("calendar");

  fetch(API_URL)
    .then(res => res.json())
    .then(events => {
      console.log("✅ Fetched events from Sheet:", events);

      // Validate each event
      const validEvents = events.filter(ev =>
        ev.title && ev.start && ev.end
      );

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "timeGridWeek",
        editable: isOp,
        selectable: isOp,
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        events: validEvents,
        select: function (info) {
          if (!isOp) return;

          const title = prompt("Enter a title:");
          const type = prompt("Enter a type (Shift, Order, etc):");

          if (title && type) {
            const eventData = {
              title: `[${type}] ${title}`,
              start: info.startStr,
              end: info.endStr,
              allDay: info.allDay
            };

            calendar.addEvent(eventData);

            fetch(API_URL, {
  method: "POST",
  mode: "no-cors",  // 👈 THIS BYPASSES THE CORS CHECK
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title,
    type,
    start: info.startStr,
    end: info.endStr,
    allDay: info.allDay
  })
});

          }
          calendar.unselect();
        }
      });

      calendar.render();
    })
    .catch(error => {
      console.error("🚫 Failed to load events:", error);
      calendarEl.innerHTML = "<p style='color:red;'>Failed to load schedule. Try again later.</p>";
    });
});
