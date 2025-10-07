let data = null;
let usersData = null;
let currentUser = null;

// Cargar datos
Promise.all([
  fetch("data.json").then(r => r.json()),
  fetch("users_data.json").then(r => r.json())
]).then(([d1, d2]) => { data = d1; usersData = d2; console.log("Datos cargados"); })
.catch(err => alert("Error al cargar datos: " + err));

function login() {
  if (!data) return alert("Datos no cargados");

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const user = data.users[username];

  if (!user || atob(user.password) !== password) {
    document.getElementById("login-error").classList.remove("hidden");
    return;
  }

  currentUser = { name: username, level: user.level, id: user.id };
  document.getElementById("login").classList.add("hidden");
  showMain();
}

function logout() {
  currentUser = null;
  document.getElementById("login")?.classList.remove("hidden");
  document.getElementById("main")?.classList.add("hidden");
  document.getElementById("content")?.classList.add("hidden");
  document.getElementById("username")?.value = "";
  document.getElementById("password")?.value = "";
  document.getElementById("login-error")?.classList.add("hidden");
}

function showMain() {
  if (!currentUser) return logout();

  const mainDiv = document.getElementById("main");
  if (!mainDiv) return;

  mainDiv.classList.remove("hidden");
  document.getElementById("account-name").innerHTML = `<a href="user.html?id=${currentUser.id}" style="color:#00ffea;text-decoration:none;">${currentUser.name}</a>`;
  document.getElementById("account-id").innerText = `ID: ${currentUser.id}`;
  document.getElementById("account-level").innerText = `Nivel de acceso: ${currentUser.level}`;

  const linksDiv = document.getElementById("links");
  if (!linksDiv) return;
  linksDiv.innerHTML = "";

  data.links.forEach(link => {
    if (currentUser.level >= link.level) {
      const p = document.createElement("p");
      p.innerText = link.name;
      p.onclick = () => showContent(link);
      linksDiv.appendChild(p);
    }
  });
}

function showContent(link) {
  const mainDiv = document.getElementById("main");
  const contentDiv = document.getElementById("content");
  if (!mainDiv || !contentDiv) return;

 

