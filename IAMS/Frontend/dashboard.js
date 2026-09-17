async function loadAttendance(){

  const res = await fetch("/api/attendance");
  return await res.json();

}


async function loadLeaves(){

  const res = await fetch("/api/leaves");
  return await res.json();

}

async function loadEmployees(){

  const res = await fetch("/api/employees");
  return await res.json();

}

// 🔐 Logged user
const user = JSON.parse(localStorage.getItem("currentUser"));

const adminCards = document.getElementById("adminCards");
const employeeCards = document.getElementById("employeeCards");

// 📦 Load stored data
// const users = JSON.parse(localStorage.getItem("users")) || [];
// const attendance = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
// const leaves = JSON.parse(localStorage.getItem("leaveRequests")) || [];

// 📅 Today's date
const today = new Date().toLocaleDateString();

// 🔥 Load Employees From Backend
async function loadEmployeesFromBackend() {
  try {
    const res = await fetch("/api/employees");
    const data = await res.json();

    const employeeCount = data.filter(e => 
      e.role.toLowerCase() === "employee"
    ).length;

    document.getElementById("totalEmployees").innerText = employeeCount;

  } catch (error) {
    console.error("Error loading employees:", error);
  }
}

// 🔥 Load Holidays From Backend
async function loadHolidaysFromBackend() {
  try {
    const res = await fetch("/api/holidays");
    const holidays = await res.json();

    const container = document.getElementById("upcomingHolidays");
    container.innerHTML = "";

    const today = new Date();

    const upcoming = holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    upcoming.forEach((h, index) => {

      const dateObj = new Date(h.date);
      const month = dateObj.toLocaleString("default", { month: "short" });
      const day = dateObj.getDate();

      container.innerHTML += `
        <div class="holiday-card">
          <div class="holiday-date">
            <span>${month}</span>
            <h3>${day}</h3>
          </div>
          <div class="holiday-info">
            <h4>${h.name}</h4>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error loading holidays:", error);
  }
}

async function loadDashboard(){

  const employees = await loadEmployees();
  const attendance = await loadAttendance();
  const leaves = await loadLeaves();

  const today = new Date().toLocaleDateString();

  if(user.role.toLowerCase() === "admin"){

    adminCards.style.display = "grid";
    employeeCards.style.display = "none";

    // Total Employees
    const employeeCount = employees.filter(e => 
        e.role.toLowerCase() === "employee"
    ).length;

    document.getElementById("totalEmployees").innerText = employeeCount;

    // Present Today
    const todayRecords = attendance.filter(a => 
        a.date === today && a.status !== "Absent"
    );

    const uniqueEmployees = [...new Set(todayRecords.map(a => a.employee))];

    document.getElementById("presentToday").innerText = uniqueEmployees.length;

    // Late Entries
const officeStart = new Date();
officeStart.setHours(9,30,0,0);

const lateEntries = attendance.filter(a => {

  if(a.date !== today) return false;

  const checkInTime = new Date(`${a.date} ${a.check_in}`);

  return checkInTime > officeStart;

});

document.getElementById("lateEntries").innerText = lateEntries.length;

    // On Leave
    const todayDate = new Date();

    const onLeave = leaves.filter(l => {

        if(l.status !== "Approved") return false;

        const from = new Date(l.from_date);
        const to = new Date(l.to_date);

        return todayDate >= from && todayDate <= to;

    });

    document.getElementById("onLeave").innerText = onLeave.length;

  }

  else{

    adminCards.style.display = "none";
    employeeCards.style.display = "grid";

    const myAttendance = attendance.filter(a => a.employee === user.name);
    const myLeaves = leaves.filter(l => l.employee === user.name);

    const uniqueWorkDays = [...new Set(myAttendance.map(a => a.date))];

    document.getElementById("daysWorked").innerText = uniqueWorkDays.length;

    document.getElementById("leavesApplied").innerText = myLeaves.length;

    // Leaves Available
const approvedLeaves = myLeaves.filter(l => l.status === "Approved");

let usedDays = 0;

approvedLeaves.forEach(l => {

  const from = new Date(l.from_date);
  const to = new Date(l.to_date);

  const days = (to - from)/(1000*60*60*24) + 1;

  usedDays += days;

});

const totalQuota = 37; // 12 casual + 10 sick + 15 earned

document.getElementById("leavesRemaining").innerText = totalQuota - usedDays;

    const pending = myLeaves.filter(l => l.status === "Pending");

    document.getElementById("pendingRequests").innerText = pending.length;
    

  }

  // ================= CHARTS =================

const ctx1 = document.getElementById("attendanceChart");
const ctx2 = document.getElementById("leaveChart");

if(ctx1 && ctx2){

  const todayObj = new Date();
  const currentMonth = todayObj.getMonth();
  const currentYear = todayObj.getFullYear();
  const todayDate = todayObj.getDate();

  const employeeList = employees.filter(e => 
      e.role.toLowerCase() === "employee"
  );

  const totalEmployees = employeeList.length;

  const daysArray = [];

  for(let d=1; d<=todayDate; d++){
    const dateObj = new Date(currentYear, currentMonth, d);
    daysArray.push(dateObj.toLocaleDateString());
  }

  const dailyPercentages = daysArray.map(day=>{
    const records = attendance.filter(a =>
        a.date === day && a.status !== "Absent"
    );

    const uniqueEmployees = [...new Set(records.map(r=>r.employee))].length;

    return totalEmployees
      ? Math.round((uniqueEmployees/totalEmployees)*100)
      : 0;
  });

  new Chart(ctx1,{
    type:"line",
    data:{
      labels: daysArray.map(d => new Date(d).getDate()),
      datasets:[{
        label:"Attendance %",
        data: dailyPercentages,
        borderColor:"#3b82f6",
        backgroundColor:"rgba(59,130,246,0.2)",
        fill:true,
        tension:0.4
      }]
    },
    options:{ scales:{ y:{ beginAtZero:true, max:100 } } }
  });

  // ================= DEPARTMENT ATTENDANCE =================

const deptData = {};

employeeList.forEach(emp=>{

  const dept = emp.department || "General";

  const empRecords = attendance.filter(a =>
      a.employee === emp.name &&
      new Date(a.date).getMonth() === currentMonth &&
      new Date(a.date).getFullYear() === currentYear &&
      a.status !== "Absent"
  );

  const daysWorked = [...new Set(empRecords.map(r=>r.date))].length;

  const percent = Math.round((daysWorked/todayDate)*100);

  if(!deptData[dept]) deptData[dept] = [];

  deptData[dept].push(percent);

});

const deptLabels = Object.keys(deptData);

const deptAvg = deptLabels.map(dept=>{
  const arr = deptData[dept];
  return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
});

new Chart(ctx2,{
  type:"bar",
  data:{
    labels: deptLabels,
    datasets:[{
      label:"Department Attendance %",
      data: deptAvg,
      backgroundColor:"#f59e0b"
    }]
  },
  options:{
    scales:{ y:{ beginAtZero:true, max:100 } }
  }
});

}
}

  document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadHolidaysFromBackend();
});







