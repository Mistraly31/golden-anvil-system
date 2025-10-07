let data = null;
let usersData = null;
let currentUser = null;

// --- Cargar JSON de datos y usuarios ---
async function init() {
  try {
    const [d1, d2] = await Promise.all([
      fetch("data.json").then(r => r.json()),
      fetch("users_data.json").then(r => r.json())
    ]);
    data = d1;
    usersData = d2;
    console.log("Datos cargados correctamente.");
    document.getElementById("login-btn").disabled = false; // habilita login
  } catch(err) {
    alert("Error al cargar datos: " + err);
  }
}
init();

// --- Login ---
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const user = data.users[username];

  if (!user) {
    document.getElementById("login-error").classList.remove("hidden");
    return;
  }

  const decodedPass = atob(user.password); // descodifica Base64
  if (password === decodedPass) {
    currentUser = { name: username, level: user.level, id: user.id };
    document.getElementById("login").classList.add("hidden");
    showMain();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

// --- Logout ---
function logout() {
  currentUser = null;
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").classList.add("hidden");
}

// --- Mostrar panel principal ---
function showMain() {
  if (!currentUser) return logout();
  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");

  document.getElementById("account-name").innerText = "Usuario: " + currentUser.name;
  document.getElementById("account-id").innerText = "ID: " + currentUser.id;
  document.getElementById("account-level").innerText = "Nivel de acceso: " + currentUser.level;

  const linksDiv = document.getElementById("links");
  linksDiv.innerHTML = "";

  data.links.forEach(link => {
    if (currentUser.level >= link.level) {
      const p = document.createElement("p");
      p.innerText = link.name;
      p.onclick = () => showContent(link);
      linksDiv.appendChild(p);
    }
  });

  // Click en el nombre del usuario para ver perfil
  document.getElementById("account-name").onclick = () => {
    if (!currentUser) return;
    window.location.href = `user.html?id=${currentUser.id}`;
  };
}

// --- Mostrar contenido ---
function showContent(link) {
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
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
