// main.js (con vista de perfil por ID)
let data = null;
let currentUser = null;
let usersById = {}; // mapa id -> user object + username

const loginBtn = document.getElementById("loginBtn");
loginBtn.addEventListener("click", login);

// cargar JSON externo
fetch("data.json")
  .then(r => {
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(json => {
    data = json;
    buildUsersIndex();
    console.log("data.json cargado");
  })
  .catch(err => {
    console.error("No se pudo cargar data.json:", err);
    alert("Error al cargar data.json. Si estás usando file:// abre via un servidor o usa GitHub Pages.");
  });

function buildUsersIndex(){
  usersById = {};
  if(!data || !data.users) return;
  Object.keys(data.users).forEach(username => {
    const u = data.users[username];
    if(u && u.id){
      usersById[u.id] = Object.assign({}, u, { username });
    } else {
      // si no tiene id, generamos uno en memoria basado en username (no recomendable)
      const gen = "GEN-"+btoa(username).slice(0,8);
      usersById[gen] = Object.assign({}, u, { username, id: gen });
      if(!u.id) u.id = gen; // opcional: actualiza data structure in memory
    }
  });
}

// ------------ LOGIN -------------
function login(){
  if(!data){ alert("Esperando a cargar datos..."); return; }
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const u = data.users[username];
  if(!u){ showLoginError(); return; }

  // try base64 decode first, else compare raw
  let expected;
  try { expected = atob(u.password); } catch(e){ expected = u.password; }
  if(password !== expected){ showLoginError(); return; }

  currentUser = { name: username, level: u.level, id: u.id || "" };
  document.getElementById("login").classList.add("hidden");
  showMain();
}

function showLoginError(){
  document.getElementById("login-error").classList.remove("hidden");
  setTimeout(()=> document.getElementById("login-error").classList.add("hidden"), 2500);
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

  // nombre clicable para ir al perfil
  const nameEl = document.getElementById("account-name");
  nameEl.innerText = currentUser.name;
  nameEl.onclick = () => { if(currentUser.id) showProfile(currentUser.id); };
  document.getElementById("account-id").innerText = currentUser.id ? ("ID: " + currentUser.id) : "";
  document.getElementById("account-level").innerText = "Nivel de acceso: " + currentUser.level;

  const linksDiv = document.getElementById("links");
  linksDiv.innerHTML = "";

  data.links.forEach((link, idx) => {
    if(currentUser.level >= link.level){
      const p = document.createElement("p");
      p.innerText = link.name;
      p.onclick = ()=> showContent(link, idx);
      linksDiv.appendChild(p);
    }
  });
}

// ------------ SHOW CONTENT -------------
async function showContent(link, idx){
  document.getElementById("main").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
  document.getElementById("content-title").innerText = link.name;
  const body = document.getElementById("content-body");
  body.innerHTML = "";

  try{
    if(link.type === "text"){
      body.innerHTML = "<p>"+link.content+"</p>";
    } else if(link.type === "external"){
      const btn = document.createElement("button");
      btn.innerText = "Abrir contenido externo";
      btn.onclick = ()=> window.open(link.url, "_blank");
      body.appendChild(btn);
    } else if(link.type === "enc"){
      const payload = link.payload;
      const layers = link.layers || [];
      const meta = link.meta || {};
      const decoded = CryptoLayer.decodeLayers(payload, layers, meta);
      body.innerHTML = decoded;
    } else {
      body.innerHTML = "<p>Tipo de enlace desconocido.</p>";
    }
  }catch(err){
    console.error("Error al mostrar contenido:", err);
    body.innerHTML = "<p>Error al descifrar o mostrar el contenido.</p>";
  }
}

// ------------ SHOW PROFILE (por ID) -------------
function showProfile(id){
  // lookup por id
  const rec = usersById[id];
  if(!rec){
    alert("Perfil no encontrado.");
    return;
  }

  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("profile").classList.remove("hidden");

  const container = document.getElementById("profile-body");
  container.innerHTML = "";

  // Render básico
  const addRow = (label, value) => {
    const div = document.createElement("div"); div.className = "profile-row";
    div.innerHTML = "<strong>"+escapeHtml(label)+":</strong> " + (value !== undefined && value !== null ? escapeHtml(String(value)) : "<em>-</em>");
    container.appendChild(div);
  };

  addRow("Nombre de usuario", rec.username || rec.name || "-");
  addRow("ID", rec.id || "-");
  addRow("Nivel de acceso", rec.level || "-");
  addRow("Departamento", rec.department || "-");
  addRow("Fecha de unión", rec.joinDate || "-");
  // proyectos (list)
  const proj = rec.projects || [];
  const projDiv = document.createElement("div"); projDiv.className = "profile-row";
  projDiv.innerHTML = "<strong>Proyectos:</strong>";
  if(proj.length){
    const ul = document.createElement("ul");
    proj.forEach(p=>{
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    });
    projDiv.appendChild(ul);
  } else {
    projDiv.innerHTML += " <em>ninguno</em>";
  }
  container.appendChild(projDiv);

  // notas administrativas (allow multi-line)
  const notes = rec.adminNotes || "";
  const notesDiv = document.createElement("div"); notesDiv.className = "profile-row";
  notesDiv.innerHTML = "<strong>Notas de administración:</strong><div style='margin-top:6px;background:rgba(255,255,255,0.02);padding:8px;border-radius:4px;white-space:pre-wrap;'>"+escapeHtml(notes)+"</div>";
  container.appendChild(notesDiv);

  // avisos
  addRow("Cantidad de avisos", rec.warnings !== undefined ? rec.warnings : 0);

  // campos extra sugeridos (roles, permisos)
  addRow("Roles / Permisos", (rec.roles && rec.roles.join) ? rec.roles.join(", ") : (rec.roles || "-"));

  // historial mínimo
  if(rec.history && rec.history.length){
    const histDiv = document.createElement("div"); histDiv.className = "profile-row";
    histDiv.innerHTML = "<strong>Historial (últimos eventos):</strong>";
    const ul = document.createElement("ul");
    rec.history.forEach(h=>{
      const li = document.createElement("li");
      li.textContent = (h.date ? h.date + " — " : "") + (h.note || h.action || JSON.stringify(h));
      ul.appendChild(li);
    });
    histDiv.appendChild(ul);
    container.appendChild(histDiv);
  }

  // acciones administrativas (solo visual; no seguras sin backend)
  const adminRow = document.createElement("div"); adminRow.className = "profile-row";
  adminRow.innerHTML = "<strong>Acciones:</strong> <button onclick='printProfile(\""+escapeHtml(rec.id)+"\")'>Imprimir perfil</button> <button onclick='exportProfile(\""+escapeHtml(rec.id)+"\")'>Exportar (JSON)</button>";
  container.appendChild(adminRow);
}

// simple escape
function escapeHtml(s){
  return s.replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

// export profile as downloadable JSON
function exportProfile(id){
  const rec = usersById[id];
  if(!rec) return alert("No encontrado");
  const blob = new Blob([JSON.stringify(rec, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = (rec.username||"profile")+"-"+id+".json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// print profile
function printProfile(id){
  const rec = usersById[id];
  if(!rec) return alert("No encontrado");
  const w = window.open("about:blank","_blank");
  const html = "<pre style='color:#111;background:#fff;padding:20px;font-family:monospace;'>"+escapeHtml(JSON.stringify(rec, null, 2))+"</pre>";
  w.document.write(html); w.document.close();
}
