// Get logged user
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// If not logged in → go to home
if (!currentUser) {
  window.location.href = "home.html";
}

// Show name + role in navbar
const profileText = document.querySelector(".profile span");

if (profileText) {
  profileText.innerText = currentUser.name + " (" + currentUser.role + ")";
}


// Toggle profile dropdown
const profileMenu = document.getElementById("profileMenu");
const dropdown = document.getElementById("profileDropdown");

if(profileMenu){
  profileMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });
}

// Logout function
function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "home.html";
}

// Close dropdown when clicking outside
window.addEventListener("click", function(e){
  if(!profileMenu.contains(e.target)){
     dropdown.style.display = "none";
  }
});