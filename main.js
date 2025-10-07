// main.js
let data = null;
let currentUser = null;

const loginBtn = document.getElementById("loginBtn");
loginBtn.addEventListener("click", login);

// cargar JSON externo (desde la misma raíz)
fetch("data.json")
  .then(r => {
    if (!r.ok) throw new Error("HTTP error " + r.status);
    return r.json();
  })
  .then(json => {
    data = json;
    console.log("data.json cargado");
  })
  .catch(err => {
    console.error("No se pudo cargar data.json:", err);
    alert("Error al cargar data.json. Si estás usando file:// abre via un servidor o usa GitHub Pages.");
  });

function login(){
  if(!data){
    alert("Esperando a cargar datos...");
    return;
  }
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const u = data.users[username];
  if(!u){ showLoginError(); return; }

  // u.password may be base64 or plain; try both safely
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
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function showMain(){
  if(!currentUser) return logout();
  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");

  // Mostrar nombre, ID y nivel (ID entre nombre y nivel)
  document.getElementById("account-name").innerText = currentUser.name;
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

async function showContent(link, idx){
  document.getElementById("main").classList.add("hidden");
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
