// Our Little Photobooth — Yosia & Tio
// Isi firebaseConfig dari Firebase Console. Jangan pernah memasukkan service-account key di frontend.
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

// Ubah ke email Google yang diizinkan mengunggah.
// Daftar ini hanya mengatur tampilan UI; storage.rules adalah penjaga keamanan sebenarnya.
const ALLOWED_UPLOADER_EMAILS = [
  "uploader1@example.com",
  "uploader2@example.com"
].map(email => email.trim().toLowerCase());

const input = document.getElementById('photoInput');
const grid = document.getElementById('galleryGrid');
const emptyState = document.getElementById('emptyState');
const count = document.getElementById('photoCount');
const notice = document.getElementById('notice');
const authStatus = document.getElementById('authStatus');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const uploadBtn = document.getElementById('uploadBtn');
const heroUpload = document.getElementById('heroUpload');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
let photos = [];
let currentIndex = 0;
let storage, storageApi, auth, authApi, googleProvider;
let currentUser = null;
let firebaseReady = false;

 document.getElementById('year').textContent = new Date().getFullYear();
 document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
 document.getElementById('prevPhoto').addEventListener('click', () => showPhoto(currentIndex - 1));
 document.getElementById('nextPhoto').addEventListener('click', () => showPhoto(currentIndex + 1));
 lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
 document.addEventListener('keydown', e => {
   if (e.key === 'Escape') closeLightbox();
   if (e.key === 'ArrowLeft') showPhoto(currentIndex - 1);
   if (e.key === 'ArrowRight') showPhoto(currentIndex + 1);
 });
 signInBtn.addEventListener('click', signIn);
 signOutBtn.addEventListener('click', async () => {
   try { await authApi.signOut(auth); }
   catch (err) { console.error(err); authStatus.textContent = 'Gagal keluar. Coba lagi.'; }
 });
 uploadBtn.addEventListener('click', () => {
   if (canUpload()) input.click();
   else authStatus.textContent = 'Masuk menggunakan akun Google yang sudah diizinkan untuk mengunggah foto.';
 });
 heroUpload.addEventListener('click', () => {
   if (canUpload()) input.click();
   else { document.getElementById('gallery').scrollIntoView({behavior:'smooth'}); authStatus.textContent = currentUser ? 'Akun ini belum diizinkan mengunggah foto.' : 'Silakan masuk dengan akun Google yang diizinkan.'; }
 });

