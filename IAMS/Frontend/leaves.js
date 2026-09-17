
// Load leave requests from storage
// let leaveRequests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

let leaveRequests = [];

// const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const isAdmin = currentUser && currentUser.role === "Admin";


// ⭐ Role based data source
function getVisibleLeaves(){
  if(isAdmin) return leaveRequests;
  return leaveRequests.filter(l => l.employee === currentUser.name);
}


function isAdminUser(){
  const user = JSON.parse(localStorage.getItem("currentUser"));
  return user && user.role === "Admin";
}

// let leaveRequests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

// let currentUser = JSON.parse(localStorage.getItem("currentUser"));
// const isAdmin = currentUser && currentUser.role === "Admin";

function openLeaveModal(){
  if (isAdminUser()) {
    return;
  }
  document.getElementById("leaveModal").style.display="flex";
}

function closeLeaveModal(){
  document.getElementById("leaveModal").style.display="none";
}

async function applyLeave(){

  const type = document.getElementById("leaveType").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const reason = document.getElementById("reason").value;

  if(!from || !to || !reason){
    alert("Please fill all fields");
    return;
  }

  const res = await fetch("/api/leaves",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      employee: currentUser.name,
      leave_type: type,
      from_date: from,
      to_date: to,
      reason: reason
    })
  });

  alert("Leave request submitted");

  closeLeaveModal();

  loadLeaves();
}

function updateRequestsTable(){

  const tableBody = document.getElementById("requestsTableBody");
  tableBody.innerHTML = "";

  getVisibleLeaves().forEach((req,index) => {

    let actionButtons = "";

    // show buttons ONLY if admin
   // ADMIN buttons
if (isAdminUser() && req.status === "Pending") {
  actionButtons = `
    <button class="approve-btn" onclick="approveLeave(${req.id})">Approve</button>
    <button class="reject-btn" onclick="rejectLeave(${req.id})">Reject</button>
  `;
}

// EMPLOYEE cancel button
if (!isAdminUser() && 
    req.status === "Pending" && 
    req.employee === currentUser.name) {

  actionButtons = `
    <button class="cancel-btn" onclick="cancelLeave(${req.id})">Cancel</button>
  `;
}

    const row = `
    <tr>
  <td>${req.employee}</td>
  <td>${req.leave_type}</td>
  <td>${req.from_date}</td>
  <td>${req.to_date}</td>
  <td>${req.reason}</td>
  <td><span class="status-badge status-${req.status}">${req.status}</span></td>
  <td>${actionButtons}</td>
</tr>
    `;

    tableBody.innerHTML += row;
  });
}

// function updateSummaryTable(){

  // Hide empty state
//   document.getElementById("emptyState").style.display="none";
//   document.getElementById("leaveTable").style.display="table";

//   const tableBody = document.getElementById("leaveTableBody");
//   tableBody.innerHTML = "";

//   leaveRequests
//   .filter(req => isAdmin || req.employee === currentUser.name)
//   .forEach((req,index) => {
//     const row = `
//   <tr>
//     <td>${req.employee}</td>
//     <td>${req.type}</td>
//     <td>${req.from}</td>
//     <td>${req.to}</td>
//     <td>${req.reason}</td>
//     <td><span class="status-badge status-${req.status}">${req.status}</span></td>
//     <td>${actionButtons}</td>
//   </tr>
// `;
//     tableBody.innerHTML += row;
//   });
// }

