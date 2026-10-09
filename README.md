# Our Little Photobooth — Yosia & Tio

Website kenangan bertema pink untuk **Yosia Pratama Simanjuntak** dan **Tio Gokmaria Br. Sagala**. Galeri dapat dilihat publik, sedangkan upload foto dibatasi ke akun Google yang diizinkan lewat Firebase Authentication dan Cloud Storage Security Rules.

## Fitur
- Landing page personal bertema pink scrapbook, responsif untuk HP dan desktop.
- Galeri foto publik dari Firebase Storage.
- Google Sign-In untuk uploader.
- Hanya email allowlist yang bisa mengunggah. Rules memvalidasi email terverifikasi, format gambar, dan ukuran di bawah 8 MB.
- Upload foto tidak dapat diubah atau dihapus melalui website.
- Firebase Hosting untuk URL publik.

## 1. Buat project dan daftarkan aplikasi Web
1. Buka https://console.firebase.google.com/ lalu buat project baru.
2. Project settings → General → Your apps → ikon Web (`</>`) → daftarkan `Our Little Photobooth`.
3. Salin konfigurasi aplikasi Web.
4. Buka `app.js` dan ganti nilai `GANTI_...` di `firebaseConfig`. Salin `storageBucket` persis seperti yang ditampilkan Console. Jangan pernah menaruh service-account/private key di website.
5. Di Build → Storage, buat bucket. Periksa persyaratan paket dan billing yang ditampilkan Firebase sebelum melanjutkan.

## 2. Aktifkan Google Sign-In
1. Firebase Console → Build → Authentication → Get started.
2. Tab Sign-in method (atau Sign-in providers) → pilih **Google** → Enable → Save.
3. Di Authentication → Settings → Authorized domains, pastikan domain lokal/publik yang digunakan tercantum. Setelah deploy, tambahkan domain `PROJECT_ID.web.app` atau domain custom bila belum ada.
4. Login hanya dipakai untuk uploader. Pengunjung galeri tidak perlu login.

## 3. Tentukan email uploader yang diizinkan
Pilih alamat Gmail/akun Google yang benar-benar dipercaya. Di bawah ini ada dua placeholder yang harus diganti.

**A. Di `app.js`**, cari: `ALLOWED_UPLOADER_EMAILS` lalu ganti contoh `uploader1@example.com` dan `uploader2@example.com` dengan alamat email sebenarnya, gunakan huruf kecil. Jika hanya satu uploader, hapus baris kedua beserta koma yang tidak diperlukan.

**B. Di `storage.rules`**, ganti dua email contoh di daftar `request.auth.token.email in [...]` dengan daftar email yang sama persis seperti di `app.js`. Rules di server adalah pengaman utama; mengubah daftar di `app.js` saja tidak memberikan akses upload.

Contoh: jika uploader adalah `yosia@gmail.com` dan `tio@gmail.com`, masukkan dua alamat tersebut di kedua file. Jangan tulis password.

## 4. Storage Security Rules
File `storage.rules` sudah disertakan. Aturan yang disiapkan: siapa saja boleh membaca foto di folder `memories`; hanya akun yang login dengan email terverifikasi dan ada di allowlist yang boleh membuat file gambar JPG/PNG/WebP/GIF di bawah 8 MB; tidak ada izin update atau delete melalui client.

Setelah mengganti email, terbitkan aturan ke Firebase dengan perintah `firebase deploy --only storage` dari folder project. Bisa juga menyalin isi `storage.rules` ke Storage → Rules lalu klik Publish, tetapi pastikan file dan Console tetap sama.

**Privasi:** karena galeri publik, foto bisa dilihat dan diunduh siapa saja. Jangan unggah foto tanpa persetujuan orang yang ada di dalamnya. Allowlist melindungi upload, bukan kerahasiaan foto.

## 5. Deploy ke Firebase Hosting
1. Install Node.js LTS dari https://nodejs.org/.
2. Buka terminal di folder yang berisi `index.html`, `firebase.json`, dan `storage.rules`.
3. Instal Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
4. Login dan pilih project Firebase yang sama dengan konfigurasi di `app.js`:
   ```bash
   firebase login
   firebase projects:list
   firebase use --add
   ```
5. Deploy hosting dan rules sekaligus:
   ```bash
   firebase deploy --only hosting,storage
   ```
6. Buka URL yang ditampilkan CLI, biasanya `https://PROJECT_ID.web.app`.

## 6. Uji keamanan dan fungsi
1. Buka URL website dalam mode incognito: foto yang sudah ada harus dapat dilihat tanpa login.
2. Tanpa login, tombol upload harus nonaktif.
3. Login dengan email yang ada di allowlist: tombol upload aktif dan unggah foto uji di bawah 8 MB.
4. Login dengan akun Google lain yang tidak terdaftar: akun tersebut tidak boleh mengunggah.
5. Refresh dan buka URL di perangkat lain untuk memastikan foto tampil.
6. Jika upload gagal, cocokkan email di `app.js` dan `storage.rules`, pastikan Google provider aktif, email terverifikasi, domain di Authorized domains, bucket benar, dan rules telah di-deploy.

## Catatan penting
- Paket ini adalah source code siap dikonfigurasi; belum ada URL publik sampai Anda menghubungkan project Firebase dan melakukan deploy.
- Jangan menaruh service-account key/private key di browser. Firebase Web API key bukan private key, tetapi aturan akses server tetap wajib benar.
- Foto tidak dapat dihapus lewat website. Pengelola project dapat menghapusnya dari Firebase Console.
- Pantau penggunaan Storage, download traffic, dan billing. Batasi upload hanya ke orang tepercaya untuk mengurangi spam dan biaya.
