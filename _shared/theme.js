// Tema Siang/Malam. Muat file ini di <head> supaya halaman tidak berkedip.
// Pilihan tersimpan di localStorage. Kalau belum ada pilihan, tema ikut pengaturan sistem.
// Halaman induk mengirim tema ke iframe (visualisasi) lewat postMessage, jadi tetap jalan di file://.
(function () {
  const root = document.documentElement;
  const send = (f) => f.contentWindow && f.contentWindow.postMessage({ theme: root.dataset.theme }, '*');

  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll('iframe').forEach(send);
    dispatchEvent(new Event('themechange')); // untuk canvas yang perlu digambar ulang
  }

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  root.dataset.theme = saved === 'light' || saved === 'dark' ? saved
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  window.toggleTheme = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) {}
    apply(next);
  };

  // Laser pointer di slide: halaman di dalam iframe menyembunyikan kursornya
  // dan melaporkan posisi mouse ke slide, supaya titik laser bisa mengikuti.
  let laser = false;
  if (parent !== window) {
    addEventListener('mousemove', (e) => laser && parent.postMessage({ mouse: [e.clientX, e.clientY] }, '*'));
  }

  addEventListener('message', (e) => {
    const t = e.data && e.data.theme;
    if (t === 'light' || t === 'dark') apply(t);
    if (e.data && typeof e.data.laser === 'boolean') root.classList.toggle('laser-on', (laser = e.data.laser));
  });
  // Tombol Home di pojok kiri atas, posisinya sama persis di slide dan notes.
  // Link-nya ke index.html di root (satu tingkat di atas _shared), langsung ke bagian matkul-nya.
  addEventListener('DOMContentLoaded', () => {
    if (parent !== window || !document.querySelector('body.deck, article.notes')) return;
    // Selector sengaja tanpa awalan "_shared/" supaya tidak ikut diberi ?v= oleh tools/cachebust.py.
    const root = new URL('../', document.querySelector('link[href*="style.css"]').href);
    const matkul = location.href.startsWith(root.href) ? location.href.slice(root.href.length).split('/')[0] : '';
    const bar = document.body.appendChild(document.createElement('div'));
    bar.className = 'topbar';
    bar.innerHTML = '<a class="tool home"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/></svg>Home</a>';
    bar.firstChild.href = new URL('index.html', root).href;
    // Breadcrumb "/ Data structure" dari nama folder matkul (data-structure → Data structure), link ke daftar materinya.
    if (matkul && !matkul.endsWith('.html')) {
      const crumbs = bar.appendChild(document.createElement('nav'));
      crumbs.className = 'crumbs';
      const a = document.createElement('a');
      a.href = new URL(`${matkul}/index.html`, root).href;
      a.textContent = matkul.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
      crumbs.append('/ ', a);
    }
    // Scratch pad (coret-coret) hanya untuk slide dan notes materi, bukan halaman daftar matkul.
    if (document.querySelector('body.deck, script[src*="notes.js"]'))
      document.head.appendChild(document.createElement('script')).src = new URL('_shared/scratch.js?v=d4d95638', root).href;
  });

  // Event load halaman induk baru jalan setelah semua iframe selesai dimuat.
  addEventListener('load', () => document.querySelectorAll('iframe').forEach(send));
})();
