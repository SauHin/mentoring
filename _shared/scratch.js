// Scratch pad: coret-coret di atas slide atau notes untuk menjelaskan.
// Tombol pena di sebelah Home, atau tombol D. Esc = selesai, Ctrl+Z = undo.
// Alat: pena (4 warna, 3 ketebalan), pilih (klik coretan atau tarik kotak, lalu geser; Delete = hapus),
// dan penghapus. Kalau ada coretan terpilih, klik warna/ketebalan mengubah coretan itu.
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

  // Per halaman (slide atau notes): daftar coretan + riwayat untuk undo.
  const pages = {};
  const page = () => (pages[deck ? location.hash || '#1' : 'notes'] ||= { strokes: [], history: [] });
  const strokes = () => page().strokes;
  const offsetY = () => (deck ? 0 : scrollY); // notes: simpan koordinat halaman, bukan layar

  // Simpan salinan sebelum setiap perubahan, jadi undo bisa membatalkan apa pun (gambar, geser, hapus).
  function remember() {
    const p = page();
    p.history.push(structuredClone(p.strokes));
    if (p.history.length > 100) p.history.shift();
  }
  function undo() {
    const p = page();
    if (!p.history.length) return;
    p.strokes = p.history.pop();
    selected.clear();
    redraw();
  }

  const PENS = [
    { name: 'Merah', color: '#f04438', width: 4 },
    { name: 'Biru', color: '#4b7bff', width: 4 },
    { name: 'Hijau', color: '#22a06b', width: 4 },
    { name: 'Stabilo', color: 'rgba(255, 216, 77, 0.45)', width: 20 },
  ];
  const SIZES = [{ name: 'Tipis', k: 0.5, dot: 4 }, { name: 'Sedang', k: 1, dot: 8 }, { name: 'Tebal', k: 2.2, dot: 13 }];
  let pen = PENS[0], size = SIZES[1], tool = 'pen', active = false;
  let current = null, drag = null;      // drag: { kind: 'move' | 'box', from: [x, y], to: [x, y] }
  const selected = new Set();

  /* ---------- Geometri ---------- */
  const point = (e) => [e.clientX, e.clientY + offsetY()];
  // Jarak titik ke segmen garis, supaya coretan cepat (titik renggang) tetap kena di bagian tengahnya.
  function distToSegment([x, y], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len)) : 0;
    return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
  }
  const near = (s, p, pad = 10) => s.points.some((q, i) => distToSegment(p, q, s.points[i + 1] || q) < pad + s.width / 2);
  function bounds(list) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const s of list) for (const [x, y] of s.points) {
      x1 = Math.min(x1, x - s.width / 2); y1 = Math.min(y1, y - s.width / 2);
      x2 = Math.max(x2, x + s.width / 2); y2 = Math.max(y2, y + s.width / 2);
    }
    return { x1: x1 - 6, y1: y1 - 6, x2: x2 + 6, y2: y2 + 6 };
  }
  const inside = (b, [x, y]) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2;
  const boxOf = ([ax, ay], [bx, by]) => ({ x1: Math.min(ax, bx), y1: Math.min(ay, by), x2: Math.max(ax, bx), y2: Math.max(ay, by) });
  const overlaps = (a, b) => a.x1 <= b.x2 && b.x1 <= a.x2 && a.y1 <= b.y2 && b.y1 <= a.y2;

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

  function dashedBox(b, dy) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#4b7bff';
    ctx.fillStyle = 'rgba(75, 123, 255, 0.06)';
    ctx.fillRect(b.x1, b.y1 - dy, b.x2 - b.x1, b.y2 - b.y1);
    ctx.strokeRect(b.x1, b.y1 - dy, b.x2 - b.x1, b.y2 - b.y1);
    ctx.restore();
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
    if (selected.size) dashedBox(bounds(selected), dy);
    if (drag && drag.kind === 'box') dashedBox(boxOf(drag.from, drag.to), dy);
  }

  /* ---------- Mouse / pena / sentuh ---------- */
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {} // coretan tetap jalan walau capture gagal
    const p = point(e);
    if (tool === 'pen') {
      remember();
      current = { color: pen.color, width: pen.width * size.k, points: [p] };
      strokes().push(current);
    } else if (tool === 'eraser') {
      remember();
      erase(p);
    } else {
      // Pilih: di dalam pilihan → geser. Kena coretan → pilih itu lalu geser. Selain itu → tarik kotak.
      const hit = [...strokes()].reverse().find((s) => near(s, p));
      if (selected.size && inside(bounds(selected), p)) {
        remember();
        drag = { kind: 'move', from: p };
      } else if (hit) {
        selected.clear();
        selected.add(hit);
        remember();
        drag = { kind: 'move', from: p };
      } else {
        selected.clear();
        drag = { kind: 'box', from: p, to: p };
      }
    }
    redraw();
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = point(e);
    if (tool === 'select' && !e.buttons) {
      canvas.style.cursor = (selected.size && inside(bounds(selected), p)) || strokes().some((s) => near(s, p)) ? 'move' : 'default';
      return;
    }
    if (!e.buttons) return;
    if (tool === 'pen' && current) current.points.push(p);
    else if (tool === 'eraser') return erase(p);
    else if (drag && drag.kind === 'move') {
      const dx = p[0] - drag.from[0], dy = p[1] - drag.from[1];
      for (const s of selected) for (const q of s.points) { q[0] += dx; q[1] += dy; }
      drag.from = p;
    } else if (drag) drag.to = p;
    redraw();
  });

  addEventListener('pointerup', () => {
    if (drag && drag.kind === 'box') {
      const b = boxOf(drag.from, drag.to);
      for (const s of strokes()) if (overlaps(bounds([s]), b)) selected.add(s);
    }
    current = drag = null;
    redraw();
  });

  function erase(p) {
    const list = strokes();
    for (let i = list.length - 1; i >= 0; i--) if (near(list[i], p, 14)) list.splice(i, 1);
    redraw();
  }

  /* ---------- Palet: pena di sebelah Home ---------- */
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
  const group = () => palette.appendChild(Object.assign(document.createElement('span'), { className: 'scratch-group' }));

  const toggle = button(bar, 'Coret (D)', icon('M4 20l4-1L19 8l-3-3L5 16z'), () => setActive(!active));
  const palette = bar.appendChild(document.createElement('div'));
  palette.className = 'scratch-palette';
  palette.hidden = true;

  const colors = group();
  const swatches = PENS.map((p) => button(colors, p.name, `<span class="swatch${p.width > 10 ? ' wide' : ''}" style="background:${p.color}"></span>`, () => pickPen(p)));
  const sizes = group();
  const sizeBtns = SIZES.map((z) => button(sizes, `Ketebalan: ${z.name}`, `<span class="dot" style="width:${z.dot}px;height:${z.dot}px"></span>`, () => pickSize(z)));
  const tools = group();
  const selectBtn = button(tools, 'Pilih dan geser (S)', icon('M5 3l5 16 2.5-6.5L19 10z'), () => setTool('select'));
  const eraserBtn = button(tools, 'Penghapus (E)', icon('M8 20h12M5 15l9-9 5 5-7 7H8z'), () => setTool('eraser'));
  button(tools, 'Undo (Ctrl+Z)', icon('M9 5L4 10l5 5M4 10h10a5 5 0 0 1 0 10h-3'), undo);
  button(tools, 'Hapus semua coretan', icon('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13'), () => {
    if (!strokes().length) return;
    remember();
    strokes().length = 0;
    selected.clear();
    redraw();
  });

  // Kalau ada coretan terpilih, warna/ketebalan langsung mengubah coretan itu.
  function pickPen(p) {
    pen = p;
    if (selected.size) {
      remember();
      for (const s of selected) { s.color = p.color; s.width = p.width * size.k; }
      redraw();
    } else setTool('pen');
    refresh();
  }
  function pickSize(z) {
    size = z;
    if (selected.size) {
      remember();
      for (const s of selected) s.width = (PENS.find((p) => p.color === s.color) || pen).width * z.k;
      redraw();
    }
    refresh();
  }
  function setTool(t) {
    tool = t;
    if (t !== 'select') selected.clear();
    canvas.style.cursor = t === 'pen' ? 'crosshair' : t === 'eraser' ? 'cell' : 'default';
    refresh();
    redraw();
  }
  function refresh() {
    swatches.forEach((b, i) => b.classList.toggle('sel', tool === 'pen' && PENS[i] === pen));
    sizeBtns.forEach((b, i) => b.classList.toggle('sel', SIZES[i] === size));
    selectBtn.classList.toggle('sel', tool === 'select');
    eraserBtn.classList.toggle('sel', tool === 'eraser');
  }
  function setActive(on) {
    active = on;
    document.body.classList.toggle('drawing', on);
    toggle.classList.toggle('sel', on);
    palette.hidden = !on;
    if (!on) { selected.clear(); redraw(); }
  }
  setTool('pen');

  /* ---------- Keyboard ---------- */
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, dialog')) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === 'd' && !mod && !e.altKey) setActive(!active);
    else if (!active) return;
    else if (k === 'escape') selected.size ? (selected.clear(), redraw()) : setActive(false);
    else if (mod && k === 'z') undo();
    else if ((k === 'delete' || k === 'backspace') && selected.size) {
      remember();
      page().strokes = strokes().filter((s) => !selected.has(s));
      selected.clear();
      redraw();
    } else if (k === 's' && !mod) setTool('select');
    else if (k === 'e' && !mod) setTool('eraser');
    else if (k === 'p' && !mod) setTool('pen');
    else return;
    e.preventDefault();
    e.stopImmediatePropagation(); // jangan sampai tombol yang sama juga menggerakkan slide
  }, true);

  let queued = false;
  addEventListener('scroll', () => {
    if (deck || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; redraw(); });
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas); // ukuran jendela, scrollbar, atau zoom berubah
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', resize); // pindah ke monitor lain
  addEventListener('slidechange', () => { selected.clear(); redraw(); }); // dari slides.js: coretan milik slide yang baru
  resize();
})();
