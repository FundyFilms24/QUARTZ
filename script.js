// =======================
// CONFIG & GLOBALS
// =======================

const EMAILJS_USER_ID     = "FEvFj-wpLQ1td00DK";
const EMAILJS_SERVICE_ID  = "service_m86sfll";
const EMAILJS_TEMPLATE_ID = "template_7e83ufc";

const members = {
  "0524": { name:"Gerald", clockedIn:false, clockInTime:null, hourlyRate:15.65 },
  "1125": { name:"Emily", clockedIn:false, clockInTime:null, hourlyRate:15.65 },
  "1234": { name:"Test",  clockedIn:false, clockInTime:null, hourlyRate:15.65 }
};

// =======================
// STORAGE HELPERS
// =======================

function updateLocalStorage() {
  localStorage.setItem("membersData", JSON.stringify(members));
}

function loadLocalStorage() {
  const stored = localStorage.getItem("membersData");
  if (!stored) return;
  const data = JSON.parse(stored);
  for (let k in data) {
    if (data[k].clockInTime) {
      data[k].clockInTime = new Date(data[k].clockInTime);
    }
    if (data[k].hourlyRate === undefined) {
      data[k].hourlyRate = 15.65;
    }
  }
  Object.assign(members, data);
}

// =======================
// DATE + STATUS
// =======================

function formatDate(date) {
  return date.toLocaleString("en-US", {
    weekday:"long", year:"numeric", month:"long",
    day:"numeric", hour:"numeric", minute:"2-digit",
    hour12:true
  });
}

function showStatus(msg, isSuccess) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.classList.toggle("success", isSuccess);
  el.classList.toggle("error", !isSuccess);
  el.style.opacity = "1";
  setTimeout(() => el.style.opacity = "0", 5_000);
}

// =======================
// EMAIL
// =======================

function sendEmailUsingEmailJS(name, start, end, secs, rate, earned) {
  const params = {
    member_name: name,
    start_time:   start,
    end_time:     end,
    worked_time:  secs + " seconds",
    hourly_rate:  rate,
    total_earned: "$" + earned
  };
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
    .then(r => console.log("Email sent", r))
    .catch(e => console.error("EmailJS error", e));
}

// =======================
// KEYPAD
// =======================

let keypadCallback = null;

function openKeypad(cb) {
  keypadCallback = cb;
  const container = document.getElementById("keypad-container");
  container.style.display = "flex";
  container.style.opacity = "1";
  document.getElementById("keypad-display").innerText = "";
}

function closeKeypad() {
  const c = document.getElementById("keypad-container");
  c.style.opacity = "0";
  setTimeout(() => c.style.display = "none", 300);
  keypadCallback = null;
}

function setupKeypad() {
  document.querySelectorAll(".keypad-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const v = btn.dataset.value;
      const d = document.getElementById("keypad-display");
      if (v === "delete") d.innerText = d.innerText.slice(0,-1);
      else if (v === "clear") d.innerText = "";
      else d.innerText += v;
    });
  });
  document.getElementById("keypad-submit")
    .addEventListener("click", e => {
      e.preventDefault();
      const pass = document.getElementById("keypad-display").innerText;
      if (keypadCallback) keypadCallback(pass);
      closeKeypad();
    });
}

// =======================
// LOGIN SPLASH + AUTH
// =======================

function showLoginSplash(name, target = "schedule.html") {
  document.querySelectorAll(".login-splash").forEach(el => el.remove());
  const s = document.createElement("div");
  s.className = "login-splash";
  s.textContent = `Welcome, ${name}!`;
  document.body.appendChild(s);
  requestAnimationFrame(() => s.style.opacity = "1");
  setTimeout(() => window.location.href = target, 3000);
}

function authenticate(page) {
  openKeypad(pass => {
    const opCode = "2019";
    if (pass === opCode) {
      localStorage.setItem("userRole","operator");
      localStorage.setItem("userName","Operator");
      showLoginSplash("Operator", page + ".html");
    }
    else if (members[pass]) {
      const m = members[pass];
      localStorage.setItem("userRole","employee");
      localStorage.setItem("userName", m.name);
      showLoginSplash(m.name, page + ".html");
    }
    else {
      showStatus("❌ Invalid passkey.", false);
    }
  });
}

// =======================
// CLOCK IN/OUT
// =======================

function clockInOut() {
  openKeypad(pass => {
    if (!members[pass]) {
      showStatus("Invalid passkey", false);
      return;
    }
    const m = members[pass];
    const now = new Date();
    const fmt = formatDate(now);
    if (!m.clockedIn) {
      m.clockedIn = true;
      m.clockInTime = now;
      showStatus(`${m.name} Clocked in at ${fmt}`, true);
    } else {
      m.clockedIn = false;
      if (!m.clockInTime) {
        showStatus("Error: no clock-in time", false);
        return;
      }
      const secs = Math.round((now - m.clockInTime)/1000);
      const hrs  = secs/3600;
      const earned = Math.round(hrs * m.hourlyRate *100)/100;
      showStatus(
        `${m.name} Clocked out at ${fmt}. ` +
        `Worked ${secs}s, Earned $${earned}`,
        true
      );
      sendEmailUsingEmailJS(
        m.name,
        formatDate(m.clockInTime),
        fmt,
        secs,
        m.hourlyRate,
        earned
      );
      m.clockInTime = null;
    }
    updateLocalStorage();
  });
}

// =======================
// VIDEO & CURVED TITLE
// =======================

function initializeBackgroundVideo() {
  const v = document.createElement("video");
  v.src = "background.mp4";
  v.autoplay = v.loop = v.muted = true;
  v.style = `
    position:absolute;top:0;left:0;
    width:100vw;height:100vh;
    object-fit:cover;z-index:-1;
  `;
  document.body.prepend(v);
}

function createCurvedTitle() {
  const title = "QUARTZ";
  const grp = document.getElementById("letters");
  const path= document.getElementById("curve");
  if (!grp||!path) return;
  const L = path.getTotalLength();
  const spacing = L/(title.length+1);
  for (let i=0; i<title.length; i++) {
    const off = spacing*(i+1);
    const p   = path.getPointAtLength(off);
    const np  = path.getPointAtLength(off+1);
    const ang = Math.atan2(np.y-p.y,np.x-p.x)*(180/Math.PI);
    const txt = document.createElementNS("http://www.w3.org/2000/svg","text");
    txt.setAttribute("x",p.x);
    txt.setAttribute("y",p.y);
    txt.setAttribute("font-size","5em");
    txt.setAttribute("font-family","Poppins");
    txt.setAttribute("fill","white");
    txt.setAttribute("text-anchor","middle");
    txt.textContent = title[i];
    txt.setAttribute("transform",`rotate(${ang},${p.x},${p.y})`);
    txt.classList.add("letter");
    txt.addEventListener("mouseenter", () => {
      document.querySelectorAll("#letters text").forEach(l => {
        l.classList.add("wave");
        l.addEventListener("animationend", ()=>l.classList.remove("wave"),{once:true});
      });
    });
    grp.appendChild(txt);
  }
}

// =======================
// BOOTSTRAP ON LOAD
// =======================

document.addEventListener("DOMContentLoaded", () => {
  // 1) storage
  loadLocalStorage();
  // 2) keypad
  setupKeypad();
  // 3) video + title
  initializeBackgroundVideo();
  createCurvedTitle();
  // 4) hook schedule button
  document.getElementById("open-schedule")
          .addEventListener("click", () => authenticate("schedule"));
});
