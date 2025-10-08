let data = null;             // data.json
let usersData = null;        // users_data.json
let currentUser = null;

const loginBtn = document.getElementById("loginBtn");
loginBtn.addEventListener("click", login);

// Cargar ambos JSON
Promise.all([
  fetch("data.json").then(r => r.json()),
  fetch("users_data.json").then(r => r.json())
])
.then(([jsonData, jsonUsersData]) => {
  data = jsonData;
  usersData = jsonUsersData;
  console.log("data.json y users_data.json cargados correctamente");
})
.catch(err => {
  console.error("Error al cargar JSON:", err);
  alert("Error al cargar archivos JSON. Usa GitHub Pages o un servidor.");
});

function login() {
  if(!data){ alert("Esperando a cargar datos..."); return; }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const user = data.users[username];

  if(!user){
    showLoginError();
    return;
  }

  let expected;
  try { expected = atob(user.password); } catch(e){ expected = user.password; }

  if(password !== expected){
    showLoginError();
    return;
  }

  currentUser = { username: username, level: user.level, id: user.id };
  document.getElementById("login").classList.add("hidden");
  showMain();
}

function showLoginError(){
  const err = document.getElementById("login-error");
  err.classList.remove("hidden");
  setTimeout(()=> err.classList.add("hidden"), 2500);
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

function showMain(){
  if(!currentUser) return logout();

  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");

  // Mostrar nombre clicable
  const nameEl = document.getElementById("account-name");
  nameEl.innerText = currentUser.username;
  nameEl.style.cursor = "pointer";
  nameEl.onclick = () => showProfile(currentUser.id);

  document.getElementById("account-id").innerText = "ID: " + currentUser.id;
  document.getElementById("account-level").innerText = "Nivel de acceso: " + currentUser.level;

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

function showContent(link){
  document.getElementById("main").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
  document.getElementById("content-title").innerText = link.name;

  const body = document.getElementById("content-body");
  body.innerHTML = "";

  if(link.type === "text"){
    body.innerHTML = "<p>"+link.content+"</p>";
  } else if(link.type === "external"){
    const btn = document.createElement("button");
    btn.innerText = "Abrir contenido externo";
    btn.onclick = ()=> window.open(link.url,"_blank");
    body.appendChild(btn);
  } else {
    body.innerHTML = "<p>Tipo de enlace desconocido.</p>";
  }
}

function showProfile(id){
  if(!usersData || !usersData[id]){
    alert("Perfil no encontrado.");
    return;
  }

  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.remove("hidden");

  const rec = usersData[id];
  const container = document.getElementById("profile-body");
  container.innerHTML = "";

  const addRow = (label, value) => {
    const div = document.createElement("div");
    div.className = "profile-row";
    div.innerHTML = "<strong>"+label+":</strong> " + (value !== undefined ? value : "-");
    container.appendChild(div);
    
  const addoneonly = (label, value) => {
    const div = document.createElement("div");
    div.className = "profile-row";
    div.innerHTML = "<strong>"+label+":</strong> ");
    container.appendChild(div);
  };

  addoneonly("INFORMACIÓN");
  addRow("Nombre de usuario", rec.username);
  addRow("ID", id);
  addRow("Nivel de acceso", rec.level);
  addRow("Departamento", rec.department);
  addRow("Fecha de unión", rec.joinDate);
  addRow("Proyectos", rec.projects.join(", "));
  addRow("Notas de administración", rec.adminNotes);
  addRow("Cantidad de avisos", rec.warnings);
  addRow("Estado", rec.status);

  // Botones
  const btnDiv = document.createElement("div"); btnDiv.className = "profile-row";
  const exportBtn = document.createElement("button");
  exportBtn.innerText = "Exportar perfil (JSON)";
  exportBtn.onclick = ()=> exportProfile(id);
  const printBtn = document.createElement("button");
  printBtn.innerText = "Imprimir perfil";
  printBtn.onclick = ()=> printProfile(id);
  btnDiv.appendChild(exportBtn);
  btnDiv.appendChild(printBtn);
  container.appendChild(btnDiv);
}

function exportProfile(id){
  const rec = usersData[id];
  const blob = new Blob([JSON.stringify(rec,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = rec.username+"-"+id+".json";
  a.click();
}

function printProfile(id){
  const rec = usersData[id];
  const w = window.open("about:blank","_blank");
  const html = "<pre style='color:#111;background:#fff;padding:20px;font-family:monospace;'>"+JSON.stringify(rec,null,2)+"</pre>";
  w.document.write(html); w.document.close();
}