function updateSummaryTable(){

  document.getElementById("emptyState").style.display="none";
  document.getElementById("leaveTable").style.display="table";

  const tableBody = document.getElementById("leaveTableBody");
  tableBody.innerHTML = "";

  getVisibleLeaves().forEach(req => {

    const row = `
      <tr>
        <td>${req.employee}</td>
        <td>${req.leave_type}</td>
        <td>${req.from_date}</td>
        <td>${req.to_date}</td>
        <td>${req.reason}</td>
        <td><span class="status-badge status-${req.status}">${req.status}</span></td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });
}

function showTab(tab, btn){

  document.getElementById("summaryTab").style.display="none";
  document.getElementById("balanceTab").style.display="none";
  document.getElementById("requestsTab").style.display="none";

  document.getElementById(tab+"Tab").style.display="block";

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
}


function filterRequests(){

  const filter = document.getElementById("statusFilter").value;
  const tableBody = document.getElementById("requestsTableBody");
  tableBody.innerHTML = "";

    getVisibleLeaves()
  .filter(req => filter === "All" || req.status === filter)
  .forEach((req,index) => {

      let actionButtons = "";

      if(isAdminUser() && req.status === "Pending"){
        actionButtons = `
          <button class="approve-btn" onclick="approveLeave(${req.id})">Approve</button>
          <button class="reject-btn" onclick="rejectLeave(${req.id})">Reject</button>
        `;
      }

      const row = `
        <tr>
          <td>${req.leave_type}</td>
          <td>${req.from_date}</td>
          <td>${req.to_date}</td>
          <td>${req.reason}</td>
          <td><span class="status-badge status-${req.status}">${req.status}</span></td>
          <td>${actionButtons}</td>
        </tr>
      `;

      tableBody.innerHTML += row;
    });
}


async function approveLeave(id){

  await fetch(`/api/leaves/${id}?status=Approved`,{
    method:"PUT"
  });

  alert("Leave Approved");

  loadLeaves();
}

async function rejectLeave(id){

  await fetch(`/api/leaves/${id}?status=Rejected`,{
    method:"PUT"
  });

  loadLeaves();
}


// ===== PAGE INIT =====
window.onload = async function(){

  const user = JSON.parse(localStorage.getItem("currentUser"));

  if(!user){
    alert("Please login first");
    window.location.href = "home.html";
    return;
  }

  // Show profile
  const profileText = document.querySelector(".profile span");
  if(profileText){
    profileText.innerText = user.name + " (" + user.role + ")";
  }

  // ⭐ LOAD DATA FROM STORAGE AGAIN
  // leaveRequests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

  loadLeaves();
  await calculateLeaveBalance();

  const applyLeaveBtn = document.getElementById("applyLeaveBtn");
  const emptyStateAddRequestBtn = document.getElementById("emptyStateAddRequestBtn");

  if (isAdmin) {
    if (applyLeaveBtn) applyLeaveBtn.style.display = "none";
    if (emptyStateAddRequestBtn) emptyStateAddRequestBtn.style.display = "none";
  }

  if(isAdmin){
   document.getElementById("adminBalanceTable").style.display = "block";
   await renderEmployeeLeaveBalance();
  }
};

async function cancelLeave(id){

  if(!confirm("Cancel this leave request?")) return;

  await fetch(`/api/leaves/${id}?status=Cancelled`,{
    method:"PUT"
  });

  loadLeaves();
}


// ===============================
// 📊 LEAVE BALANCE CALCULATOR
// ===============================

async function calculateLeaveBalance(){

  const res = await fetch("/api/leaves");
  const leaves = await res.json();

  const user = JSON.parse(localStorage.getItem("currentUser"));

  const myApprovedLeaves = leaves.filter(l =>
    l.employee === user.name && l.status === "Approved"
  );

  let casualQuota = 12;
  let sickQuota = 10;
  let earnedQuota = 15;

  let casualUsed = 0;
  let sickUsed = 0;
  let earnedUsed = 0;

  myApprovedLeaves.forEach(l => {

    const from = new Date(l.from_date);
    const to = new Date(l.to_date);

    const days = (to - from)/(1000*60*60*24) + 1;

    if(l.leave_type === "Casual Leave") casualUsed += days;
    if(l.leave_type === "Sick Leave") sickUsed += days;
    if(l.leave_type === "Earned Leave") earnedUsed += days;

  });

  document.getElementById("casualBalance").innerText = (casualQuota - casualUsed) + " Days Left";
  document.getElementById("sickBalance").innerText = (sickQuota - sickUsed) + " Days Left";
  document.getElementById("earnedBalance").innerText = (earnedQuota - earnedUsed) + " Days Left";

}


// ================= ADMIN EMPLOYEE LEAVE BALANCE =================


async function renderEmployeeLeaveBalance(){

  const empRes = await fetch("/api/employees");
  const employees = await empRes.json();

  const leaveRes = await fetch("/api/leaves");
  const leaves = await leaveRes.json();

  const tbody = document.getElementById("employeeBalanceBody");
  tbody.innerHTML = "";

  const casualQuota = 12;
  const sickQuota = 10;
  const earnedQuota = 15;

  employees.forEach(emp => {

    const empLeaves = leaves.filter(l =>
      l.employee === emp.name && l.status === "Approved"
    );

    let casualUsed = 0;
    let sickUsed = 0;
    let earnedUsed = 0;

    empLeaves.forEach(l => {

      const from = new Date(l.from_date);
      const to = new Date(l.to_date);
      const days = (to - from)/(1000*60*60*24) + 1;

      if(l.leave_type === "Casual Leave") casualUsed += days;
      if(l.leave_type === "Sick Leave") sickUsed += days;
      if(l.leave_type === "Earned Leave") earnedUsed += days;

    });

    tbody.innerHTML += `
      <tr>
        <td>${emp.name}</td>
        <td>${casualQuota - casualUsed}</td>
        <td>${sickQuota - sickUsed}</td>
        <td>${earnedQuota - earnedUsed}</td>
      </tr>
    `;
  });

}
// async function renderEmployeeLeaveBalance(){

//   const tbody = document.getElementById("employeeBalanceBody");
//   if(!tbody) return;

//   tbody.innerHTML = "";

//   // const leaves = JSON.parse(localStorage.getItem("leaveRequests")) || [];
//   const res = await fetch("/api/leaves");
//   const leaves = await res.json();

//   // Group leaves by employee
//   const employees = {};

//   leaves.forEach(l => {
//     if(l.status !== "Approved") return;

//     if(!employees[l.employee]){
//       employees[l.employee] = { casual:0, sick:0, earned:0 };
//     }

//     if(l.type === "Casual Leave") employees[l.employee].casual++;
//     if(l.type === "Sick Leave") employees[l.employee].sick++;
//     if(l.type === "Earned Leave") employees[l.employee].earned++;
//   });

//   // Company quota
//   const casualQuota = 12;
//   const sickQuota = 10;
//   const earnedQuota = 15;

//   for(let emp in employees){

//     const row = `
//       <tr>
//         <td>${emp}</td>
//         <td>${casualQuota - employees[emp].casual}</td>
//         <td>${sickQuota - employees[emp].sick}</td>
//         <td>${earnedQuota - employees[emp].earned}</td>
//       </tr>
//     `;

//     tbody.innerHTML += row;
//   }
// }


async function loadLeaves(){

  const res = await fetch("/api/leaves");

  const data = await res.json();   // read response ONCE

  leaveRequests = data;            // store globally

  const table = document.getElementById("leaveTableBody");

  if(!table) return;

  table.innerHTML="";

  data
  .filter(l => isAdmin || l.employee === currentUser.name)
  .forEach(l => {

    table.innerHTML += `
      <tr>
        <td>${l.employee}</td>
        <td>${l.leave_type}</td>
        <td>${l.from_date}</td>
        <td>${l.to_date}</td>
        <td>${l.reason}</td>
        <td>${l.status}</td>
      </tr>
    `;

  });

  updateRequestsTable();
  updateSummaryTable();
}
