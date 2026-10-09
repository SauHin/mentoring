// Tema Siang/Malam. Muat file ini di <head> supaya halaman tidak berkedip.
// Pilihan tersimpan di localStorage. Kalau belum ada pilihan, tema ikut pengaturan sistem.
// Halaman induk mengirim tema ke iframe (visualisasi) lewat postMessage, jadi tetap jalan di file://.
(function () {
  const root = document.documentElement;
  if (parent !== window) root.classList.add('embed'); // viz di dalam iframe slide: judulnya disembunyikan (style.css)
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
    if (parent !== window || !document.querySelector('body.deck, body.catatan, article.notes, body.viz')) return;
    const viz = document.body.classList.contains('viz');
    // Selector sengaja tanpa awalan "_shared/" supaya tidak ikut diberi ?v= oleh tools/cachebust.py.
    const root = new URL('../', document.querySelector('link[href*="style.css"]').href);
    const matkul = location.href.startsWith(root.href) ? location.href.slice(root.href.length).split('/')[0] : '';
    // Di viz, bar ini ikut alur halaman (di atas judul), bukan melayang.
    const bar = document.createElement('div');
    if (viz) document.body.prepend(bar); else document.body.appendChild(bar);
    bar.className = 'topbar';
    bar.innerHTML = '<a class="tool home"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/></svg>Home</a>';
    bar.firstChild.href = new URL('index.html', root).href;
    // Viz yang dibuka lewat link di slide atau notes: tombol untuk kembali ke halaman itu.
    // Tanpa riwayat (dibuka langsung), kembali ke slide materinya.
    if (viz) {
      const back = document.createElement('button');
      back.className = 'tool home';
      back.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>Kembali';
      back.onclick = () => (history.length > 1 ? history.back() : location.assign(new URL('../slides.html', location.href)));
      bar.prepend(back);
    }
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

  // Syntax highlighting C untuk code block. hlC dipakai juga oleh notes.js (full code) dan cviz.js (panel kode).
  const KW = /^(if|else|for|while|do|return|break|continue|switch|case|default|sizeof|typedef|struct|goto)$/;
  const TY = /^(int|char|float|double|long|short|void|unsigned|signed|const|static|FILE|size_t|bool|Node|Stack|Queue)$/;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (c, s) => `<span class="sx-${c}">${s}</span>`;
  const TOK = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|((?:^|(?<=\n))[ \t]*#\w+[^\n]*)|("(?:\\.|[^"\\\n])*")|('(?:\\.|[^'\\\n])')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b(?=(\s*\()?)/g;
  window.hlC = (src) => {
    let out = '', last = 0;
    src.replace(TOK, (m, cm, pp, str, ch, num, word, call, at) => {
      out += esc(src.slice(last, at));
      last = at + m.length;
      if (cm) out += span('cm', esc(m));
      else if (pp) out += span('pp', esc(m));
      else if (str) out += span('str', esc(m).replace(/%[-+ #0]*\d*(?:\.\d+)?(?:ll|l|h)?[a-zA-Z]|\\./g, (f) => span('fmt', f)));
      else if (ch) out += span('str', esc(m));
      else if (num) out += span('num', m);
      else if (KW.test(word)) out += span('kw', m);
      else if (TY.test(word)) out += span('ty', m);
      else if (/^(NULL|true|false)$/.test(word)) out += span('num', m);
      else if (call !== undefined) out += span('fn', m);
      else out += m;
      return m;
    });
    return out + esc(src.slice(last));
  };
  // Hanya blok yang terlihat seperti C: ada ; { atau #include, dan bukan notasi logika/grammar (→ ⇒ ≡ ∴).
  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre > code').forEach((c) => {
      const t = c.textContent;
      if (c.children.length || !/[;{]|#include/.test(t) || /[→⇒≡∴]/.test(t)) return;
      c.innerHTML = window.hlC(t);
    });
  });

  // Event load halaman induk baru jalan setelah semua iframe selesai dimuat.
  addEventListener('load', () => document.querySelectorAll('iframe').forEach(send));
})();
