let data = null;
let usersData = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");

  // Cargar data.json
  fetch("data.json").then(r=>r.json()).then(json=>{ data=json; console.log("data.json cargado"); });
  // Cargar users_data.json
  fetch("users_data.json").then(r=>r.json()).then(json=>{ usersData=json; console.log("users_data.json cargado"); });

  loginBtn.addEventListener("click", login);

  // Pulsar en nombre para abrir perfil
  document.getElementById("account-name").addEventListener("click", () => {
    if(!currentUser || !usersData) return;
    showUserProfile(currentUser.id);
  });

});

function login() {
  if(!data) { alert("Datos aún no cargados."); return; }
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const user = data.users[username];
  if(!user){ document.getElementById("login-error").classList.remove("hidden"); return; }
  const decodedPass = atob(user.password);
  if(password === decodedPass){
    currentUser = { name: username, level: user.level, id: user.id };
    document.getElementById("login").classList.add("hidden");
    showMain();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

function logout() {
  currentUser = null;
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("user-profile").classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").classList.add("hidden");
}

function showMain() {
  if(!currentUser) return logout();
  document.getElementById("main").classList.remove("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("user-profile").classList.add("hidden");

  document.getElementById("account-name").innerText = currentUser.name;
  document.getElementById("account-id").innerText = "ID: " + currentUser.id;
  document.getElementById("account-level").innerText = "Nivel: " + currentUser.level;

  const linksDiv = document.getElementById("links");
  linksDiv.innerHTML = "";
  data.links.forEach(link => {
    if(currentUser.level >= link.level){
      const p = document.createElement("p");
      p.innerText = link.name;
      p.style.cursor = "pointer";
      p.onclick = () => showContent(link);
      linksDiv.appendChild(p);
    }
  });
}

function showContent(link){
  document.getElementById("main").classList.add("hidden");
  document.getElementById("user-profile").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");
  document.getElementById("content-title").innerText = link.name;
  const body = document.getElementById("content-body");
  body.innerHTML = "";

  if(link.type === "text"){ body.innerHTML="<p>"+link.content+"</p>"; }
  else if(link.type === "external"){
    const btn = document.createElement("button");
    btn.innerText="Abrir contenido externo";
    btn.onclick=()=>window.open(link.url,"_blank");
    body.appendChild(btn);
  }
  else if(link.type === "enc"){
    // decodificado básico: ejemplo XOR + base64 + caesar
    let decoded = link.payload;
    link.layers.forEach(layer=>{
      if(layer==="base64") decoded = atob(decoded);
      else if(layer==="caesar"){
        let shift = link.meta.caesarShift||0;
        decoded = decoded.split("").map(c=>String.fromCharCode(c.charCodeAt(0)-shift)).join("");
      }
      else if(layer==="xor"){
        let key = link.meta.keyName || "";
        decoded = decoded.split("").map((c,i)=>String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i%key.length))).join("");
      }
    });
    body.innerHTML="<pre>"+decoded+"</pre>";
  }
}

function showUserProfile(id){
  if(!usersData || !usersData[id]) { alert("No hay información para este usuario."); return; }
  document.getElementById("main").classList.add("hidden");
  document.getElementById("content").classList.add("hidden");
  document.getElementById("user-profile").classList.remove("hidden");

  const u = usersData[id];
  const profileDiv = document.getElementById("profile-info");
  profileDiv.innerHTML = `
    <strong>Nombre:</strong> ${u.nombre}<br>
    <strong>ID:</strong> ${id}<br>
    <strong>Nivel:</strong> ${u.nivel}<br>
    <strong>Departamento:</strong> ${u.departamento}<br>
    <strong>Fecha de unión:</strong> ${u.fecha_union}<br>
    <strong>Proyectos:</strong> ${u.proyectos.join(", ")}<br>
    <strong>Notas de administración:</strong> ${u.notas_admin}<br>
    <strong>Avisos:</strong> ${u.avisos}<br>
    <strong>Estado:</strong> ${u.estado}
  `;
}
