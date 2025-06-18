// Global object to track members' status and clock times
const members = {
  "0524": { name: "Gerald", clockedIn: false, clockInTime: null },
  "1125": { name: "Emily", clockedIn: false, clockInTime: null },
  "0211": { name: "Rachel", clockedIn: false, clockInTime: null }
};

/**
 * Handles member clock in/out. When a valid passkey is entered, it toggles the clock status,
 * calculates time worked if clocking out, and sends an email notification using FormSubmit.
 */
function clockInOut() {
  openKeypad(function(passkey) {
    if (members.hasOwnProperty(passkey)) {
      let member = members[passkey];

      // Get current timestamp (ISO format for precision)
      const currentTime = new Date();
      const formattedTime = currentTime.toISOString(); // Example: "2025-06-17T21:04:30.123Z"

      if (!member.clockedIn) {
        // CLOCKING IN
        member.clockedIn = true;
        member.clockInTime = currentTime; // Store clock-in time
        showStatus(`${member.name} Clocked In at ${formattedTime}`, true);
        sendEmail(member.name, formattedTime, "Clocked In"); // Send clock-in email
      } else {
        // CLOCKING OUT
        member.clockedIn = false;

        // Calculate total time worked in seconds
        const timeWorkedSeconds = Math.round((currentTime - member.clockInTime) / 1000);
        member.clockInTime = null; // Reset stored time

        showStatus(`${member.name} Clocked Out at ${formattedTime}. Worked: ${timeWorkedSeconds} seconds`, true);
        sendEmail(member.name, formattedTime, "Clocked Out", timeWorkedSeconds); // Send clock-out email
      }
    } else {
      showStatus("Invalid passkey", false);
    }
  });
}

/**
 * Sends an email via FormSubmit when a member clocks in or out.
 * Includes time started and (if clocking out) total worked time.
 */
function sendEmail(name, timestamp, status, workedSeconds = null) {
  // Create a hidden form dynamically
  const form = document.createElement("form");
  form.action = "https://formsubmit.co/el/coceta"; // Replace with actual recipient email
  form.method = "POST";

  // Subject
  const subject = document.createElement("input");
  subject.type = "hidden";
  subject.name = "_subject";
  subject.value = `Member ${status} Notification: ${name}`;
  form.appendChild(subject);

  // Member Name
  const nameInput = document.createElement("input");
  nameInput.type = "hidden";
  nameInput.name = "member_name";
  nameInput.value = name;
  form.appendChild(nameInput);

  // Clock Time
  const timeInput = document.createElement("input");
  timeInput.type = "hidden";
  timeInput.name = "clock_time";
  timeInput.value = timestamp;
  form.appendChild(timeInput);

  // Total Time Worked (if applicable)
  if (workedSeconds !== null) {
    const workedInput = document.createElement("input");
    workedInput.type = "hidden";
    workedInput.name = "worked_time";
    workedInput.value = `${workedSeconds} seconds`;
    form.appendChild(workedInput);
  }

  // Prevent CAPTCHA prompt and redirect users after submission
  const captchaInput = document.createElement("input");
  captchaInput.type = "hidden";
  captchaInput.name = "_captcha";
  captchaInput.value = "false";
  form.appendChild(captchaInput);

  const redirectInput = document.createElement("input");
  redirectInput.type = "hidden";
  redirectInput.name = "_next";
  redirectInput.value = "index.html"; // Redirect after submission
  form.appendChild(redirectInput);

  // Append the form to the body and submit it
  document.body.appendChild(form);
  form.submit();
}

/**
 * Opens the keypad modal and stores the callback.
 * When the user submits, the entered value is sent to this callback.
 */
function openKeypad(callback) {
  keypadCallback = callback;
  const keypadContainer = document.getElementById("keypad-container");
  // Use display:flex to show the keypad
  keypadContainer.style.display = "flex";
  keypadContainer.style.opacity = "1";
  // Clear any old input
  document.getElementById("keypad-display").innerText = "";
}

/**
 * Closes the keypad modal with a fade-out effect.
 * After fading, the display is set to none.
 */
function closeKeypad() {
  const keypadContainer = document.getElementById("keypad-container");
  keypadContainer.style.opacity = "0";
  setTimeout(() => {
    keypadContainer.style.display = "none";
  }, 300);
  keypadCallback = null;
}

/**
 * Displays a status message (e.g., "Access granted" or "Access denied")
 * and then fades it out.
 */
function showStatus(message, isSuccess) {
  const statusEl = document.getElementById("status");
  statusEl.style.opacity = '1';
  statusEl.innerText = message;
  statusEl.classList.remove("success", "error");
  
  if (isSuccess) {
    statusEl.classList.add("success");
  } else {
    statusEl.classList.add("error");
  }
  
  setTimeout(() => {
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.innerText = '';
      statusEl.classList.remove("success", "error");
    }, 1000);
  }, 1500);
}

/**
 * New function: Clock In/Out for members.
 * Opens the keypad, then checks the entered passkey against the members object.
 * If found, toggles the clock state and displays "[Member Name] Clocked In" (or Out); otherwise, shows an error.
 */
function clockInOut() {
  openKeypad(function(passkey) {
    if (members.hasOwnProperty(passkey)) {
      let member = members[passkey];
      // Toggle the clockedIn status
      member.clockedIn = !member.clockedIn;
      const statusText = member.clockedIn ? "Clocked In" : "Clocked Out";
      showStatus(`${member.name} ${statusText}`, true);
    } else {
      showStatus("Invalid passkey", false);
    }
  });
}

/* ============
   Existing functions from before
   (Background video, curved title, keypad setup, etc.)
============ */

/**
 * Global variable to store the current keypad callback function.
 */
let keypadCallback = null;

/**
 * Injects a full-screen background video.
 */
function initializeBackgroundVideo() {
  let video = document.createElement("video");
  video.src = "background.mp4"; // Ensure your video file is in the correct location
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

/**
 * Creates the curved "QUARTZ" title with individual letters.
 */
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
    
    letterElem.addEventListener("mouseenter", function() {
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

/**
 * Sets up event listeners for the keypad buttons.
 */
function setupKeypad() {
  const keypadButtons = document.querySelectorAll(".keypad-btn");
  
  keypadButtons.forEach(button => {
    button.addEventListener("click", function(e) {
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
  
  document.getElementById("keypad-submit").addEventListener("click", function(e) {
    e.preventDefault();
    const password = document.getElementById("keypad-display").innerText;
    if (keypadCallback) {
      keypadCallback(password);
    }
    closeKeypad();
  });
}

/**
 * Runs all initialization functions when the page loads.
 */
window.onload = function () {
  initializeBackgroundVideo();
  createCurvedTitle();
  setupKeypad();
};
