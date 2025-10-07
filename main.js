let data = null;
let usersData = null;
let currentUser = null;
let usersById = {};

// cargar JSON externo
Promise.all([
  fetch("data.json").then(r => r.json()),
  fetch("users_data.json").then(r => r.json())
]).then(([d1,d2])=>{
  data = d1;
  usersData = d2;
  buildUsersIndex();
  console.log("Datos cargados correctamente");
}).catch(err=>{
  console.error("Error al cargar datos:", err);
  alert("Error al cargar los archivos JSON.");
});

function buildUsersIndex(){
  usersById = {};
  if(!usersData) return;
  Object.keys(usersData).forEach(id=>{
    usersById[id] = Object.assign({}, usersData[id]);
  });
}

// ------------ LOGIN -------------
document.getElementById("loginBtn").addEventListener("click", login);

function login(){
  if(!data){ alert("Esperando a cargar datos..."); return; }
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const u = data.users[username];
  if(!u){ showLoginError(); return; }
  let expected;
  try{ expected = atob(u.password); } catch(e){ expected = u.password; }
  if(password !== expected){ showLoginError(); return; }
  currentUser = { name: username, level: u.level, id: u.id || "" };
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

// ------------ MAIN LIST -------------
function showMain(){
  if(!currentUser) return logout();
  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");

  const nameEl = document.getElementById("account-name");
  nameEl.innerText = currentUser.name;
  nameEl.onclick = () => { if(currentUser.id) showProfile(currentUser.id); };
  document.getElementById("account-id").innerText = currentUser.id ? ("ID: "+currentUser.id) : "";
  document.getElementById("account-level").innerText = "Nivel de acceso: "+currentUser.level;

  const linksDiv = document.getElementById("links");
  linksDiv.innerHTML = "";
  data.links.forEach(link=>{
    if(currentUser.level >= link.level){
      const p = document.createElement("p");
      p.innerText = link.name;
      p.onclick = ()=> showContent(link);
      linksDiv.appendChild(p);
    }
  });
}

// ------------ SHOW CONTENT -------------
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
    btn.onclick = ()=> window.open(link.url, "_blank");
    body.appendChild(btn);
  } else {
    body.innerHTML = "<p>Tipo de enlace desconocido.</p>";
  }
}

// ------------ SHOW PROFILE -------------
function showProfile(id){
  const rec = usersById[id];
  if(!rec){ alert("Perfil no encontrado."); return; }
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.remove("hidden");

  const container = document.getElementById("profile-body");
  container.innerHTML = "";

  const addRow = (label,value)=>{
    const div = document.createElement("div"); div.className = "profile-row";
    div.innerHTML = "<strong>"+escapeHtml(label)+":</strong> "+(value!==undefined && value!==null ? escapeHtml(String(value)) : "<em>-</em>");
    container.appendChild(div);
  };

  addRow("Nombre de usuario", rec.username || "-");
  addRow("ID", id);
  addRow("Nivel de acceso", rec.level || "-");
  addRow("Departamento", rec.department || "-");
  addRow("Fecha de unión", rec.joinDate || "-");
  addRow("Proyectos", rec.projects && rec.projects.length ? rec.projects.join(", ") : "-");
  addRow("Notas de administración", rec.adminNotes || "-");
  addRow("Cantidad de avisos", rec.warnings !== undefined ? rec.warnings : 0);
  addRow("Estado", rec.status || "-");

  const actions = document.createElement("div");
  actions.className = "profile-row";
  actions.innerHTML = `<strong>Acciones:</strong> 
    <button onclick='printProfile("${id}")'>Imprimir perfil</button> 
    <button onclick='exportProfile("${id}")'>Exportar (JSON)</button>`;
  container.appendChild(actions);
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

function exportProfile(id){
  const rec = usersById[id];
  if(!rec) return alert("No encontrado");
  const blob = new Blob([JSON.stringify(rec,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=(rec.username||"profile")+"-"+id+".json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function printProfile(id){
  const rec = usersById[id];
  if(!rec) return alert("No encontrado");
  const w = window.open("about:blank","_blank");
  const html = "<pre style='color:#111;background:#fff;padding:20px;font-family:monospace;'>"+escapeHtml(JSON.stringify(rec,null,2))+"</pre>";
  w.document.write(html); w.document.close();
}
