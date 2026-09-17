// Modal controls

let selectedRole = "employee";

function setRole(role) {
  selectedRole = role;

  document.getElementById("empBtn").classList.remove("active");
  document.getElementById("adminBtn").classList.remove("active");

  if (role === "employee") {
    document.getElementById("empBtn").classList.add("active");
    document.getElementById("registerLink").style.display = "block";
  } else {
    document.getElementById("adminBtn").classList.add("active");
    document.getElementById("registerLink").style.display = "none";
    showLogin(); // always show login for admin
  }
}

function closeModal() {
  document.getElementById("authModal").classList.remove("active");
}

function openLogin(){
  document.getElementById("authModal").classList.add("active");
  showLogin();
}

function openRegister(){
  document.getElementById("authModal").classList.add("active");
  showRegister();
}

function showRegister(){
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

function showLogin(){
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}

// Register user
async function register(){

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;
  const salary = Number(document.getElementById("salary").value);
  const department = document.getElementById("department").value;

  if(!name || !email || !pass || !department){
    showAlert("Please fill all fields", "warning");
    return;
  }

  try{

    const res = await fetch("/api/employees",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        department: department,
        role: "Employee",
        salary: salary,
        password: pass
      })
    });

    if(!res.ok){
      showAlert("Registration failed", "error");
      return;
    }

    showAlert("Registration successful!", "success");

    closeModal();
    showLogin();

  }catch(err){
    console.error(err);
    showAlert("Server error", "error");
  }

}

// Login user
async function login(){

  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  if(!email || !pass){
    showAlert("Enter email and password", "warning");
    return;
  }

  try{

    const res = await fetch("/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email: email,
        password: pass,
        role: selectedRole === "admin" ? "Admin" : "Employee"
      })
    });

    if(!res.ok){
      const error = await res.json().catch(() => null);
      let errorMessage = "Invalid credentials";

      if (typeof error?.detail === "string") {
        errorMessage = error.detail;
      } else if (Array.isArray(error?.detail) && error.detail.length > 0) {
        errorMessage = error.detail[0]?.msg || errorMessage;
      }

      showAlert(errorMessage, "error");
      return;
    }

    const user = await res.json();

    // store session
    localStorage.setItem("currentUser", JSON.stringify(user));

    window.location.href = "index.html";

  }catch(err){
    console.error(err);
    showAlert("Server error", "error");
  }

}


// Close when clicking outside modal
window.onclick = function(e) {
  const modal = document.getElementById("authModal");
  if (e.target === modal) {
    closeModal();
  }
};

// Close with ESC key
document.addEventListener("keydown", function(e){
  if (e.key === "Escape") closeModal();
});
