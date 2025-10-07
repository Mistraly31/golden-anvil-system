// main.js
let data = null;           // data.json: login + links
let usersData = null;      // users_data.json: información completa de usuarios
let currentUser = null;

// ------ Cargar JSON externos ------
Promise.all([
  fetch("data.json").then(r => r.json()),
  fetch("users_data.json").then(r => r.json())
]).then(([d, u]) => {
  data = d;
  usersData = u;
  console.log("JSON cargados correctamente.");
}).catch(err => {
  console.error("Error al cargar JSON:", err);
  alert("Error al cargar archivos JSON. Si usas file:// usa GitHub Pages o un servidor local.");
});

// ------ LOGIN ------
function login(){
  if(!data){ alert("Esperando a cargar datos..."); return; }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const user = data.users[username];

  if(!user){ showLoginError(); return; }

  let expected;
  try { expected = atob(user.password); } catch(e){ expected = user.password; }
  if(password !== expected){ showLoginError(); return; }

  currentUser = { username, level: user.level, id: user.id };
  document.getElementById("login").classList.add("hidden");
  showMain();
}

function showLoginError(){
  const errEl = document.getElementById("login-error");
  errEl.classList.remove("hidden");
  setTimeout(()=> errEl.classList.add("hidden"), 2500);
}

function logout(){
  currentUser = null;
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// ------ MAIN VIEW ------
function showMain(){
  if(!currentUser) return logout();

  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");

  // Nombre clicable -> perfil
  const nameEl = document.getElementById("account-name");
  nameEl.innerText = currentUser.username;
  nameEl.style.cursor = "pointer";
  nameEl.onclick = () => showProfile(currentUser.id);

  document.getElementById("account-id").innerText = currentUser.id ? ("ID: " + currentUser.id) : "";
  document.getElementById("account-level").innerText = "Nivel de acceso: " + currentUser.level;

  // Links
  const linksDiv = document.getElementById("links");
  linksDiv.innerHTML = "";
  data.links.forEach(link => {
    if(currentUser.level >= link.level){
      const p = document.createElement("p");
      p.innerText = link.name;
      p.onclick = () => showContent(link);
      linksDiv.appendChild(p);
    }
  });
}

// ------ CONTENT VIEW ------
function showContent(link){
  document.getElementById("main").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
  document.getElementById("content-title").innerText = link.name;

  const body = document.getElementById("content-body");
  body.innerHTML = "";

  if(link.type === "text"){
    body.innerHTML = "<p>" + link.content + "</p>";
  } else if(link.type === "external"){
    const btn = document.createElement("button");
    btn.innerText = "Abrir contenido externo";
    btn.onclick = () => window.open(link.url, "_blank");
    body.appendChild(btn);
  } else if(link.type === "enc"){
    // Aquí puedes poner tu decodificador multi-capa si lo implementas
    body.innerHTML = "<p>[Contenido cifrado]</p>";
  } else {
    body.innerHTML = "<p>Tipo de enlace desconocido.</p>";
  }
}

// ------ PROFILE VIEW ------
function showProfile(id){
  if(!usersData){ alert("Usuarios no cargados aún."); return; }
  const rec = usersData[id];
  if(!rec){ alert("Perfil no encontrado."); return; }

  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.remove("hidden");

  const container = document.getElementById("profile-body");
  container.innerHTML = "";

  const addRow = (label, value) => {
    const div = document.createElement("div");
    div.className = "profile-row";
    div.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${value !== undefined && value !== null ? escapeHtml(String(value)) : "<em>-</em>"}`;
    container.appendChild(div);
  };

  addRow("Nombre de usuario", rec.username);
  addRow("ID", id);
  addRow("Nivel de acceso", rec.level);
  addRow("Departamento", rec.department);
  addRow("Fecha de unión", rec.joinDate);
  addRow("Proyectos", rec.projects.join(", "));
  addRow("Notas de administración", rec.adminNotes);
  addRow("Cantidad de avisos", rec.warnings);
  addRow("Estado", rec.status);

  // Botones de exportar e imprimir
  const adminRow = document.createElement("div");
  adminRow.className = "profile-row";
  adminRow.innerHTML = `<strong>Acciones:</strong> 
    <button onclick='printProfile("${id}")'>Imprimir perfil</button> 
    <button onclick='exportProfile("${id}")'>Exportar (JSON)</button>`;
  container.appendChild(adminRow);
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

function exportProfile(id){
  const rec = usersData[id];
  if(!rec) return alert("Perfil no encontrado");
  const blob = new Blob([JSON.stringify(rec, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${rec.username}-${id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printProfile(id){
  const rec = usersData[id];
  if(!rec) return alert("Perfil no encontrado");
  const w = window.open("about:blank","_blank");
  const html = `<pre style="color:#111;background:#fff;padding:20px;font-family:monospace;">${escapeHtml(JSON.stringify(rec,null,2))}</pre>`;
  w.document.write(html); w.document.close();
}
