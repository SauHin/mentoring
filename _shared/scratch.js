// Scratch pad: coret-coret di atas slide atau notes untuk menjelaskan.
// Tombol pena di sebelah Home, atau tombol D. Esc = selesai, Ctrl+Z = undo.
// Slide: coretan disimpan per slide. Notes: coretan menempel ke isi halaman dan ikut ter-scroll.
// Dimuat otomatis oleh theme.js setelah tombol Home dibuat.
// ponytail: coretan hanya di memory (hilang saat reload), dan di notes posisinya bisa bergeser
// kalau lebar layar berubah (teks reflow). Simpan per halaman di localStorage kalau dibutuhkan.
(function () {
  const deck = document.body.classList.contains('deck');
  const bar = document.querySelector('.topbar');
  const canvas = document.body.appendChild(document.createElement('canvas'));
  canvas.className = 'scratch';
  const ctx = canvas.getContext('2d');

  const pages = {}; // slide → daftar coretan
  const strokes = () => (pages[deck ? location.hash || '#1' : 'notes'] ||= []);
  const offsetY = () => (deck ? 0 : scrollY); // notes: simpan koordinat halaman, bukan layar

  const PENS = [
    { name: 'Merah', color: '#f04438', width: 4 },
    { name: 'Biru', color: '#4b7bff', width: 4 },
    { name: 'Hijau', color: '#22a06b', width: 4 },
    { name: 'Stabilo', color: 'rgba(255, 216, 77, 0.45)', width: 22 },
  ];
  let pen = PENS[0], erasing = false, active = false, current = null;

  /* ---------- Gambar ---------- */
  // Resolusi internal mengikuti ukuran tampil kanvas yang sebenarnya (tanpa scrollbar) × devicePixelRatio,
  // supaya 1 unit gambar = 1 piksel CSS, dan coretan tepat di bawah kursor pada skala layar berapa pun.
  function resize() {
    const r = devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * r);
    canvas.height = Math.round(height * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
    redraw();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dy = offsetY();
    for (const s of strokes()) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      s.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - dy) : ctx.moveTo(x, y - dy)));
      if (s.points.length === 1) ctx.lineTo(s.points[0][0] + 0.1, s.points[0][1] - dy); // titik tunggal tetap terlihat
      ctx.stroke();
    }
  }

  // Penghapus: hapus seluruh coretan yang tersentuh.
  function eraseAt([x, y]) {
    const list = strokes();
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].points.some(([a, b]) => Math.hypot(a - x, b - y) < 14 + list[i].width / 2)) list.splice(i, 1);
    }
    redraw();
  }

  const point = (e) => [e.clientX, e.clientY + offsetY()];
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {} // coretan tetap jalan walau capture gagal
    if (erasing) return eraseAt(point(e));
    current = { color: pen.color, width: pen.width, points: [point(e)] };
    strokes().push(current);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!e.buttons) return;
    if (erasing) return eraseAt(point(e));
    if (current) {
      current.points.push(point(e));
      redraw();
    }
  });
  addEventListener('pointerup', () => (current = null));

  /* ---------- Tombol: pena di sebelah Home, palet muncul saat aktif ---------- */
  const icon = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
  const button = (parent, label, html, onclick) => {
    const b = parent.appendChild(document.createElement('button'));
    b.className = 'tool';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    b.onclick = () => { onclick(); b.blur(); };
    return b;
  };

  const toggle = button(bar, 'Coret (D)', icon('M4 20l4-1L19 8l-3-3L5 16z'), () => setActive(!active));
  const palette = bar.appendChild(document.createElement('div'));
  palette.className = 'scratch-palette';
  palette.hidden = true;
  const swatches = PENS.map((p) => {
    const b = button(palette, p.name, `<span class="swatch${p.width > 10 ? ' wide' : ''}" style="background:${p.color}"></span>`, () => choose(p, false));
    return b;
  });
  const eraser = button(palette, 'Penghapus', icon('M8 20h12M5 15l9-9 5 5-7 7H8z'), () => choose(pen, true));
  button(palette, 'Undo (Ctrl+Z)', icon('M9 5L4 10l5 5M4 10h10a5 5 0 0 1 0 10h-3'), undo);
  button(palette, 'Hapus semua coretan', icon('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13'), () => { strokes().length = 0; redraw(); });

  function choose(p, erase) {
    pen = p;
    erasing = erase;
    swatches.forEach((b, i) => b.classList.toggle('sel', !erase && PENS[i] === p));
    eraser.classList.toggle('sel', erase);
  }
  function undo() {
    strokes().pop();
    redraw();
  }
  function setActive(on) {
    active = on;
    document.body.classList.toggle('drawing', on);
    toggle.classList.toggle('sel', on);
    palette.hidden = !on;
  }
  choose(PENS[0], false);

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, dialog')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key.toLowerCase() === 'd' && !mod && !e.altKey) setActive(!active);
    else if (active && e.key === 'Escape') setActive(false);
    else if (active && mod && e.key.toLowerCase() === 'z') undo();
    else return;
    e.preventDefault();
  });

  let queued = false;
  addEventListener('scroll', () => {
    if (deck || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; redraw(); });
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas); // ukuran jendela, scrollbar, atau zoom berubah
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', resize); // pindah ke monitor lain
  addEventListener('slidechange', redraw); // dari slides.js: tampilkan coretan milik slide yang baru
  resize();
})();
