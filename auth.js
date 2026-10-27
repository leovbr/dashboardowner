(() => {
  "use strict";
  const USERS_KEY = "dashboardowner_proto_users_v1";
  const SESSION_KEY = "dashboardowner_proto_session_v1";
  const PROFILE_KEY = "dashboardowner_profile_v1";
  const app = document.getElementById("app");
  let mode = "login";
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const users = () => read(USERS_KEY, []);
  const session = () => read(SESSION_KEY, null);
  const profile = () => read(PROFILE_KEY, {});
  const setError = message => { const el = document.getElementById("error"); if (el) el.textContent = message || ""; };
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderAuth() {
    document.getElementById("topbar").hidden = true;
    document.getElementById("brandIntro").hidden = false;
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
      <div class="notice">Prototype: akun tersimpan di browser ini saja. Jangan gunakan password asli atau data usaha produksi.</div>`;
    document.getElementById("switch-mode").addEventListener("click", () => { mode = mode === "login" ? "register" : "login"; renderAuth(); });
    document.getElementById("auth-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const username = String(form.get("username") || "").trim().toLowerCase();
      const password = String(form.get("password") || "");
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) return setError("Username 3–32 karakter: huruf, angka, titik, _ atau -.");
      if (password.length < 6) return setError("Password minimal 6 karakter.");
      const allUsers = users();
      let user;
      if (mode === "register") {
        const name = String(form.get("name") || "").trim();
        if (!name) return setError("Nama owner wajib diisi.");
        if (allUsers.some(item => item.username === username)) return setError("Username sudah digunakan di browser ini.");
        user = { username, password, name, createdAt: new Date().toISOString() };
        allUsers.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        localStorage.setItem(PROFILE_KEY, JSON.stringify({ ownerName: name, businessName: "", businessPhone: "", businessDesc: "", avatar: "" }));
      } else {
        user = allUsers.find(item => item.username === username && item.password === password);
        if (!user) return setError("Username atau password tidak cocok.");
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, signedInAt: new Date().toISOString() }));
      render();
    });
  }
  function renderDashboard() {
    const current = session();
    const user = users().find(item => item.username === current?.username);
    if (!user) { localStorage.removeItem(SESSION_KEY); renderAuth(); return; }
    const p = profile();
    document.getElementById("topbar").hidden = false;
    document.getElementById("brandIntro").hidden = true;
    document.getElementById("topbarBusinessName").textContent = p.businessName || "Owner Dashboard";
    const accountBtn = document.getElementById("accountButtonNative");
    accountBtn.innerHTML = p.avatar ? '<img src="' + p.avatar + '" alt="Foto profil">' : "👤";
    app.innerHTML = `
      <p class="eyebrow dashboard-eyebrow">OWNER WORKSPACE</p>
      <h2 id="dashboardTitle">${escapeHtml(p.businessName || "Dashboard")}</h2>
      <p class="welcome">Halo, <strong>${escapeHtml(p.ownerName || user.name || user.username)}</strong>. Selamat datang di dashboard usaha.</p>
      <span class="pill">Login berhasil · Prototype</span>
      <div class="stats">
        <div class="stat"><small>Penjualan hari ini</small><strong>—</strong></div>
        <div class="stat"><small>Pengeluaran</small><strong>—</strong></div>
        <div class="stat"><small>Produk</small><strong>Belum dimigrasi</strong></div>
        <div class="stat"><small>Tim</small><strong>Belum dimigrasi</strong></div>
      </div>
      <p class="sub">Kerangka dashboard. Modul operasional dari repository lama belum dimigrasikan.</p>
      <div class="notice">Data akun masih tersimpan lokal dan belum aman untuk produksi. Jangan masukkan informasi sensitif.</div>`;
    bindNavigation();
  }
  function closeMenu() {
    const menu = document.getElementById("sideMenu");
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
    document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  }
  function bindNavigation() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("sideMenu");
    toggle.onclick = event => { event.stopPropagation(); const open = !menu.classList.contains("open"); menu.classList.toggle("open", open); menu.setAttribute("aria-hidden", String(!open)); toggle.setAttribute("aria-expanded", String(open)); };
    document.getElementById("menuClose").onclick = closeMenu;
    document.querySelectorAll("[data-nav]").forEach(button => button.onclick = () => {
      closeMenu();
      const page = button.dataset.nav;
      const names = {home:"Dashboard",sales:"Penjualan",products:"Produk & Harga",reports:"Riwayat Laporan"};
      if (page === "home") return renderDashboard();
      app.innerHTML = '<p class="eyebrow dashboard-eyebrow">MODUL</p><h2>' + names[page] + '</h2><p class="sub">Modul ini belum dimigrasikan dari repository sebelumnya.</p><button class="btn secondary" id="back-home" type="button">Kembali ke Dashboard</button>';
      document.getElementById("back-home").onclick = renderDashboard;
    });
    document.querySelectorAll("[data-action]").forEach(button => button.onclick = () => {
      closeMenu();
      if (button.dataset.action === "profile") openProfile();
      else if (button.dataset.action === "settings") openSettings();
      else if (button.dataset.action === "logout") logout();
      else if (button.dataset.action === "backup") backupData();
      else if (button.dataset.action === "export") alert("Export CSV akan tersedia setelah modul laporan dimigrasikan.");
    });
    document.getElementById("accountButtonNative").onclick = openAccountPanel;
    document.onclick = event => { if (!event.target.closest(".menu-wrap")) closeMenu(); };
  }
  function openAccountPanel() {
    document.getElementById("account-popover")?.remove();
    const p = profile(), s = session(), u = users().find(item => item.username === s?.username) || {};
    const pop = document.createElement("div");
    pop.id = "account-popover"; pop.className = "account-popover";
    pop.innerHTML = '<div class="account-popover-head"><div class="account-avatar">' + (p.avatar ? '<img src="' + p.avatar + '" alt="">' : '👤') + '</div><div><b>' + escapeHtml(p.ownerName || u.name || u.username || "Akun") + '</b><small>Owner</small></div></div><button type="button" data-account-action="profile">✏️ Edit Profil Toko</button><button type="button" data-account-action="settings">⚙️ Pengaturan Akun</button><button type="button" data-account-action="logout">↪️ Keluar</button>';
    document.querySelector(".topbar-inner").appendChild(pop);
    pop.querySelectorAll("[data-account-action]").forEach(b => b.onclick = () => { const a=b.dataset.accountAction; pop.remove(); if(a==="profile")openProfile(); else if(a==="settings")openSettings(); else logout(); });
    setTimeout(() => document.addEventListener("click", function outside(e){ if(!pop.contains(e.target)&&e.target.id!=="accountButtonNative"){pop.remove();document.removeEventListener("click",outside);} }, {once:true}),0);
  }
  function modal(title, body) {
    document.querySelector(".ac-modal")?.remove();
    const wrap = document.createElement("div"); wrap.className="ac-modal";
    wrap.innerHTML='<section class="ac-dialog" role="dialog" aria-modal="true"><header class="ac-head"><h2>'+title+'</h2><button class="ac-close" type="button" aria-label="Tutup">×</button></header>'+body+'</section>';
    document.body.appendChild(wrap);
    wrap.querySelector(".ac-close").onclick=()=>wrap.remove();
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};
    return wrap;
  }
  function openProfile() {
    const p=profile(), s=session(), u=users().find(item=>item.username===s?.username)||{};
    const m=modal("✏️ Edit Profil Toko", '<div class="ac-avatar" id="acAvatar">'+(p.avatar?'<img src="'+p.avatar+'" alt="">':'👤')+'</div><label class="ac-upload">📷 Pilih Foto<input id="acPhoto" type="file" accept="image/*" hidden></label><form id="acForm" class="ac-form"><label>Nama toko<input id="acName" maxlength="80" value="'+escapeHtml(p.businessName)+'" placeholder="Nama toko"></label><label>Nama pemilik<input id="acOwner" maxlength="60" value="'+escapeHtml(p.ownerName||u.name)+'" placeholder="Nama pemilik"></label><label>Nomor WhatsApp<input id="acPhone" type="tel" maxlength="24" value="'+escapeHtml(p.businessPhone)+'" placeholder="08xxxxxxxxxx"></label><label>Deskripsi toko<textarea id="acDesc" maxlength="240" placeholder="Deskripsi singkat">'+escapeHtml(p.businessDesc)+'</textarea></label><button class="btn" type="submit">Simpan Profil</button></form>');
    m.querySelector("#acPhoto").onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>3*1024*1024){alert("Ukuran foto maksimal 3 MB.");e.target.value="";return;}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const canvas=document.createElement("canvas"),scale=Math.min(1,320/Math.max(img.width,img.height));canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);m.dataset.avatar=canvas.toDataURL("image/jpeg",.8);m.querySelector("#acAvatar").innerHTML='<img src="'+m.dataset.avatar+'" alt="Foto profil">';};img.src=reader.result;};reader.readAsDataURL(file);};
    m.querySelector("#acForm").onsubmit=e=>{e.preventDefault();const next={...profile(),businessName:m.querySelector("#acName").value.trim(),ownerName:m.querySelector("#acOwner").value.trim(),businessPhone:m.querySelector("#acPhone").value.trim(),businessDesc:m.querySelector("#acDesc").value.trim(),avatar:m.dataset.avatar||profile().avatar||""};localStorage.setItem(PROFILE_KEY,JSON.stringify(next));m.remove();renderDashboard();};
  }
  function openSettings() {
    const p=profile(),s=session(),u=users().find(item=>item.username===s?.username)||{};
    const m=modal("⚙️ Pengaturan Akun", '<div class="ac-item"><b>Akun aktif</b><div class="ac-note">'+escapeHtml(u.username||"—")+'</div></div><div class="ac-item"><b>Nama pemilik</b><div class="ac-note">'+escapeHtml(p.ownerName||u.name||"Belum diatur")+'</div></div><div class="ac-item"><b>WhatsApp</b><div class="ac-note">'+escapeHtml(p.businessPhone||"Belum diatur")+'</div></div><div class="ac-item"><b>Penyimpanan</b><div class="ac-note">Data tersimpan di browser/perangkat ini saja. Belum tersinkron ke perangkat lain.</div></div><div class="ac-actions"><button class="btn secondary" id="changePassword" type="button">Ubah Password</button><button class="btn secondary" id="downloadBackup" type="button">Backup Data</button></div>');
    m.querySelector("#changePassword").onclick=()=>{m.remove();openChangePassword();};
    m.querySelector("#downloadBackup").onclick=backupData;
  }
  function openChangePassword() {
    const m=modal("🔐 Ubah Password",'<form id="passwordForm" class="ac-form"><label>Password saat ini<input id="oldPassword" type="password" required autocomplete="current-password"></label><label>Password baru<input id="newPassword" type="password" required minlength="6" autocomplete="new-password"></label><label>Ulangi password baru<input id="confirmPassword" type="password" required minlength="6" autocomplete="new-password"></label><p id="passwordError" class="error" role="alert"></p><button class="btn" type="submit">Simpan Password</button></form>');
    m.querySelector("#passwordForm").onsubmit=e=>{e.preventDefault();const s=session(),list=users(),u=list.find(item=>item.username===s?.username),err=m.querySelector("#passwordError"),old=m.querySelector("#oldPassword").value,n=m.querySelector("#newPassword").value,c=m.querySelector("#confirmPassword").value;if(!u||u.password!==old){err.textContent="Password saat ini tidak cocok.";return;}if(n.length<6){err.textContent="Password baru minimal 6 karakter.";return;}if(n!==c){err.textContent="Konfirmasi password tidak sama.";return;}u.password=n;localStorage.setItem(USERS_KEY,JSON.stringify(list));m.remove();alert("Password berhasil diperbarui di browser ini.");};
  }
  function backupData() {
    const data={users:users(),profile:profile(),createdAt:new Date().toISOString(),note:"Prototype lokal. File backup berisi kredensial; simpan secara aman."};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="dashboardowner-backup.json";a.click();URL.revokeObjectURL(url);
  }
  function logout() { localStorage.removeItem(SESSION_KEY); document.getElementById("account-popover")?.remove(); document.querySelector(".ac-modal")?.remove(); mode="login";renderAuth(); }
  function render() { if(session()) renderDashboard(); else renderAuth(); }
  render();
})();