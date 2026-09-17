// 🔐 Get logged in user from localStorage (from user.js)
// const currentUser = JSON.parse(localStorage.getItem("currentUser"));


const isAdmin = currentUser?.role?.toLowerCase() === "admin";
// const isAdmin = currentUser?.role?.toLowerCase() === "admin";
if(!currentUser){
  alert("User not logged in");
  window.location.href = "login.html";
}
console.log("Logged user:", currentUser);
console.log("Is Admin:", isAdmin);

// GLOBAL VARIABLES (must be outside DOMContentLoaded)
let checkInBtn, checkOutBtn, timerText, statusText;

let checkInTime = "";
// let records = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
let alreadyCheckedInToday = false;
let timerInterval = null;
let secondsWorked = 0;

// Office timing
const officeStartHour = 9;
const officeStartMin = 30;

function formatDisplayDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatInputDateToDisplay(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

async function fetchAttendanceRecords() {
  const response = await fetch("/api/attendance");
  return await response.json();
}

async function fetchEmployees() {
  const response = await fetch("/api/employees");
  return await response.json();
}

async function saveAttendanceRecord(record) {
  const response = await fetch("/api/attendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  if (!response.ok) {
    throw new Error("Failed to save attendance");
  }

  return await response.json();
}


// 🚀 PAGE LOAD
document.addEventListener("DOMContentLoaded", function () {

  renderTable();


  

  // grab elements AFTER page loads
  checkInBtn = document.getElementById("checkInBtn");
  checkOutBtn = document.getElementById("checkOutBtn");
  timerText = document.getElementById("workTimer");
  statusText = document.getElementById("todayStatus");

  // ROLE VIEW SWITCH
  if(isAdmin){
    document.getElementById("employeeAttendance").style.display = "none";
    document.getElementById("adminAttendance").style.display = "block";

  

    loadAdminEmployeeDropdown();   // ⭐ ADD THIS LINE
  }else{
    document.getElementById("employeeAttendance").style.display = "block";
    document.getElementById("adminAttendance").style.display = "none";
  }

  document.getElementById("todayDate").innerText =
      new Date().toDateString();

  


  // attach button events
  if(checkInBtn) checkInBtn.addEventListener("click", checkIn);
  if(checkOutBtn) checkOutBtn.addEventListener("click", checkOut);

  // Live clock
setInterval(()=>{
  document.getElementById("liveClock").innerText =
      new Date().toLocaleTimeString();
},1000);

// Fill employee name
document.getElementById("empNameBig").innerText = currentUser.name;
document.getElementById("empAvatarBig").innerText = currentUser.name[0];


  // 🔄 Restore running timer if user already checked in
const savedSession = JSON.parse(localStorage.getItem("activeCheckIn"));

if(savedSession && savedSession.employee === currentUser.name){

  checkInTime = new Date(savedSession.time);
  alreadyCheckedInToday = true;

  if(checkInBtn) checkInBtn.disabled = true;
  if(checkOutBtn) checkOutBtn.disabled = false;

  startTimerFromSavedTime();
}

});


function startTimerFromSavedTime(){

  const now = new Date();
  secondsWorked = Math.floor((now - checkInTime) / 1000);

  timerInterval = setInterval(() => {
    secondsWorked++;

    const hrs = String(Math.floor(secondsWorked / 3600)).padStart(2,'0');
    const mins = String(Math.floor((secondsWorked % 3600) / 60)).padStart(2,'0');
    const secs = String(secondsWorked % 60).padStart(2,'0');

    timerText.innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}


// 🟢 CHECK IN
function checkIn() {

  if (alreadyCheckedInToday) {
    alert("You already checked in today!");
    return;
  }

  const now = new Date();
  checkInTime = now;


  // show start time on UI
document.getElementById("startTimeText").innerText =
      now.toLocaleTimeString();

  // 💾 Save active session
localStorage.setItem("activeCheckIn", JSON.stringify({
  time: now,
  employee: currentUser.name
}));

  alreadyCheckedInToday = true;
  checkInBtn.disabled = true;
  checkOutBtn.disabled = false;

  statusText.innerText = "Checked in at " + now.toLocaleTimeString();

  // ▶ START LIVE TIMER
  secondsWorked = 0;
  timerInterval = setInterval(() => {
    secondsWorked++;

    const hrs = String(Math.floor(secondsWorked / 3600)).padStart(2,'0');
    const mins = String(Math.floor((secondsWorked % 3600) / 60)).padStart(2,'0');
    const secs = String(secondsWorked % 60).padStart(2,'0');

    timerText.innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}


// 🔴 CHECK OUT
async function checkOut() {

  if (!checkInTime) {
    alert("Please check in first!");
    return;
  }

  clearInterval(timerInterval);

  const now = new Date();
  // show end time on UI
document.getElementById("endTimeText").innerText =
      now.toLocaleTimeString();

  const diffMs = now - checkInTime;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const lateTime = new Date();
  lateTime.setHours(officeStartHour, officeStartMin, 0);

  let status = "On Time";
  if (checkInTime > lateTime) status = "Late";

  const today = formatDisplayDate(new Date());

  await saveAttendanceRecord({
    employee: currentUser.name,
    date: today,
    check_in: checkInTime.toLocaleTimeString(),
    check_out: now.toLocaleTimeString(),
    status: "Present"
  });
  localStorage.removeItem("activeCheckIn");
  statusText.innerText = "Checked out at " + now.toLocaleTimeString();

// refresh table + monthly stats after checkout
renderTable();

  checkInTime = "";
  checkOutBtn.disabled = true;
  timerText.innerText = "00:00:00";
  secondsWorked = 0;

  if(isAdmin) renderAdminTable();
  document.getElementById("startTimeText").innerText = "--:--";
document.getElementById("endTimeText").innerText = "--:--";
}


// 👨‍💼 ADMIN TABLE
// async function renderTable(){

//   const response = await fetch("/api/attendance");

//   const records = await response.json();

//   const tbody = document.getElementById("attendanceBody");

//   if(!tbody) return;

//   tbody.innerHTML = "";

//   const myRecords = records.filter(r => r.employee === currentUser.name);

//   if(myRecords.length === 0){
//     tbody.innerHTML = "<tr><td colspan='4'>No attendance yet</td></tr>";
//     return;
//   }

//   myRecords.reverse().forEach(r=>{
//     tbody.innerHTML += `
//       <tr>
//         <td>${r.date}</td>
//         <td>${r.check_in}</td>
//         <td>${r.check_out}</td>
//         <td>${r.status}</td>
//       </tr>
//     `;
//   });
// }

async function renderTable(){

  // If admin, don't load employee table
  if(isAdmin) return;

  const records = await fetchAttendanceRecords();

  console.log("Attendance data:", records);

  const tbody = document.getElementById("attendanceBody");

  if(!tbody) return;

  tbody.innerHTML = "";

  const myRecords = records.filter(r => r.employee === currentUser.name);

  if(myRecords.length === 0){
    tbody.innerHTML = "<tr><td colspan='4'>No attendance yet</td></tr>";
    return;
  }

  myRecords.reverse().forEach(r=>{
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.check_in}</td>
        <td>${r.check_out}</td>
        <td>${r.status}</td>
      </tr>
    `;
  });
}

function showAdminTab(tab){

  document.getElementById("adminDailyTab").classList.add("hidden");
  document.getElementById("adminMonthlyTab").classList.add("hidden");


  if(tab === "daily")
    document.getElementById("adminDailyTab").classList.remove("hidden");

  if(tab === "monthly")
    document.getElementById("adminMonthlyTab").classList.remove("hidden");
}

// ================= ADMIN ATTENDANCE MODULE =================

// Load employees into dropdown
async function loadAdminEmployeeDropdown(){

  const employees = await fetchEmployees();

  const markSelect = document.getElementById("adminEmployeeSelect");
  const monthlySelect = document.getElementById("monthlyEmployeeSelect");

  if(markSelect) markSelect.innerHTML = "<option value=''>Select Employee</option>";
  if(monthlySelect) monthlySelect.innerHTML = "<option value=''>Select Employee</option>";

  employees.forEach(emp => {

    if(emp.role === "Employee"){

      if(markSelect)
        markSelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;

      if(monthlySelect)
        monthlySelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;

    }

  });

}

async function submitAdminAttendance(){

  const employee = document.getElementById("adminEmployeeSelect").value;
  const date = document.getElementById("adminDate").value;
  const checkIn = document.getElementById("adminCheckIn").value;
  const checkOut = document.getElementById("adminCheckOut").value;
  const status = document.getElementById("adminStatus").value;

  if(!employee || !date){
    alert("Please select employee and date");
    return;
  }

  const normalizedDate = formatInputDateToDisplay(date);
  const records = await fetchAttendanceRecords();
  const exists = records.find(r => r.employee === employee && r.date === normalizedDate);

  if(exists){
    alert("Attendance already marked for this employee on this date.");
    return;
  }

  await saveAttendanceRecord({
    employee: employee,
    date: normalizedDate,
    check_in: checkIn || "-",
    check_out: checkOut || "-",
    status: status
  });

  alert("Attendance saved successfully!");

  // Clear form
  document.getElementById("adminDate").value = "";
  document.getElementById("adminCheckIn").value = "";
  document.getElementById("adminCheckOut").value = "";
}
async function loadDailyView(){

  const date = document.getElementById("dailyViewDate").value;
  const tbody = document.getElementById("dailyViewBody");

  if(!date){
    alert("Please select a date");
    return;
  }

  const employees = await fetchEmployees();
  const records = await fetchAttendanceRecords();

  tbody.innerHTML = "";

  employees
  .filter(emp => emp.role === "Employee")
  .forEach(emp => {

    const displayDate = formatInputDateToDisplay(date);
    const record = records.find(r =>
        r.employee === emp.name && r.date === displayDate
    );

    let status = record ? record.status : "Absent";

    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${status}</td>
      </tr>
    `;

  });

}

async function loadMonthlyCalendar(){

  const employee = document.getElementById("monthlyEmployeeSelect").value;
  const monthValue = document.getElementById("monthlySelect").value;

  if(!employee || !monthValue){
    alert("Select employee & month");
    return;
  }

  const records = await fetchAttendanceRecords();

  const grid = document.getElementById("calendarGrid");

  const date = new Date(monthValue);
  const month = date.getMonth();
  const year = date.getFullYear();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  let present=0, absent=0, half=0;

  grid.innerHTML="";

  for(let d=1; d<=daysInMonth; d++){

    const fullDate = formatDisplayDate(new Date(year, month, d));

    const record = records.find(r =>
        r.employee === employee && r.date === fullDate
    );

    let status = "Absent";
    if(record) status = record.status;

    if(status==="Present") present++;
    if(status==="Absent") absent++;
    if(status==="Half-day") half++;

    let borderClass = "status-absent-border";

    if(status === "Present") borderClass = "status-present-border";
    if(status === "Half-day") borderClass = "status-half-border";

    grid.innerHTML += `
      <div class="day-box ${borderClass}">
        <b>${d}</b>
      </div>
    `;
  }

  document.getElementById("statPresent").innerText = present;
  document.getElementById("statAbsent").innerText = absent;
  document.getElementById("statHalf").innerText = half;
}

// ================= EMPLOYEE RECENT TABLE =================
// function renderTable(){

//   const tbody = document.getElementById("attendanceBody");
//   if(!tbody) return;

//   const myRecords = records.filter(r => r.employee === currentUser.name);

//   tbody.innerHTML = "";

//   if(myRecords.length === 0){
//     tbody.innerHTML = "<tr><td colspan='4'>No attendance yet</td></tr>";
//     return;
//   }

//   // show latest first
//   myRecords.reverse().slice(0,7).forEach(r=>{
//     tbody.innerHTML += `
//       <tr>
//         <td>${r.date}</td>
//         <td>${r.in}</td>
//         <td>${r.out}</td>
//         <td>${r.status}</td>
//       </tr>
//     `;
//   });
// }

