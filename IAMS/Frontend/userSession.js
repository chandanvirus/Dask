function loadSidebarProfile(){

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if(!currentUser) return;

  const navAvatar = document.getElementById("navAvatar");
  const navUser = document.getElementById("navUser");

  if(navUser){
    navUser.innerText = currentUser.name;
  }

  if(navAvatar){
    if(currentUser.photo){
      navAvatar.innerHTML = `<img src="${currentUser.photo}" class="sidebar-avatar-img">`;
    }else{
      navAvatar.innerText = currentUser.name[0];
    }
  }
}
