let currentProfile = null;
let profilePhoto = null;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROFILE_IMAGE_MAX_WIDTH = 300;
const PROFILE_IMAGE_MAX_HEIGHT = 300;
const PROFILE_IMAGE_QUALITY = 0.8;

if (!currentUser) {
  window.location.href = "home.html";
}

async function fetchEmployees() {
  const response = await fetch("/api/employees");
  return await response.json();
}

async function loadProfile() {
  const employees = await fetchEmployees();
  const employee = employees.find((item) => item.id === currentUser.id);

  if (!employee) {
    alert("Profile not found");
    return;
  }

  currentProfile = employee;

  document.getElementById("profileName").value = employee.name;
  document.getElementById("profileEmail").value = employee.email;
  document.getElementById("roleBadge").innerText = employee.role;
  document.getElementById("navUser").innerText = employee.name;

  if (employee.department) {
    document.getElementById("profileDept").value = employee.department;
  }

  if (employee.role === "Admin") {
    document.getElementById("deptContainer").style.display = "none";
  }

  const navAvatar = document.getElementById("navAvatar");
  navAvatar.innerText = employee.name[0];

  profilePhoto = employee.photo || null;

  if (profilePhoto) {
    document.getElementById("profileImage").src = profilePhoto;
    navAvatar.innerHTML = `<img src="${profilePhoto}" class="sidebar-avatar-img">`;
  } else {
    document.getElementById("profileImage").src = "default-avatar.png";
  }
}

window.onload = function () {
  loadProfile();
};

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        let { width, height } = image;

        if (width > PROFILE_IMAGE_MAX_WIDTH || height > PROFILE_IMAGE_MAX_HEIGHT) {
          const widthRatio = PROFILE_IMAGE_MAX_WIDTH / width;
          const heightRatio = PROFILE_IMAGE_MAX_HEIGHT / height;
          const ratio = Math.min(widthRatio, heightRatio);

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process image"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", PROFILE_IMAGE_QUALITY));
      };

      image.onerror = function () {
        reject(new Error("Invalid image file"));
      };

      image.src = event.target.result;
    };

    reader.onerror = function () {
      reject(new Error("Failed to read image"));
    };

    reader.readAsDataURL(file);
  });
}

document.getElementById("imageUpload").addEventListener("change", async function () {
  const file = this.files[0];

  if (!file) {
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    alert("Please upload a JPG, PNG, or WEBP image.");
    this.value = "";
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    alert("Please upload an image smaller than 2 MB.");
    this.value = "";
    return;
  }

  try {
    profilePhoto = await resizeImage(file);
    document.getElementById("profileImage").src = profilePhoto;
  } catch (error) {
    alert(error.message || "Failed to process image");
    this.value = "";
  }
});

async function saveProfile() {
  if (!currentProfile) {
    alert("Profile not loaded yet");
    return;
  }

  const updatedName = document.getElementById("profileName").value.trim();
  const updatedEmail = document.getElementById("profileEmail").value.trim();
  const deptInput = document.getElementById("profileDept");
  const updatedDept = deptInput ? deptInput.value.trim() : null;
  try {
    const response = await fetch(`/api/employees/${currentProfile.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: updatedName,
        email: updatedEmail,
        department: updatedDept || null,
        photo: profilePhoto
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      let errorMessage = "Failed to update profile";

      if (typeof error?.detail === "string") {
        errorMessage = error.detail;
      } else if (Array.isArray(error?.detail) && error.detail.length > 0) {
        errorMessage = error.detail[0]?.msg || errorMessage;
      }

      alert(errorMessage);
      return;
    }

    const updatedUser = await response.json();

    const nextCurrentUser = {
      ...currentUser,
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      photo: updatedUser.photo || null
    };

    localStorage.setItem("currentUser", JSON.stringify(nextCurrentUser));
    document.getElementById("navUser").innerText = updatedUser.name;

    if (updatedUser.photo) {
      document.getElementById("navAvatar").innerHTML = `<img src="${updatedUser.photo}" class="sidebar-avatar-img">`;
    } else {
      document.getElementById("navAvatar").innerText = updatedUser.name[0];
    }

    alert("Profile updated successfully!");
  } catch (error) {
    alert("Unable to save profile right now. Please try again.");
  }
}
