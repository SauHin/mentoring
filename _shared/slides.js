// Navigasi slide: panah kiri/kanan, Space, PageUp/PageDown.
// F = layar penuh, L = laser pointer, T = tema Siang/Malam, G = pilih slide.
// Nomor slide disimpan di URL (#3), jadi refresh tetap di slide yang sama.
const slides = [...document.querySelectorAll('.slide')];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const add = (tag, cls, html = '', parent = document.body) => {
  const el = parent.appendChild(document.createElement(tag));
  el.className = cls;
  el.innerHTML = html;
  return el;
};
const icon = (inner) => `<svg viewBox="0 0 24 24">${inner}</svg>`;
let current = 0;

function show(n) {
  current = Math.max(0, Math.min(n, slides.length - 1));
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  history.replaceState(null, '', `#${current + 1}`);
  nav[0].disabled = current === 0;
  nav[1].disabled = current === slides.length - 1;
  dispatchEvent(new Event('slidechange')); // scratch.js menampilkan coretan milik slide ini
}

/* ---------- Laser pointer: titik merah menggantikan kursor, klik tetap jalan ---------- */
// Di atas iframe, mousemove tidak sampai ke halaman ini. Karena itu halaman di dalam iframe
// mengirim posisi mouse-nya lewat postMessage (lihat theme.js).
const dot = add('div', 'laser-dot');
const moveDot = (x, y) => (dot.style.translate = `${x}px ${y}px`);
function toggleLaser() {
  const on = document.body.classList.toggle('laser');
  laserBtn.classList.toggle('on', on);
  document.querySelectorAll('iframe').forEach((f) => f.contentWindow.postMessage({ laser: on }, '*'));
}
addEventListener('message', (e) => {
  const f = [...document.querySelectorAll('iframe')].find((f) => f.contentWindow === e.source);
  if (!f || !Array.isArray(e.data?.mouse)) return;
  const r = f.getBoundingClientRect();
  moveDot(r.left + f.clientLeft + e.data.mouse[0], r.top + f.clientTop + e.data.mouse[1]);
});

/* ---------- Tombol prev/next: muncul saat mouse dekat tepi kiri atau kanan ---------- */
const nav = [-1, 1].map((step) => {
  const b = add('button', `nav nav-${step < 0 ? 'prev' : 'next'}`, icon(`<path d="${step < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/>`));
  b.setAttribute('aria-label', step < 0 ? 'Slide sebelumnya' : 'Slide berikutnya');
  b.onclick = () => { show(current + step); b.blur(); };
  return b;
});

document.addEventListener('mousemove', (e) => {
  moveDot(e.clientX, e.clientY);
  const edge = Math.max(80, innerWidth * 0.1);
  nav[0].classList.toggle('near', e.clientX < edge);
  nav[1].classList.toggle('near', e.clientX > innerWidth - edge);
});
// Di atas iframe (visualisasi), mousemove tidak sampai ke halaman ini, jadi sembunyikan di sini.
const hideNav = () => nav.forEach((b) => b.classList.remove('near'));
document.documentElement.addEventListener('mouseleave', hideNav);
document.querySelectorAll('iframe').forEach((f) => f.addEventListener('mouseenter', hideNav));

/* ---------- Toolbar kanan bawah: laser, tema, nomor slide ---------- */
const bar = add('div', 'toolbar');
const tool = (label, html, onclick) => {
  const b = add('button', 'tool', html, bar);
  b.title = label;
  b.setAttribute('aria-label', label);
  b.onclick = () => { onclick(); b.blur(); };
  return b;
};
const laserBtn = tool('Laser pointer (L)', icon('<circle cx="12" cy="12" r="8"/><circle class="fill" cx="12" cy="12" r="3"/>'), toggleLaser);
tool('Tema Siang/Malam (T)', icon('<circle cx="12" cy="12" r="8"/><path class="fill" d="M12 4a8 8 0 0 1 0 16z"/>'), () => toggleTheme());
const counter = tool('Pilih slide (G)', '', openPicker);
counter.classList.add('counter');

/* ---------- Pilih slide: daftar semua judul slide ---------- */
const picker = add('dialog', 'picker', `<div class="picker-body"><h2>Pilih slide</h2><ol>${slides
  .map((s, i) => `<li><button data-i="${i}"><span>${i + 1}</span>${esc((s.querySelector('h1, h2')?.textContent || `Slide ${i + 1}`).trim())}</button></li>`)
  .join('')}</ol></div>`);
picker.addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (b) show(Number(b.dataset.i));
  if (b || e.target === picker) picker.close(); // klik di luar kotak juga menutup
});
function openPicker() {
  picker.querySelectorAll('[data-i]').forEach((b, i) => b.classList.toggle('on', i === current));
  picker.showModal();
  picker.querySelector('.on').focus();
}

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', (e) => {
  if (picker.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(k)) show(current + 1);
  else if (['arrowleft', 'arrowup', 'pageup'].includes(k)) show(current - 1);
  else if (k === 'f') document.documentElement.requestFullscreen?.();
  else if (k === 'l') toggleLaser();
  else if (k === 't') toggleTheme();
  else if (k === 'g') openPicker();
  else return;
  e.preventDefault();
});

show((parseInt(location.hash.slice(1)) || 1) - 1);
