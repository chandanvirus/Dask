async function loadEmployees(){
  const res = await fetch("/api/employees");
  return await res.json();
}

async function loadAttendance(){
  const res = await fetch("/api/attendance");
  return await res.json();
}

async function loadLeaves(){
  const res = await fetch("/api/leaves");
  return await res.json();
}




function showLoading(){
  document.getElementById("loadingSpinner").classList.remove("hidden");
}

function hideLoading(){
  document.getElementById("loadingSpinner").classList.add("hidden");
}

function showError(msg){
  const box = document.getElementById("errorBox");
  box.innerText = msg;
  box.classList.remove("hidden");
}

function hideError(){
  document.getElementById("errorBox").classList.add("hidden");
}

function showEmpty(){
  document.getElementById("emptyState").classList.remove("hidden");
}

function hideEmpty(){
  document.getElementById("emptyState").classList.add("hidden");
}

// Load stored data
// const users = JSON.parse(localStorage.getItem("users")) || [];
// const attendance = JSON.parse(localStorage.getItem("attendanceRecords")) || [];
// const leaves = JSON.parse(localStorage.getItem("leaveRequests")) || [];

const TOTAL_LEAVE_QUOTA = 37;


async function generateSalaryReport(){
  showLoading();
  hideError();
  hideEmpty();

  const users = await loadEmployees();
const attendance = await loadAttendance();

  const tbody = document.getElementById("salaryTableBody");
  tbody.innerHTML = "";

  const month = parseInt(document.getElementById("salaryMonth").value);
  const year = parseInt(document.getElementById("salaryYear").value);

  const employees = users.filter(u => u.role.toLowerCase() === "employee");

  employees.forEach(emp => {

    const BASE_SALARY = emp.salary;
    const WORKING_DAYS = 22;
    const PER_DAY = BASE_SALARY / WORKING_DAYS;

    let deductions = 0;

    const empAttendance = attendance.filter(a=>{
      const d = new Date(a.date);
      return a.employee === emp.name &&
             d.getMonth() === month &&
             d.getFullYear() === year;
    });

    const daysPresent = empAttendance.length;
    const absentDays = WORKING_DAYS - daysPresent;
    deductions += absentDays * PER_DAY;

    const netSalary = BASE_SALARY - deductions;

    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.department}</td>
        <td>₹${BASE_SALARY}</td>
        <td>₹${Math.round(deductions)}</td>
        <td>₹${Math.round(netSalary)}</td>
      </tr>
    `;
    if(users.length === 0){
  hideLoading();
  showEmpty();
  return;
}
  });

  setTimeout(()=>{
  hideLoading();
},700);

}

function downloadCSV(){

  let csv = "Name,Base Salary,Deductions,Net Salary\n";

  document.querySelectorAll("#salaryTableBody tr").forEach(row=>{
    const cols = row.querySelectorAll("td");
    csv += `${cols[0].innerText},${cols[1].innerText},${cols[2].innerText},${cols[3].innerText}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "salary_report.csv";
  a.click();
}

async function loadLeaveReport(){

  const users = await loadEmployees();
  const leaves = await loadLeaves();

  const tbody = document.getElementById("leaveUtilBody");
  tbody.innerHTML = "";

  const employees = users.filter(u => u.role.toLowerCase() === "employee");

  employees.forEach(emp => {

    const myLeaves = leaves.filter(l =>
      l.employee === emp.name && l.status === "Approved"
    );

    let usedDays = 0;

    myLeaves.forEach(l=>{
      const from = new Date(l.from_date);
      const to = new Date(l.to_date);
      usedDays += (to - from)/(1000*60*60*24) + 1;
    });

    const remaining = TOTAL_LEAVE_QUOTA - usedDays;

    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${TOTAL_LEAVE_QUOTA}</td>
        <td>${usedDays}</td>
        <td>${remaining}</td>
      </tr>
    `;
  });
}
async function loadAttendanceReport(){

   const users = await loadEmployees();
  const attendance = await loadAttendance();

  const tbody = document.getElementById("attendanceSummaryBody");
  tbody.innerHTML = "";

  const employees = users.filter(u => u.role.toLowerCase() === "employee");

  const WORKING_DAYS = 22;

  employees.forEach(emp => {

    const empAttendance = attendance.filter(a => a.employee === emp.name);

    const daysPresent = empAttendance.length;
    const lateEntries = empAttendance.filter(a => a.status === "Late").length;

    // ✅ Attendance Percentage
    const attendancePercent = Math.round((daysPresent / WORKING_DAYS) * 100);

    let performance;

    if(attendancePercent >= 90) performance = "Excellent";
    else if(attendancePercent >= 75) performance = "Good";
    else if(attendancePercent >= 60) performance = "Average";
    else performance = "Poor";

    // ✅ Badge color
    let badgeClass =
      performance === "Excellent" ? "badge-green" :
      performance === "Good" ? "badge-blue" :
      performance === "Average" ? "badge-yellow" :
      "badge-red";

    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${daysPresent}</td>
        <td>${lateEntries}</td>
        <td><span class="${badgeClass}">${performance}</span></td>
      </tr>
    `;
  });

  // =============================
  // Department-wise Attendance
  // =============================

  const departmentMap = {};

  attendance.forEach(a => {
    const emp = users.find(u => u.name === a.employee);
    if(!emp) return;

    if(!departmentMap[emp.department]){
      departmentMap[emp.department] = 0;
    }

    departmentMap[emp.department]++;
  });

  console.log("Department Attendance:", departmentMap);
// ⭐ Show Top Department
const topDepartment = Object.entries(departmentMap)
  .sort((a,b)=> b[1]-a[1])[0];

if(topDepartment){
  document.getElementById("topDept").innerText =
    topDepartment[0] + " (" + topDepartment[1] + ")";
}



  // =============================
  // Top 3 Absentees
  // =============================

  const absenteeList = employees.map(emp => {

    const empAttendance = attendance.filter(a => a.employee === emp.name);
    const absentDays = WORKING_DAYS - empAttendance.length;

    return {
      name: emp.name,
      absentDays
    };
  });

  // ⭐ Show Top 3 Absentees
document.getElementById("abs1").innerText =
  absenteeList[0]?.name + " (" + absenteeList[0]?.absentDays + " days)";

document.getElementById("abs2").innerText =
  absenteeList[1]?.name + " (" + absenteeList[1]?.absentDays + " days)";

document.getElementById("abs3").innerText =
  absenteeList[2]?.name + " (" + absenteeList[2]?.absentDays + " days)";

  absenteeList.sort((a,b)=> b.absentDays - a.absentDays);

  console.log("Top Absentees:", absenteeList.slice(0,3));
}



document.addEventListener("DOMContentLoaded", async ()=>{
  await loadLeaveReport();
  await loadAttendanceReport();
});
