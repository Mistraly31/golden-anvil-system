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

  mainDiv.classList.add("hidden");
  contentDiv.classList.remove("hidden");
  document.getElementById("content-title").innerText = link.name;

  const body = document.getElementById("content-body");
  body.innerHTML = "";

  if (link.type === "text") {
    body.innerHTML = `<p>${link.content}</p>`;
  } else if (link.type === "external") {
    const btn = document.createElement("button");
    btn.innerText = "Abrir contenido externo";
    btn.onclick = () => window.open(link.url, "_blank");
    body.appendChild(btn);
  }
}

// --- Perfil de usuario en user.html ---
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("id");

if (userId && usersData) {
  const u = usersData[userId];
  if (u) {
    const c = document.getElementById("content");
    c.classList.remove("loading");
    c.classList.add("info");
    c.innerHTML = `
      <p><strong>Nombre:</strong> ${u.nombre}</p>
      <p><strong>ID:</strong> ${userId}</p>
      <p><strong>Nivel:</strong> ${u.nivel}</p>
      <p><strong>Departamento:</strong> ${u.departamento}</p>
      <p><strong>Fecha de unión:</strong> ${u.fecha_union}</p>
      <p><strong>Proyectos:</strong> ${u.proyectos.join(", ")}</p>
      <p><strong>Notas administrativas:</strong> ${u.notas_admin}</p>
      <p><strong>Avisos:</strong> ${u.avisos}</p>
      <p><strong>Estado:</strong> ${u.estado}</p>
    `;
  } else {
    document.getElementById("content").className = "error";
    document.getElementById("content").innerText = "Usuario no encontrado";
  }
}
