# Dashboard Owner

Fondasi awal pembangunan ulang aplikasi manajemen usaha. Repository lama `owner-dashboardV2` harus tetap dipertahankan sebagai referensi dan cadangan.

## Status
- [x] Kerangka UI responsif.
- [x] Prototype register, login, dan logout.
- [x] Logout menghapus sesi dan langsung menampilkan layar login tanpa reload.
- [ ] Uji manual di GitHub Pages dan beberapa browser/perangkat.
- [ ] Audit dan migrasi modul bisnis lama satu per satu.
- [ ] Rancang autentikasi dan penyimpanan server yang aman sebelum penggunaan produksi.

## Berkas
- `index.html` — halaman aplikasi.
- `auth.css` — tampilan responsif.
- `auth.js` — alur autentikasi prototype lokal.

## Uji awal
1. Buka aplikasi.
2. Pilih **Buat akun**, isi nama, username dan password minimal 6 karakter.
3. Pastikan dashboard tampil setelah registrasi.
4. Klik **Logout**; layar login harus langsung tampil tanpa reload.
5. Login lagi dengan akun yang sama.
6. Coba username/password yang salah dan pastikan pesan error muncul.

## Batasan penting
Prototype ini menyimpan daftar akun dan password dalam `localStorage`. Itu **bukan autentikasi aman**: data hanya ada di browser/perangkat yang sama, password tidak di-hash, dan tidak ada sinkronisasi antar perangkat. Gunakan hanya untuk menguji alur UI, jangan gunakan password asli atau data usaha sensitif. Sebelum dipakai sungguhan, implementasikan autentikasi server (misalnya Supabase Auth) dan aturan akses database yang benar.

## GitHub Pages
Repository bernama `dashboardowner` dapat dipublikasikan melalui **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Setelah deployment selesai, URL biasanya `https://leovbr.github.io/dashboardowner/`.

Jangan menghapus repository lama atau menimpa data lama sebelum versi baru diuji dan rencana migrasinya disepakati.
