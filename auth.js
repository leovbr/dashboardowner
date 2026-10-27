(() => {
  "use strict";
  const USERS_KEY = "dashboardowner_proto_users_v1";
  const SESSION_KEY = "dashboardowner_proto_session_v1";
  const app = document.getElementById("app");
  let mode = "login";

  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  };
  const users = () => read(USERS_KEY, []);
  const session = () => read(SESSION_KEY, null);
  const setError = (message) => { const el = document.getElementById("error"); if (el) el.textContent = message || ""; };

  function renderAuth() {
    app.innerHTML = `
      <h2>${mode === "login" ? "Selamat datang" : "Buat akun owner"}</h2>
      <p class="sub">${mode === "login" ? "Masuk untuk melanjutkan ke dashboard." : "Buat akun lokal untuk menguji alur autentikasi."}</p>
      <form id="auth-form" novalidate>
        ${mode === "register" ? '<label class="field"><span>Nama owner</span><input name="name" autocomplete="name" maxlength="60" required placeholder="Nama kamu"></label>' : ""}
        <label class="field"><span>Username</span><input name="username" autocomplete="username" minlength="3" maxlength="32" required placeholder="Masukkan username"></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="6" required placeholder="Minimal 6 karakter"></label>
        <p id="error" class="error" role="alert"></p>
        <button class="btn" type="submit">${mode === "login" ? "Masuk ke dashboard" : "Buat akun"}</button>
      </form>
      <button id="switch-mode" class="switch" type="button">${mode === "login" ? "Belum punya akun? Buat akun" : "Sudah punya akun? Login"}</button>
      <div class="notice">Prototype pengujian: akun disimpan di browser ini saja. Jangan gunakan password asli atau data usaha produksi.</div>
    `;
    document.getElementById("switch-mode").addEventListener("click", () => { mode = mode === "login" ? "register" : "login"; renderAuth(); });
    document.getElementById("auth-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const username = String(form.get("username") || "").trim().toLowerCase();
      const password = String(form.get("password") || "");
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) return setError("Username 3–32 karakter: huruf, angka, titik, _ atau -.");
      if (password.length < 6) return setError("Password minimal 6 karakter.");
      const allUsers = users();
      if (mode === "register") {
        const name = String(form.get("name") || "").trim();
        if (!name) return setError("Nama owner wajib diisi.");
        if (allUsers.some(user => user.username === username)) return setError("Username sudah digunakan di browser ini.");
        allUsers.push({ username, password, name, createdAt: new Date().toISOString() });
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
      } else {
        const found = allUsers.find(user => user.username === username && user.password === password);
        if (!found) return setError("Username atau password tidak cocok.");
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username, signedInAt: new Date().toISOString() }));
      render();
    });
  }

  function renderDashboard() {
    const current = session();
    const user = users().find(item => item.username === current?.username);
    if (!user) { localStorage.removeItem(SESSION_KEY); renderAuth(); return; }
    app.innerHTML = `
      <p class="eyebrow" style="margin-top:0">OWNER WORKSPACE</p>
      <h2>Dashboard</h2>
      <p class="welcome">Halo, <strong id="owner-name"></strong>. Fondasi autentikasi aktif di browser ini.</p>
      <span class="pill">Login berhasil · Prototype</span>
      <div class="stats">
        <div class="stat"><small>Penjualan hari ini</small><strong>—</strong></div>
        <div class="stat"><small>Pengeluaran</small><strong>—</strong></div>
        <div class="stat"><small>Produk</small><strong>Belum dimigrasi</strong></div>
        <div class="stat"><small>Tim</small><strong>Belum dimigrasi</strong></div>
      </div>
      <p class="sub">Ini baru kerangka autentikasi. Modul lama belum dipindahkan dan belum ada data usaha yang diimpor.</p>
      <button id="logout" class="btn secondary" type="button">Logout</button>
      <div class="notice">Data akun disimpan lokal dan tidak aman untuk produksi. Jangan masukkan informasi sensitif.</div>
    `;
    document.getElementById("owner-name").textContent = user.name || user.username;
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      mode = "login";
      renderAuth();
    });
  }

  function render() {
    if (session()) renderDashboard();
    else renderAuth();
  }
  render();
})();