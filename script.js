// =======================
// CONFIGURATION & GLOBALS
// =======================

// EmailJS configuration – use the values you provided.
const EMAILJS_USER_ID = "FEvFj-wpLQ1td00DK";       // Your public user ID from EmailJS.
const EMAILJS_SERVICE_ID = "service_m86sfll";         // Your EmailJS service ID.
const EMAILJS_TEMPLATE_ID = "template_7e83ufc";       // Your EmailJS template ID.

// Define your members – every member’s hourly rate is now 15.65.
const members = {
  "0524": { name: "Gerald", clockedIn: false, clockInTime: null, hourlyRate: 15.65 },
  "1125": { name: "Emily",  clockedIn: false, clockInTime: null, hourlyRate: 15.65 },
  "1234": { name: "Test",   clockedIn: false, clockInTime: null, hourlyRate: 15.65 }
};

// Global variable to hold the current keypad callback.
let keypadCallback = null;

// =======================
// DATE FORMATTING FUNCTION
// =======================

/**
 * Formats a Date object into a readable string.
 * For example: "Wednesday, June 18, 2025, 12:20 PM"
 */
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  };
  return date.toLocaleString("en-US", options);
}

// =======================
// PERSISTENCE FUNCTIONS (localStorage)
// =======================

function updateLocalStorage() {
  localStorage.setItem("membersData", JSON.stringify(members));
}

function loadLocalStorage() {
  const stored = localStorage.getItem("membersData");
  if (stored) {
    const storedMembers = JSON.parse(stored);
    for (let key in storedMembers) {
      if (storedMembers[key].clockInTime) {
        storedMembers[key].clockInTime = new Date(storedMembers[key].clockInTime);
      }
      // Check if hourlyRate is missing; if so, set the default.
      if (storedMembers[key].hourlyRate === undefined) {
        storedMembers[key].hourlyRate = 15.65;
      }
    }
    Object.assign(members, storedMembers);
  }
}


// =======================
// KEYPAD FUNCTIONS
// =======================

function openKeypad(callback) {
  keypadCallback = callback;
  const keypadContainer = document.getElementById("keypad-container");
  keypadContainer.style.display = "flex";
  keypadContainer.style.opacity = "1";
  // Clear any previous input.
  document.getElementById("keypad-display").innerText = "";
}

function closeKeypad() {
  const keypadContainer = document.getElementById("keypad-container");
  if (keypadContainer) {
    // Immediately hide the keypad without delay or fade.
    keypadContainer.style.opacity = "0";
    keypadContainer.style.display = "none";
  }
  keypadCallback = null;
}


function setupKeypad() {
  const keypadButtons = document.querySelectorAll(".keypad-btn");
  keypadButtons.forEach(button => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const value = this.dataset.value;
      const display = document.getElementById("keypad-display");
      if (value === "delete") {
        display.innerText = display.innerText.slice(0, -1);
      } else if (value === "clear") {
        display.innerText = "";
      } else {
        display.innerText += value;
      }
    });
  });

  document.getElementById("keypad-submit").addEventListener("click", function (e) {
    e.preventDefault();
    const passkey = document.getElementById("keypad-display").innerText;
    if (keypadCallback) {
      keypadCallback(passkey);
    }
    closeKeypad();
  });
}

// =======================
// STATUS & EMAIL FUNCTIONS
// =======================

function showStatus(message, isSuccess) {
  const statusEl = document.getElementById("status");
  statusEl.style.opacity = "1";
  statusEl.innerText = message;
  statusEl.classList.remove("success", "error");
  statusEl.classList.add(isSuccess ? "success" : "error");
  setTimeout(() => {
    statusEl.style.opacity = "0";
    setTimeout(() => {
      statusEl.innerText = "";
      statusEl.classList.remove("success", "error");
    }, 1000);
  }, 1500);
}

/**
 * Sends an email using EmailJS upon clock-out.
 * The email includes the member's name, start time, end time, worked time,
 * hourly rate, and total earned.
 */
