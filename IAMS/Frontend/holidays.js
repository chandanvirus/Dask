async function loadHolidayTable(){

  const tbody = document.getElementById("holidayTable");

  if(!tbody) return;   // ⭐ prevents dashboard error

  const res = await fetch("/api/holidays");
  const holidays = await res.json();

  tbody.innerHTML = "";

  holidays.forEach(h=>{

    const date = new Date(h.date).toLocaleDateString("en-IN",{
      day:"2-digit",
      month:"short",
      year:"numeric"
    });

    tbody.innerHTML += `
      <tr>
        <td>${h.name}</td>
        <td>${date}</td>
      </tr>
    `;
  });

}
document.addEventListener("DOMContentLoaded", ()=>{
  loadHolidayTable();
});
