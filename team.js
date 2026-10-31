(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const roleNames = { manager: "Manager", kitchen: "Kitchen", waiter: "Waiter / Penjual" };
  const slug = v => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,".").replace(/^\.|\.$/g,"").slice(0,24) || "staff";
  const randomPin = () => { const bytes=new Uint8Array(10); crypto.getRandomValues(bytes); const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from(bytes,b=>chars[b%chars.length]).join(""); };
  function styles(){
    if($("teamStyles"))return;
    const s=document.createElement("style");s.id="teamStyles";
    s.textContent=".team-wrap{display:grid;gap:16px;margin:18px 0}.team-card{padding:18px;border:1px solid #263653;border-radius:18px;background:#0a1120}.team-heading{margin-bottom:15px}.team-heading h3{font-size:18px;margin-top:5px}.team-form{display:grid;gap:12px}.team-form label{display:grid;gap:6px;color:#9aabc4;font-size:12px}.team-form input,.team-form select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #2a3855;border-radius:11px;background:#080f1d;color:#eef4ff;font:inherit}.team-note{font-size:12px;color:#8495ae;line-height:1.55;margin-top:12px}.team-list{display:grid;gap:9px}.team-row{display:grid;gap:12px;padding:13px;border:1px solid #25334e;border-radius:13px;background:#0b1424}.team-main b,.team-main small{display:block;overflow-wrap:anywhere}.team-main small{font-size:12px;color:#92a2bb;margin-top:4px}.team-actions{display:flex;gap:7px;flex-wrap:wrap}.team-actions button{flex:1;padding:9px 8px;border:1px solid #34435e;border-radius:9px;background:#111e33;color:#d7e4fb;font-size:12px}.team-credential{margin-top:12px;padding:14px;border-radius:12px;background:#102642;border:1px solid #284e78;line-height:1.8;overflow-wrap:anywhere}.team-credential code{font-weight:800;color:#c8dcff}@media(min-width:760px){.team-wrap{grid-template-columns:1fr 1fr}.team-row{align-content:start}}";
    document.head.appendChild(s);
  }
  async function render(){
    styles();
    const menu=$("sideMenu");if(menu){menu.classList.remove("open");menu.setAttribute("aria-hidden","true");}
    const toggle=$("menuToggle");if(toggle)toggle.setAttribute("aria-expanded","false");
    const app=$("app");if(!app)return;
    const sb=window.dashboardSupabase;
    app.innerHTML='<h2>Tim &amp; Akun</h2><p class="sub">Memuat data tim dari Supabase...</p>';
    const {data:{user}}=await sb.auth.getUser();
    if(!user){app.innerHTML='<p class="error">Sesi owner tidak ditemukan. Silakan login ulang.</p>';return;}
    const {data:owner,error}=await sb.from("profiles").select("store_id,role").eq("id",user.id).single();
    if(error||owner.role!=="owner"||!owner.store_id){app.innerHTML='<p class="error">Akses halaman ini hanya untuk Owner.</p>';return;}
    const {data:store}=await sb.from("stores").select("business_code,name").eq("id",owner.store_id).single();
    app.innerHTML='<h2>Tim &amp; Akun</h2><div class="team-wrap"><section class="team-card"><div class="team-heading"><span class="eyebrow">BUAT AKUN</span><h3>Karyawan Baru</h3></div><form id="teamForm" class="team-form"><label>Nama karyawan<input id="teamName" required maxlength="80" placeholder="Contoh: Budi"></label><label>Username<input id="teamUsername" required minlength="3" maxlength="32" placeholder="Contoh: budi"></label><label>Bagian<select id="teamRole"><option value="manager">Manager</option><option value="kitchen">Kitchen</option><option value="waiter">Waiter / Penjual</option></select></label><label>Nomor WhatsApp<input id="teamPhone" type="tel" required maxlength="24" placeholder="08xxxxxxxxxx"></label><label>Kode toko<input value="'+esc(store?.business_code||"")+'" readonly></label><button class="btn" type="submit">+ Buat Akun Karyawan</button></form><div id="teamCredential"></div></section><section class="team-card"><div class="team-heading"><span class="eyebrow">AKUN STAFF</span><h3 id="teamCount">0 akun</h3></div><div id="teamList" class="team-list">Memuat...</div></section></div><button class="btn secondary" id="teamBack" type="button">Kembali ke Dashboard</button>';
    $("teamBack").onclick=()=>window.location.reload();
    $("teamForm").onsubmit=async e=>{
      e.preventDefault();
      const name=$("teamName").value.trim(),username=$("teamUsername").value.trim().toLowerCase(),role=$("teamRole").value,phone=$("teamPhone").value.trim(),pin=randomPin(),button=e.currentTarget.querySelector("button[type=submit]");
      if(!/^[a-z0-9._-]{3,32}$/.test(username)){alert("Username 3–32 karakter: huruf kecil, angka, titik, _ atau -.");return;}
      button.disabled=true;button.textContent="Membuat akun...";
      try{
        const {data,error}=await sb.functions.invoke("staff-admin",{body:{action:"create",name,username,role,phone,businessCode:store.business_code,pin}});
        if(error)throw error;if(data?.error)throw new Error(data.error);
        $("teamCredential").innerHTML='<div class="team-credential"><b>AKUN BERHASIL DIBUAT</b><br>Username: <code>'+esc(username)+'</code><br>PIN awal: <code>'+esc(pin)+'</code><br>Bagian: <b>'+esc(roleNames[role])+'</b><br>Kode toko: <code>'+esc(store.business_code)+'</code><p class="team-note">Simpan kredensial ini dan berikan kepada karyawan. PIN hanya ditampilkan sekarang.</p></div>';
        e.currentTarget.reset();await drawList(sb,owner.store_id);
      }catch(err){alert(err.message||"Gagal membuat akun staff.");}
      finally{button.disabled=false;button.textContent="+ Buat Akun Karyawan";}
    };
    await drawList(sb,owner.store_id);
  }
  async function drawList(sb,storeId){
    const el=$("teamList");if(!el)return;
    const {data:list,error}=await sb.from("profiles").select("id,full_name,username,phone,role,is_active").eq("store_id",storeId).neq("role","owner").order("created_at",{ascending:false});
    if(error){el.textContent="Gagal memuat akun staff: "+error.message;return;}
    $("teamCount").textContent=(list||[]).length+" akun";
    el.innerHTML=list?.length?list.map(u=>'<div class="team-row"><div class="team-main"><b>'+esc(u.full_name||u.username)+'</b><small>'+esc(roleNames[u.role]||u.role)+' · '+esc(u.phone||"-")+'</small><small>Status: '+(u.is_active?"Aktif":"Nonaktif")+' · Username: '+esc(u.username)+'</small></div><div class="team-actions"><button type="button" data-reset="'+esc(u.id)+'">Reset PIN</button><button type="button" data-toggle="'+esc(u.id)+'" data-active="'+(!u.is_active)+'">'+(u.is_active?"Nonaktifkan":"Aktifkan")+'</button></div></div>').join(""):'<p class="team-note">Belum ada akun staff.</p>';
    el.querySelectorAll("[data-reset]").forEach(b=>b.onclick=async()=>{
      if(!confirm("Reset PIN akun ini? PIN baru akan ditampilkan sekali."))return;
      const pin=randomPin();const {data,error}=await sb.functions.invoke("staff-admin",{body:{action:"reset_pin",staffId:b.dataset.reset,pin}});
      if(error||data?.error){alert(error?.message||data?.error||"Gagal reset PIN.");return;}
      alert("PIN baru: "+pin+"\nSimpan dan berikan kepada karyawan.");
    });
    el.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=async()=>{
      const active=b.dataset.active==="true";if(!confirm((active?"Aktifkan":"Nonaktifkan")+" akun staff ini?"))return;
      const {data,error}=await sb.functions.invoke("staff-admin",{body:{action:"toggle",staffId:b.dataset.toggle,active}});
      if(error||data?.error){alert(error?.message||data?.error||"Gagal memperbarui akun.");return;}
      await drawList(sb,storeId);
    });
  }
  document.addEventListener("click",e=>{const b=e.target.closest('[data-nav="team"]');if(b){e.preventDefault();e.stopPropagation();render();}},true);
  window.addEventListener("dashboardowner:team",render);
})();