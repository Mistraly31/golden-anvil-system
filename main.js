document.addEventListener("DOMContentLoaded", () => {

  let data = null;
  let userData = null;
  let currentUser = null;

  const loginBtn = document.getElementById("loginBtn");
  loginBtn.addEventListener("click", login);

  // ================== CARGA DE JSON ==================
  Promise.all([
    fetch("data.json").then(r => r.json()),
    fetch("users_data.json").then(r => r.json())
  ])
  .then(([d, u]) => { data = d; userData = u; })
  .catch(err => alert("Error al cargar los datos: " + err));

  // ================== LOGIN ==================
  function login() {
    if (!data) { alert("Esperando datos..."); return; }
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const user = data.users[username];
    if (!user) { showLoginError(); return; }

    const decoded = atob(user.password);
    if (password === decoded) {
      currentUser = { ...user, name: username };
      document.getElementById("login").classList.add("hidden");
      showMain();
    } else { showLoginError(); }
  }

  function showLoginError() {
    document.getElementById("login-error").classList.remove("hidden");
  }

  function logout() {
    currentUser = null;
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("main").classList.add("hidden");
    document.getElementById("content").classList.add("hidden");
    document.getElementById("profile").classList.add("hidden");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-error").classList.add("hidden");
  }

  // ================== MAIN ==================
  window.showMain = function() {
    if (!currentUser) return logout();
    document.getElementById("main").classList.remove("hidden");
    document.getElementById("content").classList.add("hidden");
    document.getElementById("profile").classList.add("hidden");

    document.getElementById("account-name").innerText = currentUser.name;
    document.getElementById("account-id").innerText = "ID: " + currentUser.id;
    document.getElementById("account-level").innerText = "Nivel: " + currentUser.level;

    document.getElementById("account-name").onclick = () => showProfile(currentUser.id);

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
  }

  // ================== PERFIL ==================
  function showProfile(id) {
    document.getElementById("main").classList.add("hidden");
    document.getElementById("content").classList.add("hidden");
    document.getElementById("profile").classList.remove("hidden");

    const u = Object.values(userData).find(v => v.nombre === currentUser.name);
    if (!u) { document.getElementById("profile-body").innerText = "Perfil no encontrado."; return; }

    let html = `<p>Nombre: ${u.nombre}</p>`;
    html += `<p>ID: ${id}</p>`;
    html += `<p>Nivel: ${u.nivel}</p>`;
    html += `<p>Departamento: ${u.departamento}</p>`;
    html += `<p>Fecha de unión: ${u.fecha_union}</p>`;
    html += `<p>Proyectos: ${u.proyectos.join(", ")}</p>`;
    html += `<p>Notas administración: ${u.notas_admin}</p>`;
    html += `<p>Avisos: ${u.avisos}</p>`;
    html += `<p>Estado: ${u.estado}</p>`;

    document.getElementById("profile-body").innerHTML = html;
  }

  // ================== CONTENIDO ==================
  window.showContent = function(link) {
    document.getElementById("main").classList.add("hidden");
    document.getElementById("profile").classList.add("hidden");
    document.getElementById("content").classList.remove("hidden");
    document.getElementById("content-title").innerText = link.name;

    const body = document.getElementById("content-body");
    body.innerHTML = "";

    if (link.type === "text") {
      body.innerHTML = "<p>" + link.content + "</p>";
    } else if (link.type === "external") {
      const btn = document.createElement("button");
      btn.innerText = "Abrir contenido externo";
      btn.onclick = () => window.open(link.url, "_blank");
      body.appendChild(btn);
    } else if (link.type === "enc") {
      const decrypted = decryptMulti(link.payload, link.layers, link.meta);
      body.innerHTML = "<p>" + decrypted + "</p>";
    }
  }

  // ================== DESCIFRADO MULTI ==================
  function decryptMulti(payload, layers, meta) {
    let data = payload;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer === "base64") data = atob(data);
      else if (layer === "caesar") {
        const shift = meta.caesarShift || 0;
        data = data.split('').map(c => String.fromCharCode(c.charCodeAt(0) - shift)).join('');
      } else if (layer === "xor") {
        const key = meta.key || meta.keyName || "k";
        data = data.split('').map((c, idx) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(idx % key.length))).join('');
      }
    }
    return data;
  }

});
