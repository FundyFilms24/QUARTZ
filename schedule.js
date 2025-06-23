// Global variable to store the selected event for editing.
let selectedEvent = null;

document.addEventListener("DOMContentLoaded", function () {
  // Determine the user role; default is "employee"
  // For testing in operator mode, set localStorage:
  // localStorage.setItem("userRole", "operator");
  const userRole = localStorage.getItem("userRole") || "employee";
  const isOperator = (userRole === "operator");
  console.log("User role:", userRole);

  // For operators, use 'week' view (which supports interactive editing)
  // For regular employees, start with 'month'
  const defaultView = isOperator ? 'week' : 'month';

  let calendarSettings = {
    defaultView: defaultView,
    isReadOnly: !isOperator,        // Operators can edit, employees cannot
    useFormPopup: false,            // We’re using our custom creation/edit handling instead
    useDetailPopup: isOperator,     // Optionally, enable detail popup for operators
    template: {
      time: function(schedule) {
        return `<b style="color: ${schedule.bgColor};">${schedule.title}</b>`;
      }
    }
  };

  // Initialize the calendar.
  window.calendar = new tui.Calendar('#calendar', calendarSettings);

  // Fade in the calendar.
  document.getElementById('calendar').classList.add('loaded');

  // Show view/action buttons for operators.
  if (isOperator) {
    document.getElementById("view-buttons").style.display = "block";
  }

  // Create some sample events (visible to both roles).
  calendar.createSchedules([
    {
      id: '1',
      calendarId: '1',
      title: 'Gerald - Shift',
      category: 'time',
      start: '2025-06-19T09:00:00',
      end: '2025-06-19T17:00:00',
      bgColor: '#42a5f5'
    },
    {
      id: '2',
      calendarId: '2',
      title: 'Emily - Shift',
      category: 'time',
      start: '2025-06-20T12:00:00',
      end: '2025-06-20T20:00:00',
      bgColor: '#66bb6a'
    }
  ]);

  // When a schedule is clicked, assign it to our global variable for editing.
  calendar.on('clickSchedule', function(e) {
    if (isOperator) {
      // Save the selected event
      selectedEvent = e.schedule;
      alert("Selected for editing: " + e.schedule.title + "\nNow click the 'Edit' button to modify this event.");
    } else {
      alert(e.schedule.title);
    }
  });

  // Operator-only: Allow custom event creation via double-click (in interactive views).
  if (isOperator) {
    calendar.on('beforeCreateSchedule', function(e) {
      // Clear the guide overlay.
      e.guide.clearGuideElement();

      // Use prompt dialogs for event details.
      const title = prompt("Enter event title:", "New Event");
      if (!title) return; // Cancel if no title is provided.
      const color = prompt("Enter event colour (hex code):", "#42a5f5") || "#42a5f5";

      const newSchedule = {
        id: String(Date.now()), // use timestamp for unique id.
        calendarId: '1',
        title: title,
        category: 'time',
        start: e.start,
        end: e.end,
        bgColor: color
      };

      calendar.createSchedules([newSchedule]);
    });

    // Listen for updates (drag & drop, resize).
    calendar.on('afterUpdateSchedule', function(e) {
      console.log("Schedule updated (drag/drop or resize):", e);
      // You could persist changes here.
    });

    // Optional: Other event listeners (updating, deleting) can be added here.
  }
});

// Function to edit the selected event.
// This is triggered when the operator clicks the "Edit" button.
function editEvent() {
  if (!selectedEvent) {
    alert("Please click on an event to select it for editing.");
    return;
  }
  
  // Get new details via prompt prompts (replace with a custom modal for production).
  let newTitle = prompt("Enter new title:", selectedEvent.title);
  if (!newTitle) return;
  
  let newColor = prompt("Enter new colour (hex code):", selectedEvent.bgColor) || selectedEvent.bgColor;

  // Use the calendar API to update the event.
  // The updateSchedule method takes (scheduleId, calendarId, updatedProperties)
  window.calendar.updateSchedule(selectedEvent.id, selectedEvent.calendarId, {
    title: newTitle,
    bgColor: newColor
  });
  
  // Clear the selected event after editing.
  selectedEvent = null;
  
  alert("Event was updated!");
}
