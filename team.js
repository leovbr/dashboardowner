(() => {
  "use strict";
  const USERS_KEY = "dashboardowner_proto_users_v1";
  const ROLES = { manager: "Manager", kitchen: "Kitchen", waiter: "Waiter / Penjual" };
  const $ = id => document.getElementById(id);
  const readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (_) { return []; } };
  const saveUsers = list => localStorage.setItem(USERS_KEY, JSON.stringify(list));
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const code = () => Math.random().toString(36).slice(2,6).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
  const slug = v => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,".").replace(/^\.|\.$/g,"").slice(0,24) || "staff";
  function styles() {
    if ($("teamStyles")) return;
    const s = document.createElement("style"); s.id = "teamStyles";
    s.textContent = ".team-wrap{display:grid;gap:16px;margin:18px 0}.team-card{padding:18px;border:1px solid #263653;border-radius:18px;background:#0a1120}.team-heading{margin-bottom:15px}.team-heading h3{font-size:18px;margin-top:5px}.team-form{display:grid;gap:12px}.team-form label{display:grid;gap:6px;color:#9aabc4;font-size:12px}.team-form input,.team-form select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #2a3855;border-radius:11px;background:#080f1d;color:#eef4ff;font:inherit}.team-note{font-size:12px;color:#8495ae;line-height:1.55;margin-top:12px}.team-list{display:grid;gap:9px}.team-row{display:grid;gap:12px;padding:13px;border:1px solid #25334e;border-radius:13px;background:#0b1424}.team-main b,.team-main small{display:block;overflow-wrap:anywhere}.team-main small{font-size:12px;color:#92a2bb;margin-top:4px}.team-actions{display:flex;gap:7px;flex-wrap:wrap}.team-actions button{flex:1;padding:9px 8px;border:1px solid #34435e;border-radius:9px;background:#111e33;color:#d7e4fb;font-size:12px}.team-credential{margin-top:12px;padding:14px;border-radius:12px;background:#102642;border:1px solid #284e78;line-height:1.8;overflow-wrap:anywhere}.team-credential code{font-weight:800;color:#c8dcff}.team-info-modal{position:fixed;inset:0;z-index:99999;background:#020812bb;display:grid;place-items:center;padding:18px}.team-info-dialog{width:min(430px,100%);background:#0b1a2b;border:1px solid #315073;border-radius:18px;padding:20px;color:#edf5ff}.team-info-dialog h3{margin-bottom:14px}.team-info-dialog p{padding:9px 0;border-bottom:1px solid #ffffff12;overflow-wrap:anywhere}.team-info-dialog button{margin-top:15px;width:100%}@media(min-width:760px){.team-wrap{grid-template-columns:1fr 1fr}.team-row{align-content:start}}";
    document.head.appendChild(s);
  }
  function render() {
    styles();
    const menu=$("sideMenu"); if(menu){menu.classList.remove("open");menu.setAttribute("aria-hidden","true");}
    const toggle=$("menuToggle");if(toggle)toggle.setAttribute("aria-expanded","false");
    const app = $("app"); if (!app) return;
    app.innerHTML = '<p class="eyebrow dashboard-eyebrow">TEAM ACCESS</p><h2>Tim &amp; Akun</h2><p class="sub">Buat dan kelola akun Manager, Kitchen, dan Waiter / Penjual. Alurnya mengikuti repository sebelumnya.</p><div class="team-wrap"><section class="team-card"><div class="team-heading"><span class="eyebrow">BUAT AKUN</span><h3>Karyawan Baru</h3></div><form id="teamForm" class="team-form"><label>Nama karyawan<input id="teamName" required maxlength="80" placeholder="Contoh: Budi"></label><label>Bagian<select id="teamRole"><option value="manager">Manager</option><option value="kitchen">Kitchen</option><option value="waiter">Waiter / Penjual</option></select></label><label>Nomor WhatsApp<input id="teamPhone" type="tel" required maxlength="24" placeholder="08xxxxxxxxxx"></label><label>Kode toko / warung<input id="teamStore" required maxlength="40" placeholder="Contoh: AYAMKFC01"></label><button class="btn" type="submit">+ Buat Akun Karyawan</button></form><p class="team-note">Prototype lokal: akun hanya tersimpan di browser ini. Untuk login lintas perangkat perlu Supabase/backend.</p><div id="teamCredential"></div></section><section class="team-card"><div class="team-heading"><span class="eyebrow">AKUN STAFF</span><h3 id="teamCount">0 akun</h3></div><div id="teamList" class="team-list"></div></section></div><button class="btn secondary" id="teamBack" type="button">Kembali ke Dashboard</button>';
    $("teamBack").onclick = () => window.location.reload();
    $("teamForm").onsubmit = e => {
      e.preventDefault();
      const name=$("teamName").value.trim(), role=$("teamRole").value, phone=$("teamPhone").value.trim(), store=$("teamStore").value.trim().toUpperCase();
      if(!name||!phone||!store)return;
      const list=readUsers(); let base=slug(name),username=base,n=2;
      while(list.some(u=>u.username===username)) username=base+n++;
      const password=code();
      list.push({id:"staff-"+Date.now().toString(36),username,password,role,name,phone,storeCode:store,createdBy:(JSON.parse(localStorage.getItem("dashboardowner_proto_session_v1")||"{}").username||""),createdAt:new Date().toISOString(),active:true});
      saveUsers(list);
      $("teamCredential").innerHTML='<div class="team-credential"><b>AKUN BERHASIL DIBUAT</b><br>Username: <code>'+esc(username)+'</code><br>Password: <code>'+esc(password)+'</code><br>Bagian: <b>'+esc(ROLES[role])+'</b><br>Kode toko: <code>'+esc(store)+'</code><p class="team-note">Simpan kredensial ini dan berikan kepada karyawan.</p></div>';
      e.currentTarget.reset(); drawList();
    };
    drawList();
  }
  function drawList() {
    const el=$("teamList"); if(!el)return;
    const list=readUsers().filter(u=>u.role && u.role!=="owner");
    $("teamCount").textContent=list.length+" akun";
    el.innerHTML=list.length?list.map(u=>'<div class="team-row"><div class="team-main"><b>'+esc(u.name||u.username)+'</b><small>'+esc(ROLES[u.role]||u.role)+' · '+esc(u.phone||"-")+' · Toko '+esc(u.storeCode||"-")+'</small><small>Status: '+(u.active===false?"Nonaktif":"Aktif")+'</small></div><div class="team-actions"><button type="button" data-team-info="'+esc(u.username)+'">Info</button><button type="button" data-team-reset="'+esc(u.username)+'">Reset Password</button><button type="button" data-team-toggle="'+esc(u.username)+'">'+(u.active===false?"Aktifkan":"Nonaktifkan")+'</button></div></div>').join(""):'<div class="empty-state">Belum ada akun karyawan.</div>';
    el.querySelectorAll("[data-team-info]").forEach(b=>b.onclick=()=>showInfo(b.dataset.teamInfo));
    el.querySelectorAll("[data-team-reset]").forEach(b=>b.onclick=()=>resetPassword(b.dataset.teamReset));
    el.querySelectorAll("[data-team-toggle]").forEach(b=>b.onclick=()=>toggleStaff(b.dataset.teamToggle));
  }
  function showInfo(username) {
    const u=readUsers().find(x=>x.username===username);if(!u)return;
    const m=document.createElement("div");m.className="team-info-modal";
    m.innerHTML='<section class="team-info-dialog"><h3>Informasi Akun</h3><p><b>Nama:</b> '+esc(u.name||"-")+'</p><p><b>Bagian:</b> '+esc(ROLES[u.role]||u.role||"-")+'</p><p><b>WhatsApp:</b> '+esc(u.phone||"-")+'</p><p><b>Kode toko:</b> '+esc(u.storeCode||"-")+'</p><p><b>Username:</b> '+esc(u.username)+'</p><button class="btn" type="button">Tutup</button></section>';
    document.body.appendChild(m);m.querySelector("button").onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove();};
  }
  function resetPassword(username) {
    const list=readUsers(),u=list.find(x=>x.username===username);if(!u)return;
    const password=code();u.password=password;saveUsers(list);
    alert("Password baru untuk "+u.name+":\n\n"+password);
  }
  function toggleStaff(username) {
    const list=readUsers(),u=list.find(x=>x.username===username);if(!u)return;
    const disable=u.active!==false;
    if(!confirm((disable?"Nonaktifkan":"Aktifkan")+" akun "+u.name+"?"))return;
    u.active=!disable;saveUsers(list);drawList();
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest('[data-nav="team"]');if(b){e.preventDefault();e.stopPropagation();render();}
  },true);
  window.addEventListener("dashboardowner:team",render);
})();