function updateCount() {
  count.textContent = `${photos.length} ${photos.length === 1 ? 'memory' : 'memories'}`;
  emptyState.style.display = photos.length ? 'none' : 'block';
}
function makeCard(photo, index) {
  const card = document.createElement('article');
  card.className = 'memory-card';
  card.style.setProperty('--tilt', `${[-1.2, .7, -.5, 1.1, -.8, .4][index % 6]}deg`);
  const img = document.createElement('img');
  img.src = photo.url; img.alt = photo.caption || 'Kenangan Yosia dan Tio'; img.loading = 'lazy';
  const caption = document.createElement('div');
  caption.className = 'caption'; caption.textContent = photo.caption || 'a little moment ♡';
  card.append(img, caption);
  card.addEventListener('click', () => { currentIndex = index; showPhoto(currentIndex); });
  grid.appendChild(card);
}
function renderGallery() {
  grid.querySelectorAll('.memory-card').forEach(el => el.remove());
  photos.forEach(makeCard);
  updateCount();
}
function showPhoto(index) {
  if (!photos.length) return;
  currentIndex = (index + photos.length) % photos.length;
  lightboxImage.src = photos[currentIndex].url;
  lightboxCaption.textContent = photos[currentIndex].caption || 'a little moment ♡';
  lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false');
}
function closeLightbox() { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); }
function canUpload() {
  return !!currentUser && !!currentUser.email && currentUser.emailVerified && ALLOWED_UPLOADER_EMAILS.includes(currentUser.email.toLowerCase());
}
function updateAuthUI() {
  const allowed = canUpload();
  signInBtn.hidden = !!currentUser;
  signOutBtn.hidden = !currentUser;
  uploadBtn.disabled = !allowed;
  heroUpload.disabled = !allowed;
  if (!currentUser) {
    authStatus.textContent = 'Galeri publik. Untuk mengunggah, masuk dengan akun Google yang diizinkan.';
  } else if (allowed) {
    authStatus.textContent = `Masuk sebagai ${currentUser.email}. Akun ini diizinkan mengunggah foto.`;
  } else {
    authStatus.textContent = `Masuk sebagai ${currentUser.email}, tetapi akun ini belum diizinkan mengunggah. Gunakan akun yang terdaftar di allowlist.`;
  }
}
async function signIn() {
  if (!firebaseReady) { authStatus.textContent = 'Lengkapi konfigurasi Firebase terlebih dahulu.'; return; }
  try { await authApi.signInWithPopup(auth, googleProvider); }
  catch (err) {
    console.error(err);
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      try { await authApi.signInWithRedirect(auth, googleProvider); }
      catch (redirectErr) { console.error(redirectErr); authStatus.textContent = 'Login Google gagal. Periksa Authorized domains di Firebase Authentication.'; }
    } else {
      authStatus.textContent = 'Login Google gagal. Pastikan Google provider aktif dan domain website sudah diizinkan.';
    }
  }
}
async function bootFirebase() {
  if (firebaseConfig.apiKey.startsWith('GANTI_') || firebaseConfig.projectId.startsWith('GANTI_')) {
    notice.textContent = 'Mode pratinjau: Firebase belum tersambung. Isi firebaseConfig di app.js dan ikuti README.md.';
    authStatus.textContent = 'Login dan upload akan aktif setelah Firebase dikonfigurasi.';
    return;
  }
  try {
    const [{ initializeApp }, storageModule, authModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js')
    ]);
    storageApi = storageModule;
    authApi = authModule;
    const app = initializeApp(firebaseConfig);
    storage = storageApi.getStorage(app);
    auth = authApi.getAuth(app);
    googleProvider = new authApi.GoogleAuthProvider();
    firebaseReady = true;
    notice.textContent = 'Galeri publik aktif. Upload dilindungi Google Sign-In dan Storage Rules.';
    authApi.onAuthStateChanged(auth, user => {
      currentUser = user;
      updateAuthUI();
    });
    try { await authApi.getRedirectResult(auth); } catch (err) { console.error(err); }
    await loadPhotos();
    input.addEventListener('change', uploadSelectedPhotos);
  } catch (err) {
    console.error(err);
    notice.textContent = 'Firebase belum dapat dihubungkan. Periksa firebaseConfig, Authentication, Storage, dan Storage Rules.';
  }
}
async function uploadSelectedPhotos() {
  const selected = [...(input.files || [])];
  if (!selected.length) return;
  if (!canUpload()) { alert('Akun Google ini tidak diizinkan mengunggah foto.'); input.value = ''; return; }
  for (const file of selected) {
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { alert(`${file.name} bukan format gambar yang didukung.`); continue; }
    if (file.size > 8 * 1024 * 1024) { alert(`${file.name} lebih besar dari 8 MB. Maksimal 8 MB per foto.`); continue; }
    const safeName = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    try {
      await storageApi.uploadBytes(storageApi.ref(storage, `memories/${safeName}`), file, {
        contentType: file.type,
        customMetadata: { caption: 'a little moment ♡', uploadedBy: currentUser.email, uploadedAt: new Date().toISOString() }
      });
    } catch (err) {
      console.error(err);
      alert('Upload gagal. Pastikan email di app.js dan storage.rules cocok, Google Sign-In aktif, dan Storage Rules sudah diterbitkan.');
    }
  }
  input.value = '';
  await loadPhotos();
}
async function loadPhotos() {
  try {
    const result = await storageApi.listAll(storageApi.ref(storage, 'memories'));
    const loaded = await Promise.all(result.items.map(async item => {
      const [url, metadata] = await Promise.all([storageApi.getDownloadURL(item), item.getMetadata()]);
      return { url, caption: metadata.customMetadata?.caption || 'a little moment ♡', name: item.name };
    }));
    photos = loaded.sort((a,b) => b.name.localeCompare(a.name));
    renderGallery();
  } catch (err) {
    console.error(err);
    notice.textContent = 'Belum dapat membaca galeri. Pastikan Storage Rules mengizinkan read publik dan bucket sudah dibuat.';
  }
}
bootFirebase();