function sendEmailUsingEmailJS(name, startTime, endTime, workedSeconds, hourlyRate, totalEarned) {
  const templateParams = {
    member_name: name,
    start_time: startTime,
    end_time: endTime,
    worked_time: workedSeconds + " seconds",
    hourly_rate: hourlyRate,
    total_earned: "$" + totalEarned
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(function(response) {
      console.log("SUCCESS!", response.status, response.text);
    }, function(error) {
      console.error("FAILED...", error);
    });
}

// =======================
// CLOCK IN/OUT FUNCTION
// =======================

function clockInOut() {
  openKeypad(function(passkey) {
    if (members.hasOwnProperty(passkey)) {
      let member = members[passkey];
      const currentTime = new Date();
      const formattedTime = formatDate(currentTime);
      if (!member.clockedIn) {
        // Clock-In: record the clock-in time.
        member.clockedIn = true;
        member.clockInTime = currentTime;
        showStatus(`${member.name} Clocked In at ${formattedTime}`, true);
        // No email is sent on clock-in.
      } else {
        // Clock-Out: calculate worked seconds and earnings.
        member.clockedIn = false;
        if (!member.clockInTime) {
          showStatus("Error: missing clock-in time.", false);
          return;
        }
        const workedSeconds = Math.round((currentTime - member.clockInTime) / 1000);
        const startTimeFormatted = formatDate(member.clockInTime);
        const workedHours = workedSeconds / 3600;
        const totalEarned = workedHours * member.hourlyRate;
        const totalEarnedRounded = Math.round(totalEarned * 100) / 100;
        member.clockInTime = null;
        showStatus(
          `${member.name} Clocked Out at ${formattedTime}. Worked: ${workedSeconds} seconds, Earned: $${totalEarnedRounded}`,
          true
        );
        // Send email notification using EmailJS.
        sendEmailUsingEmailJS(
          member.name,
          startTimeFormatted,
          formattedTime,
          workedSeconds,
          member.hourlyRate,
          totalEarnedRounded
        );
      }
      updateLocalStorage();
    } else {
      showStatus("Invalid passkey", false);
    }
  });
}

// =======================
// BACKGROUND VIDEO & CURVED TITLE FUNCTIONS
// =======================

function initializeBackgroundVideo() {
  let video = document.createElement("video");
  video.src = "background.mp4"; // Ensure the video file is in the correct location.
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.setAttribute("playsinline", "true");
  video.style.position = "absolute";
  video.style.top = "0";
  video.style.left = "0";
  video.style.width = "100vw";
  video.style.height = "100vh";
  video.style.objectFit = "cover";
  video.style.zIndex = "-1";
  document.body.prepend(video);
}

function createCurvedTitle() {
  const title = "QUARTZ";
  const lettersGroup = document.getElementById("letters");
  const path = document.getElementById("curve");
  if (!lettersGroup || !path) return;
  const pathLength = path.getTotalLength();
  const spacing = pathLength / (title.length + 1);
  for (let i = 0; i < title.length; i++) {
    const offset = spacing * (i + 1);
    const point = path.getPointAtLength(offset);
    const nextPoint = path.getPointAtLength(offset + 1);
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
    const letterElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    letterElem.setAttribute("x", point.x);
    letterElem.setAttribute("y", point.y);
    letterElem.setAttribute("font-size", "5em");
    letterElem.setAttribute("font-family", "Poppins");
    letterElem.setAttribute("fill", "white");
    letterElem.setAttribute("text-anchor", "middle");
    letterElem.textContent = title[i];
    letterElem.style.setProperty("--i", i);
    letterElem.classList.add("letter");
    letterElem.style.cursor = "pointer";
    letterElem.setAttribute("transform", `rotate(${angle}, ${point.x}, ${point.y})`);
    letterElem.addEventListener("mouseenter", function () {
      const allLetters = document.querySelectorAll("#letters text");
      allLetters.forEach(letter => {
        letter.classList.add("wave");
        letter.addEventListener("animationend", () => {
          letter.classList.remove("wave");
        }, { once: true });
      });
    });
    lettersGroup.appendChild(letterElem);
  }
}

// =======================
// INITIALIZATION ON PAGE LOAD
// =======================

window.onload = function() {
  loadLocalStorage();
  initializeBackgroundVideo();
  createCurvedTitle();
  setupKeypad();
};
