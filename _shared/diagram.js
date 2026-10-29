// Mesin diagram Program Design Methods: flowchart (simbol Gaddis), hierarchy chart, dan DFD (notasi Gane & Sarson).
// Dipakai dua cara:
// 1. Gambar di notes dan slide: <div class="dg-fig" data-kind="flow|tree|dfd">spec</div>, atau <div data-dg="kunci"> dari DG.data.
//    Kunci berisi { kind, spec } menjadi gambar, { code } menjadi pseudocode berwarna, { ipo } menjadi tabel IPO chart,
//    { html } disalin apa adanya (teks soal, mockup GUI).
// 2. Kanvas latihan yang bisa diedit: DG.editor(el, { kind, pages, onChange }), dengan pemeriksa aturan DG.check.
// Spec: satu baris satu bentuk atau satu garis. Baris kosong dan baris diawali # diabaikan.
//   bentuk: tipe id x y [=LxT] teks [!]   x y dalam satuan grid (flow 220×80, dfd 1 px). Tree tanpa x y disusun otomatis.
//           \n = baris baru, [1] di depan teks = nomor process atau data store, ! di akhir = ditandai salah (merah).
//   garis : dari > ke [: label] [@jalur] [!]   jalur: h (mendatar dulu), v (tegak dulu), t (turun, menyamping, turun),
//           r/l (memutar lewat kanan/kiri), s (lurus miring). Tanpa @: lurus kalau sejajar, selain itu h (flow), t (tree), s (dfd).
(function () {
  'use strict';
  const FS = 14, LH = 18, SKEW = 14, BAND = 22, IDW = 36;
  // k = jenis diagram, n = nama di tombol, c = warna latar (kelas warna style.css), d = teks awal
  const T = {
    term: { k: 'flow', n: 'Terminal', c: 'c-mint', d: 'Start' },
    io: { k: 'flow', n: 'Input/Output', c: 'c-lilac', d: 'Input ...' },
    proc: { k: 'flow', n: 'Process', c: '', d: 'Process' },
    dec: { k: 'flow', n: 'Decision', c: 'c-jingga', d: 'Condition?' },
    call: { k: 'flow', n: 'Module call', c: 'c-pink', d: 'moduleName' },
    conn: { k: 'flow', n: 'Connector', c: '', d: 'A' },
    mod: { k: 'tree', n: 'Module', c: '', d: 'module' },
    ent: { k: 'dfd', n: 'External entity', c: 'c-jingga', d: 'Entity' },
    dproc: { k: 'dfd', n: 'Process', c: 'c-mint', d: 'Process' },
    store: { k: 'dfd', n: 'Data store', c: 'c-lilac', d: 'Data store' },
    pt: { k: '', n: 'Titik', c: '', d: '' },
  };
  const MAXW = { term: 170, io: 190, proc: 190, dec: 140, call: 170, conn: 30, mod: 130, ent: 120, dproc: 150, store: 150, pt: 0 };
  const GRID = { flow: [220, 80], tree: [1, 1], dfd: [1, 1] };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r1 = (v) => Math.round(v * 10) / 10;
  const DG = (window.DG = window.DG || {});
  DG.data = DG.data || {};
  DG.types = T;

  /* ---------- Ukuran bentuk mengikuti teks ---------- */
  let ctx, family;
  function tw(s) {
    if (!ctx) {
      ctx = document.createElement('canvas').getContext('2d');
      family = getComputedStyle(document.documentElement).getPropertyValue('--huruf').trim() || 'sans-serif';
    }
    ctx.font = `${FS}px ${family}`;
    return ctx.measureText(s).width;
  }
  function wrap(text, max) {
    const out = [];
    String(text).split('\n').forEach((para) => {
      let line = '';
      para.split(/ +/).forEach((word) => {
        const t = line ? line + ' ' + word : word;
        if (line && tw(t) > max) { out.push(line); line = word; } else line = t;
      });
      out.push(line);
    });
    return out;
  }
  // Lebar teks yang muat di dalam bentuk selebar w (dipakai saat ukuran diatur manual).
  function inner(type, w) {
    switch (type) {
      case 'term': return w - 40;
      case 'io': return w - 24 - SKEW;
      case 'dec': return (w - 16) * 0.5;
      case 'call': return w - 44;
      case 'ent': return w - 28;
      case 'store': return w - IDW - 24;
      case 'conn': return w - 14;
      default: return w - 24;
    }
  }
  function size(n) {
    if (n.type === 'pt') return { w: 0, h: 0, lines: [] };
    const lines = wrap(n.text || '', n.w ? Math.max(20, inner(n.type, n.w)) : MAXW[n.type]);
    const w0 = Math.max(0, ...lines.map(tw)), h0 = lines.length * LH;
    let w, h;
    switch (n.type) {
      case 'term': h = Math.max(36, h0 + 14); w = Math.max(90, w0 + h * 0.7 + 12); break;
      case 'io': w = Math.max(100, w0 + 24 + SKEW); h = Math.max(36, h0 + 16); break;
      case 'dec': h = Math.max(48, 2 * h0 + 14); w = Math.max(110, (w0 * h) / (h - h0) + 16); break;
      case 'call': w = Math.max(100, w0 + 44); h = Math.max(36, h0 + 16); break;
      case 'conn': w = h = Math.max(32, Math.max(w0, h0) + 14); break;
      case 'ent': w = Math.max(100, w0 + 28); h = Math.max(56, h0 + 26); break;
      case 'dproc': w = Math.max(110, w0 + 24); h = Math.max(78, BAND + h0 + 22); break;
      case 'store': w = Math.max(130, IDW + w0 + 24); h = Math.max(40, h0 + 16); break;
      default: w = Math.max(90, w0 + 24); h = Math.max(36, h0 + 16);
    }
    if (n.w) w = Math.max(n.w, 40);
    if (n.h) h = Math.max(n.h, h);
    if (n.type === 'conn') w = h = Math.max(w, h);
    return { w, h, lines };
  }
  function box(n) {
    const s = size(n);
    return { x: n.x, y: n.y, w: s.w, h: s.h, l: n.x - s.w / 2, r: n.x + s.w / 2, t: n.y - s.h / 2, b: n.y + s.h / 2, lines: s.lines, type: n.type };
  }

  /* ---------- Titik di tepi bentuk ---------- */
  // Tepi kiri (s = -1) atau kanan (s = 1) bentuk pada ketinggian y.
  function edgeX(R, y, s) {
    const dy = Math.min(Math.abs(y - R.y), R.h / 2);
    switch (R.type) {
      case 'dec': return R.x + s * (R.w / 2) * (1 - dy / (R.h / 2));
      case 'term': { const r = R.h / 2; return R.x + s * (R.w / 2 - r + Math.sqrt(Math.max(0, r * r - dy * dy))); }
      case 'conn': { const r = R.w / 2; return R.x + s * Math.sqrt(Math.max(0, r * r - dy * dy)); }
      case 'io': { const f = (y - R.t) / R.h; return s > 0 ? R.r - SKEW * f : R.l + SKEW * (1 - f); }
      default: return R.x + (s * R.w) / 2;
    }
  }
  // Tepi atas (s = -1) atau bawah (s = 1) bentuk pada posisi x.
  function edgeY(R, x, s) {
    const dx = Math.min(Math.abs(x - R.x), R.w / 2);
    switch (R.type) {
      case 'dec': return R.y + s * (R.h / 2) * (1 - dx / (R.w / 2));
      case 'conn': { const r = R.h / 2; return R.y + s * Math.sqrt(Math.max(0, r * r - dx * dx)); }
      case 'term': { const r = R.h / 2, flat = R.w / 2 - r; if (dx <= flat) return R.y + s * r; const d = dx - flat; return R.y + s * Math.sqrt(Math.max(0, r * r - d * d)); }
      default: return R.y + (s * R.h) / 2;
    }
  }
  function clip(R, cx, cy, dx, dy) {
    const tx = dx > 0 ? (R.r - cx) / dx : dx < 0 ? (R.l - cx) / dx : Infinity;
    const ty = dy > 0 ? (R.b - cy) / dy : dy < 0 ? (R.t - cy) / dy : Infinity;
    const t = Math.max(0, Math.min(tx, ty));
    return [cx + dx * t, cy + dy * t];
  }

  /* ---------- Jalur garis ---------- */
  // i dan n: urutan garis di antara pasangan bentuk yang sama, supaya garis sejajar tidak menumpuk.
  function route(e, A, B, i, n, kind, flip) {
    let m = e.route || 'auto';
    const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
    if (m === 'auto') m = kind === 'tree' ? 't' : ox >= 16 && oy <= 0 ? 'ov' : oy >= 16 && ox <= 0 ? 'oh' : kind === 'dfd' ? 's' : 'h';
    if ((m === 'ov' && !(ox > 0)) || (m === 'oh' && !(oy > 0))) m = 's';
    const k = (i + 1) / (n + 1), off = (i - (n - 1) / 2) * 14;
    const sy = B.y > A.y ? 1 : -1, sx = B.x > A.x ? 1 : -1;
    switch (m) {
      case 'ov': { const lo = Math.max(A.l, B.l), hi = Math.min(A.r, B.r), x = lo + (hi - lo) * k; return [[x, edgeY(A, x, sy)], [x, edgeY(B, x, -sy)]]; }
      case 'oh': { const lo = Math.max(A.t, B.t), hi = Math.min(A.b, B.b), y = lo + (hi - lo) * k; return [[edgeX(A, y, sx), y], [edgeX(B, y, -sx), y]]; }
      case 'h': { const y = A.y + off, x = B.x + off; return [[edgeX(A, y, sx), y], [x, y], [x, edgeY(B, x, -sy)]]; }
      case 'v': { const x = A.x + off, y = B.y + off; return [[x, edgeY(A, x, sy)], [x, y], [edgeX(B, y, -sx), y]]; }
      case 't': {
        const ym = kind === 'tree' ? (sy > 0 ? (A.b + B.t) / 2 : (A.t + B.b) / 2) : sy > 0 ? B.t - 16 : B.b + 16;
        return [[A.x, edgeY(A, A.x, sy)], [A.x, ym], [B.x, ym], [B.x, edgeY(B, B.x, -sy)]];
      }
      case 'r': case 'l': {
        const s = m === 'r' ? 1 : -1, X = s > 0 ? Math.max(A.r, B.r) + 26 + i * 12 : Math.min(A.l, B.l) - 26 - i * 12;
        return [[edgeX(A, A.y, s), A.y], [X, A.y], [X, B.y], [edgeX(B, B.y, s), B.y]];
      }
      default: {
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, o = flip ? -off : off;
        const px = (-dy / len) * o, py = (dx / len) * o;
        return [clip(A, A.x + px, A.y + py, dx, dy), clip(B, B.x + px, B.y + py, -dx, -dy)];
      }
    }
  }
  function head(p, q) {
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]), L = 9, W = 4.5;
    const bx = q[0] - L * Math.cos(a), by = q[1] - L * Math.sin(a);
    return `M${r1(q[0])} ${r1(q[1])}L${r1(bx - W * Math.sin(a))} ${r1(by + W * Math.cos(a))}L${r1(bx + W * Math.sin(a))} ${r1(by - W * Math.cos(a))}Z`;
  }
  // Posisi label: Yes/No dekat decision, label mendatar di atas garis, label tegak di samping, label miring di atas garis.
  function labelAt(pts, text, kind, srcType, i, n, flip) {
    const lines = String(text).split('\n'), w = Math.max(...lines.map((s) => (tw(s) * 13) / 14)), h = lines.length * 16;
    let x, y, a = 'middle', yn = false, on = false;
    if (kind === 'flow' && srcType === 'dec') {
      yn = true;
      const [p, q] = pts;
      if (Math.abs(q[1] - p[1]) < 0.5) { a = q[0] > p[0] ? 'start' : 'end'; x = p[0] + (q[0] > p[0] ? 6 : -6); y = p[1] - 6 - h / 2; }
      else { a = 'start'; x = p[0] + 6; y = p[1] + (q[1] > p[1] ? 6 + h / 2 : -6 - h / 2); }
    } else {
      let j = 0, L = -1;
      for (let s = 0; s < pts.length - 1; s++) {
        const l = Math.hypot(pts[s + 1][0] - pts[s][0], pts[s + 1][1] - pts[s][1]);
        if (l > L + 0.5) { L = l; j = s; }
      }
      const p = pts[j], q = pts[j + 1];
      if (Math.abs(q[1] - p[1]) < 0.5) { x = (p[0] + q[0]) / 2; y = p[1] - 5 - h / 2; }
      else if (Math.abs(q[0] - p[0]) < 0.5) { const left = n > 1 && i < (n - 1) / 2; a = left ? 'end' : 'start'; x = p[0] + (left ? -6 : 6); y = (p[1] + q[1]) / 2; }
      else { const f = flip ? 1 - (i + 1) / (n + 1) : (i + 1) / (n + 1); x = p[0] + (q[0] - p[0]) * f; y = p[1] + (q[1] - p[1]) * f; on = true; }
    }
    const x0 = a === 'start' ? x : a === 'end' ? x - w : x - w / 2;
    return { lines, x, y, a, yn, on, x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2 };
  }

  /* ---------- Gambar ---------- */
  function nodeSvg(n, R, o) {
    const { x, y, w, h, l, r, t, b } = R, c = `dg-shape ${T[n.type].c || 'dg-plain'}`;
    let s, tx = x, ty = y;
    switch (n.type) {
      case 'pt': return '';
      case 'term': s = `<rect class="${c}" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2)}"/>`; break;
      case 'io': s = `<polygon class="${c}" points="${r1(l + SKEW)},${r1(t)} ${r1(r)},${r1(t)} ${r1(r - SKEW)},${r1(b)} ${r1(l)},${r1(b)}"/>`; break;
      case 'dec': s = `<polygon class="${c}" points="${r1(x)},${r1(t)} ${r1(r)},${r1(y)} ${r1(x)},${r1(b)} ${r1(l)},${r1(y)}"/>`; break;
      case 'call': s = `<rect class="${c}" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}"/><path class="dg-line" d="M${r1(l + 10)} ${r1(t)}V${r1(b)}M${r1(r - 10)} ${r1(t)}V${r1(b)}"/>`; break;
      case 'conn': s = `<circle class="${c}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(w / 2)}"/>`; break;
      case 'ent': s = `<rect class="dg-shadow" x="${r1(l + 5)}" y="${r1(t - 5)}" width="${r1(w)}" height="${r1(h)}"/><rect class="${c}" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}"/>`; break;
      case 'dproc':
        s = `<rect class="${c}" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}" rx="12"/>` +
          `<path class="dg-band" d="M${r1(l)} ${r1(t + BAND)}V${r1(t + 12)}Q${r1(l)} ${r1(t)} ${r1(l + 12)} ${r1(t)}H${r1(r - 12)}Q${r1(r)} ${r1(t)} ${r1(r)} ${r1(t + 12)}V${r1(t + BAND)}Z"/>` +
          `<text class="dg-no" x="${r1(x)}" y="${r1(t + BAND / 2)}">${esc(n.no ?? '')}</text>`;
        ty = t + BAND + (h - BAND) / 2;
        break;
      case 'store':
        s = `<rect class="${c} dg-fill" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}"/><rect class="dg-band" x="${r1(l)}" y="${r1(t)}" width="${IDW}" height="${r1(h)}"/>` +
          `<path class="dg-line" d="M${r1(r)} ${r1(t)}H${r1(l)}V${r1(b)}H${r1(r)}"/><text class="dg-no" x="${r1(l + IDW / 2)}" y="${r1(y)}">${esc(n.no ?? '')}</text>`;
        tx = l + IDW + (w - IDW) / 2;
        break;
      default: s = `<rect class="${c}" x="${r1(l)}" y="${r1(t)}" width="${r1(w)}" height="${r1(h)}"/>`;
    }
    const y0 = ty - ((R.lines.length - 1) * LH) / 2;
    const text = `<text class="dg-text">${R.lines.map((line, k) => `<tspan x="${r1(tx)}" y="${r1(y0 + k * LH)}">${esc(line)}</tspan>`).join('')}</text>`;
    return `<g class="dg-node${n.bad ? ' bad' : ''}${o.sel === n.id ? ' sel' : ''}">${s}${text}</g>`;
  }
  function labSvg(L, sel, bad) {
    const y0 = L.y - (L.lines.length - 1) * 8;
    return `<text class="dg-lab${L.yn ? ' yn' : ''}${sel ? ' sel' : ''}${bad ? ' bad' : ''}" text-anchor="${L.a}">${L.lines.map((s, k) => `<tspan x="${r1(L.x)}" y="${r1(y0 + k * 16)}">${esc(s)}</tspan>`).join('')}</text>`;
  }
  // Menggambar satu halaman diagram. Hasil: isi SVG, batas gambar, kotak tiap bentuk, dan jalur tiap garis (untuk klik di editor).
  function draw(P, kind, o = {}) {
    const B = new Map(), nodeOf = new Map();
    P.nodes.forEach((n) => { B.set(n.id, box(n)); nodeOf.set(n.id, n); });
    const pairs = new Map();
    P.edges.forEach((e) => {
      if (!B.has(e.from) || !B.has(e.to) || e.from === e.to) return;
      const key = e.from < e.to ? e.from + '\n' + e.to : e.to + '\n' + e.from;
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(e);
    });
    const ext = [Infinity, Infinity, -Infinity, -Infinity];
    const grow = (x1, y1, x2 = x1, y2 = y1) => { ext[0] = Math.min(ext[0], x1); ext[1] = Math.min(ext[1], y1); ext[2] = Math.max(ext[2], x2); ext[3] = Math.max(ext[3], y2); };
    const edges = [];
    pairs.forEach((list) => list.forEach((e, i) => {
      const flip = e.from > e.to, src = nodeOf.get(e.from);
      const pts = route(e, B.get(e.from), B.get(e.to), i, list.length, kind, flip);
      edges.push({ e, pts, lab: e.label ? labelAt(pts, e.label, kind, src.type, i, list.length, flip) : null });
    }));
    let lines = '', labels = '', shapes = '';
    edges.forEach(({ e, pts, lab }) => {
      pts.forEach((p) => grow(p[0], p[1]));
      const sel = o.sel === e.id;
      lines += `<g class="dg-edge${e.bad ? ' bad' : ''}${sel ? ' sel' : ''}"><path d="M${pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L')}"/>` +
        (kind === 'tree' ? '' : `<path class="dg-head" d="${head(pts[pts.length - 2], pts[pts.length - 1])}"/>`) + '</g>';
      if (lab) { labels += labSvg(lab, sel, e.bad); grow(lab.x0 - 3, lab.y0 - 3, lab.x1 + 3, lab.y1 + 3); }
    });
    P.nodes.forEach((n) => {
      const R = B.get(n.id);
      shapes += nodeSvg(n, R, o);
      grow(R.l, R.t - (n.type === 'ent' ? 5 : 0), R.r + (n.type === 'ent' ? 5 : 0), R.b);
    });
    return { body: lines + shapes + labels, ext, B, edges };
  }

  /* ---------- Hierarchy chart: susun otomatis seperti pohon ---------- */
  function tidy(P) {
    const S = new Map(P.nodes.map((n) => [n.id, size(n)]));
    if (!P.nodes.length) return;
    const kids = (id) => P.edges.filter((e) => e.from === id).map((e) => P.nodes.find((n) => n.id === e.to)).filter(Boolean).sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    const seen = new Set(), ch = new Map();
    const build = (n) => {
      const c = kids(n.id).filter((k) => !seen.has(k.id));
      c.forEach((k) => seen.add(k.id));
      ch.set(n.id, c);
      c.forEach(build);
    };
    const forest = [];
    const roots = P.nodes.filter((n) => !P.edges.some((e) => e.to === n.id)).sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    [...roots, ...P.nodes].forEach((n) => { if (!seen.has(n.id)) { seen.add(n.id); forest.push(n); build(n); } });
    const GAP = 24, rowH = Math.max(...P.nodes.map((n) => S.get(n.id).h)) + 56, memo = new Map();
    const wid = (n) => {
      if (memo.has(n.id)) return memo.get(n.id);
      const c = ch.get(n.id) || [];
      const v = Math.max(S.get(n.id).w, c.reduce((s, k) => s + wid(k), 0) + GAP * Math.max(0, c.length - 1));
      memo.set(n.id, v);
      return v;
    };
    const place = (n, left, depth) => {
      const w = wid(n), c = ch.get(n.id) || [];
      n.x = Math.round(left + w / 2);
      n.y = Math.round(40 + depth * rowH + S.get(n.id).h / 2);
      const cw = c.reduce((s, k) => s + wid(k), 0) + GAP * Math.max(0, c.length - 1);
      let x = left + (w - cw) / 2;
      c.forEach((k) => { place(k, x, depth + 1); x += wid(k) + GAP; });
    };
    let left = 40;
    forest.forEach((r) => { place(r, left, 0); left += wid(r) + GAP * 2; });
  }

  /* ---------- Spec teks ---------- */
  function parse(spec, kind, grid) {
    const g = (grid || '').split(',').map(Number);
    const [gx, gy] = g.length === 2 && g.every((v) => v > 0) ? g : GRID[kind];
    const P = { name: '', nodes: [], edges: [] };
    let auto = false;
    String(spec).split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      let m = line.match(/^(\S+)\s*>\s*(\S+)(.*)$/);
      if (m) {
        let rest = m[3];
        const e = { id: 'e' + P.edges.length, from: m[1], to: m[2], label: '' };
        if (/(^|\s)!$/.test(rest)) { e.bad = true; rest = rest.replace(/\s*!$/, ''); }
        const r = rest.match(/@(\w+)\s*$/);
        if (r) { e.route = r[1]; rest = rest.slice(0, r.index); }
        const l = rest.match(/^\s*:\s*(.*)$/);
        if (l) e.label = l[1].trim().replace(/\\n/g, '\n');
        P.edges.push(e);
        return;
      }
      m = line.match(/^(\w+)\s+(\w+)(?:\s+(-?[\d.]+)\s+(-?[\d.]+))?(?:\s+=(\d+)x(\d+))?\s*(.*)$/);
      if (!m || !T[m[1]]) { console.warn('diagram.js: baris tidak dikenal:', line); return; }
      const n = { id: m[2], type: m[1], x: m[3] == null ? null : +m[3] * gx, y: m[4] == null ? null : +m[4] * gy, text: m[7] };
      if (m[5]) { n.w = +m[5]; n.h = +m[6]; }
      if (/(^|\s)!$/.test(n.text)) { n.bad = true; n.text = n.text.replace(/\s*!$/, ''); }
      const no = n.text.match(/^\[([^\]]*)\]\s*/);
      if (no) { n.no = no[1]; n.text = n.text.slice(no[0].length); }
      n.text = n.text.replace(/\\n/g, '\n');
      if (n.x == null) auto = true;
      P.nodes.push(n);
    });
    if (auto) tidy(P);
    return P;
  }

  /* ---------- Pseudocode dan IPO chart ---------- */
  const PKW = /^(Declare|Constant|Display|Input|Set|If|Then|Else|End|While|Do|Until|For|To|Step|Select|Case|Default|Module|Function|Return|Call|AND|OR|NOT|MOD)$/;
  const PTY = /^(Integer|Real|String|Boolean|Character|Ref)$/;
  const span = (c, s) => `<span class="sx-${c}">${s}</span>`;
  DG.hl = (src) => String(src).replace(/(\/\/[^\n]*)|("[^"\n]*"?)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b|([&<>])/g, (m, cm, str, num, w, ch) =>
    cm ? span('cm', esc(cm)) : str ? span('str', esc(str)) : num ? span('num', num)
      : w ? (PKW.test(w) ? span('kw', w) : PTY.test(w) ? span('ty', w) : /^(True|False)$/.test(w) ? span('num', w) : w) : esc(ch));
  DG.ipoHtml = (list) => list.map((c) => `<table class="dg-ipo"><thead><tr><th colspan="3">IPO chart: ${esc(c.module)}</th></tr><tr><th>Input</th><th>Processing</th><th>Output</th></tr></thead>` +
    `<tbody><tr>${[c.input, c.process, c.output].map((a) => `<td><ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></td>`).join('')}</tr></tbody></table>`).join('');

  DG.render = function (el) {
    const ref = el.dataset.dg, d = ref ? DG.data[ref] : { kind: el.dataset.kind, spec: el.textContent };
    if (!d) { console.warn('diagram.js: kunci tidak ada:', ref); return; }
    if (d.html != null) { el.innerHTML = d.html; return; }
    if (d.code != null) { el.innerHTML = `<pre class="kode"><code>${DG.hl(d.code)}</code></pre>`; return; }
    if (d.ipo) { el.innerHTML = DG.ipoHtml(d.ipo); return; }
    const g = draw(parse(d.spec, d.kind, el.dataset.grid || d.grid), d.kind);
    const pad = 12, [x0, y0, x1, y1] = g.ext, W = Math.ceil(x1 - x0 + 2 * pad), H = Math.ceil(y1 - y0 + 2 * pad);
    el.classList.add('dg-fig');
    el.innerHTML = `<svg viewBox="${r1(x0 - pad)} ${r1(y0 - pad)} ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(el.dataset.alt || d.alt || '')}">${g.body}</svg>`;
    el.firstChild.style.minWidth = Math.round(Math.min(W, Math.max(240, W * (+el.dataset.min || 0.7)))) + 'px';
  };
  DG.renderAll = (root = document) => root.querySelectorAll('[data-dg], .dg-fig[data-kind]').forEach(DG.render);
  addEventListener('DOMContentLoaded', () => DG.renderAll());

  /* ---------- Pemeriksa aturan ---------- */
  DG.check = function (kind, pages, cur) {
    const P = pages[cur], out = [];
    const N = (id) => P.nodes.find((n) => n.id === id);
    const ins = (id) => P.edges.filter((e) => e.to === id), outs = (id) => P.edges.filter((e) => e.from === id);
    const name = (n) => `"${(n.text || '').replace(/\s+/g, ' ').trim() || T[n.type].n}"`;
    const add = (msg, ...ids) => out.push({ msg, ids });
    if (!P.nodes.length) return [{ msg: 'Kanvas halaman ini masih kosong.', ids: [] }];
    P.nodes.forEach((n) => { if (!(n.text || '').trim()) add(`Ada ${T[n.type].n.toLowerCase()} yang belum diberi teks.`, n.id); });
    if (kind === 'flow') {
      const terms = P.nodes.filter((n) => n.type === 'term');
      const starts = terms.filter((n) => !ins(n.id).length && outs(n.id).length);
      const ends = terms.filter((n) => ins(n.id).length && !outs(n.id).length);
      if (!starts.length) add('Belum ada terminal awal (Start, atau nama tombol yang diklik) dengan panah keluar.');
      if (starts.length > 1) add('Ada lebih dari satu terminal awal. Satu flowchart hanya punya satu titik mulai.', ...starts.map((n) => n.id));
      if (!ends.length) add('Belum ada terminal End di akhir alur.');
      terms.forEach((n) => {
        if (ins(n.id).length && outs(n.id).length) add(`Terminal ${name(n)} punya panah masuk dan keluar. Terminal hanya untuk awal atau akhir.`, n.id);
        if (!ins(n.id).length && !outs(n.id).length) add(`Terminal ${name(n)} belum tersambung.`, n.id);
      });
      P.nodes.forEach((n) => {
        if (n.type === 'term' || n.type === 'conn' || n.type === 'pt') return;
        const o = outs(n.id);
        if (!ins(n.id).length) add(`${name(n)} tidak punya panah masuk, jadi tidak pernah dijalankan.`, n.id);
        if (!o.length) add(`${name(n)} tidak punya panah keluar. Setiap jalur harus sampai ke End.`, n.id);
        if (n.type === 'dec') {
          if (o.length && o.length !== 2) add(`Decision ${name(n)} harus punya tepat dua panah keluar (Yes dan No), sekarang ${o.length}.`, n.id);
          else if (o.length === 2 && o.some((e) => !(e.label || '').trim())) add(`Beri label Yes dan No pada panah keluar decision ${name(n)}.`, n.id);
        } else if (o.length > 1) add(`${name(n)} punya ${o.length} panah keluar. Hanya decision yang boleh bercabang.`, n.id);
      });
    }
    if (kind === 'tree') {
      const roots = P.nodes.filter((n) => !ins(n.id).length);
      if (roots.length > 1) add(`Ada ${roots.length} kotak tanpa atasan. Hierarchy chart hanya punya satu kotak paling atas (main), kotak lain tersambung ke pemanggilnya.`, ...roots.map((n) => n.id));
      P.nodes.forEach((n) => { if (ins(n.id).length > 1) add(`${name(n)} punya lebih dari satu atasan. Kalau module dipanggil dari dua tempat, gambar kotaknya dua kali.`, n.id); });
      P.edges.forEach((e) => { const a = N(e.from), b = N(e.to); if (a && b && b.y <= a.y) add(`${name(b)} digambar tidak di bawah pemanggilnya ${name(a)}. Tarik garis dari pemanggil ke module yang dipanggil.`, b.id); });
    }
    if (kind === 'dfd') {
      const ctxRe = /context|konteks/i, isCtx = ctxRe.test(P.name || '');
      P.edges.forEach((e) => {
        const a = N(e.from), b = N(e.to);
        if (!a || !b) return;
        if (!(e.label || '').trim()) add(`Data flow dari ${name(a)} ke ${name(b)} belum diberi nama. Setiap data flow diberi nama datanya (kata benda).`, e.id);
        if (a.type !== 'dproc' && b.type !== 'dproc') add(`Data flow ${name(a)} ke ${name(b)} tidak melewati process. Data hanya boleh dipindahkan oleh process.`, e.id);
      });
      P.nodes.forEach((n) => {
        const i = ins(n.id).length, o = outs(n.id).length;
        if (n.type === 'dproc') {
          if (!i && o) add(`Process ${name(n)} mengeluarkan data tanpa menerima input (miracle).`, n.id);
          if (i && !o) add(`Process ${name(n)} menerima data tanpa mengeluarkan output (black hole).`, n.id);
        }
        if (!i && !o) add(`${T[n.type].n} ${name(n)} belum tersambung.`, n.id);
      });
      const procs = P.nodes.filter((n) => n.type === 'dproc');
      if (isCtx) {
        if (procs.length !== 1) add(`Context diagram hanya punya satu process (seluruh sistem), sekarang ${procs.length}.`, ...procs.map((n) => n.id));
        else if (String(procs[0].no ?? '').trim() !== '0') add('Process di context diagram diberi nomor 0.', procs[0].id);
        const stores = P.nodes.filter((n) => n.type === 'store');
        if (stores.length) add('Context diagram belum memakai data store. Data store baru digambar mulai Level 0.', ...stores.map((n) => n.id));
      } else {
        const seen = {};
        procs.forEach((n) => {
          const k = String(n.no ?? '').trim();
          if (!k) add(`Process ${name(n)} belum diberi nomor.`, n.id);
          else if (seen[k]) add(`Nomor process ${k} dipakai dua kali.`, n.id);
          seen[k] = 1;
        });
      }
      // Balancing: flow ke dan dari external entity harus sama di Context diagram dan Level 0.
      const ctx = pages.find((p) => ctxRe.test(p.name || '')), l0 = pages.find((p) => /level\s*0/i.test(p.name || ''));
      if (ctx && l0 && (P === ctx || P === l0) && ctx.nodes.length && l0.nodes.length) {
        const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const flows = (p) => {
          const map = new Map();
          p.edges.forEach((e) => {
            const a = p.nodes.find((n) => n.id === e.from), b = p.nodes.find((n) => n.id === e.to);
            if (!a || !b) return;
            const ent = a.type === 'ent' ? a : b.type === 'ent' ? b : null;
            if (!ent) return;
            const dir = ent === a ? 'dari' : 'ke';
            map.set(`${dir}|${norm(ent.text)}|${norm(e.label)}`, `"${(e.label || '').trim()}" ${dir} ${(ent.text || '').trim()}`);
          });
          return map;
        };
        const A = flows(ctx), Bf = flows(l0);
        A.forEach((v, k) => { if (!Bf.has(k)) add(`Balancing: data flow ${v} ada di Context diagram, tapi tidak ada di Level 0.`); });
        Bf.forEach((v, k) => { if (!A.has(k)) add(`Balancing: data flow ${v} ada di Level 0, tapi tidak ada di Context diagram.`); });
      }
    }
    return out;
  };

  /* ---------- Editor kanvas ---------- */
  const ICON = {
    term: '<rect x="2" y="3" width="20" height="10" rx="5"/>',
    io: '<path d="M6 3h16l-4 10H2z"/>',
    proc: '<rect x="2" y="3" width="20" height="10"/>',
    dec: '<path d="M12 1l10 7-10 7L2 8z"/>',
    call: '<rect x="2" y="3" width="20" height="10"/><path d="M5 3v10M19 3v10"/>',
    conn: '<circle cx="12" cy="8" r="6"/>',
    mod: '<rect x="2" y="3" width="20" height="10"/>',
    ent: '<path d="M5 2h17v10"/><rect x="2" y="4" width="17" height="10"/>',
    dproc: '<rect x="3" y="1" width="18" height="14" rx="3"/><path d="M3 5.5h18"/>',
    store: '<path d="M22 3H2v10h20M7 3v10"/>',
  };
  const HINT = {
    flow: 'Klik bentuk untuk memilih, lalu klik tombol bentuk: bentuk baru muncul di bawahnya dan langsung tersambung. Klik dua kali bentuk atau garis untuk menulis (Enter selesai, Shift+Enter baris baru). Tarik titik biru ke bentuk lain untuk menyambung, tarik kotak kecil di pojok untuk mengubah ukuran.',
    tree: 'Klik kotak untuk memilih, lalu klik Module: kotak baru menjadi bawahannya dan susunannya dirapikan otomatis. Klik dua kali kotak untuk menulis nama module. Tarik titik biru dari pemanggil ke module yang dipanggil.',
    dfd: 'Klik tombol bentuk untuk menambah. Tarik titik biru dari satu bentuk ke bentuk lain untuk membuat data flow, lalu langsung ketik nama datanya. Nomor process dan data store diubah di kolom Nomor.',
  };
  const near = (p, q, d) => Math.abs(p[0] - q[0]) <= d && Math.abs(p[1] - q[1]) <= d;
  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  const ports = (R) => [[R.x, R.t], [R.r, R.y], [R.x, R.b], [R.l, R.y]];
  const snap = (v) => Math.round(v / 10) * 10;

  DG.editor = function (root, opt) {
    const kind = opt.kind, types = Object.keys(T).filter((t) => T[t].k === kind);
    let pages = JSON.parse(JSON.stringify(opt.pages)), cur = 0, sel = null, hover = null, zoom = 1, drag = null, editing = null, g = null, seq = 0;
    const undo = [], redo = [];
    const reseq = () => pages.forEach((p) => [...p.nodes, ...p.edges].forEach((o) => { seq = Math.max(seq, +String(o.id).replace(/\D/g, '') || 0); }));
    reseq();
    root.classList.add('dg-ed');
    root.innerHTML = `<div class="dg-tools">
      <div class="dg-add">${types.map((t) => `<button type="button" class="btn btn-sm" data-add="${t}" title="Tambah ${T[t].n}"><svg class="dg-ico" viewBox="0 0 24 16" aria-hidden="true">${ICON[t]}</svg>${T[t].n}</button>`).join('')}</div>
      <div class="dg-act">
        <label class="dg-nofield" hidden>Nomor <input class="field" size="4"></label>
        <button type="button" class="btn btn-sm" data-act="text">Edit teks</button>
        ${kind === 'tree' ? '<button type="button" class="btn btn-sm" data-act="tidy">Rapikan</button>' : '<button type="button" class="btn btn-sm" data-act="route" title="Ganti jalur garis yang dipilih">Jalur</button>'}
        <button type="button" class="btn btn-sm" data-act="del">Hapus</button>
        <button type="button" class="tool" data-act="undo" title="Undo (Ctrl+Z)" aria-label="Undo"><svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button>
        <button type="button" class="tool" data-act="redo" title="Redo (Ctrl+Y)" aria-label="Redo"><svg viewBox="0 0 24 24"><path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/></svg></button>
        <button type="button" class="tool" data-act="zout" title="Perkecil" aria-label="Perkecil">−</button>
        <span class="dg-zoom label">100%</span>
        <button type="button" class="tool" data-act="zin" title="Perbesar" aria-label="Perbesar">+</button>
        <button type="button" class="btn btn-sm btn-go" data-act="check">Cek aturan</button>
      </div></div>
      <div class="dg-pages seg"></div>
      <div class="dg-wrap" tabindex="0"><svg class="dg-svg" xmlns="http://www.w3.org/2000/svg"></svg><textarea class="dg-edit" hidden rows="1" spellcheck="false"></textarea></div>
      <p class="dg-hint label">${HINT[kind]}</p>
      <div class="dg-check" hidden></div>`;
    const $ = (s) => root.querySelector(s);
    const svg = $('.dg-svg'), wrapEl = $('.dg-wrap'), ta = $('.dg-edit'), cbox = $('.dg-check'), noField = $('.dg-nofield'), noInput = noField.querySelector('input');
    const page = () => pages[cur];
    const nodeById = (id) => page().nodes.find((n) => n.id === id);
    const edgeById = (id) => page().edges.find((e) => e.id === id);
    const snapshot = () => JSON.stringify(pages);
    const push = (s = snapshot()) => { undo.push(s); if (undo.length > 100) undo.shift(); redo.length = 0; };
    const save = () => { cbox.hidden = true; opt.onChange && opt.onChange(JSON.parse(snapshot())); };

    function render() {
      g = draw(page(), kind, { sel: sel && (sel.node || sel.edge) });
      let extra = '';
      const sR = sel && sel.node && g.B.get(sel.node);
      if (sR) extra += `<rect class="dg-selbox" x="${r1(sR.l - 4)}" y="${r1(sR.t - 4)}" width="${r1(sR.w + 8)}" height="${r1(sR.h + 8)}" rx="4"/>`;
      new Set([sel && sel.node, hover].filter(Boolean)).forEach((id) => {
        const R = g.B.get(id);
        if (R) ports(R).forEach(([x, y]) => { extra += `<circle class="dg-port" cx="${r1(x)}" cy="${r1(y)}" r="5"/>`; });
      });
      if (sR && page().nodes.find((n) => n.id === sel.node).type !== 'conn') extra += `<rect class="dg-resize" x="${r1(sR.r - 4)}" y="${r1(sR.b - 4)}" width="8" height="8"/>`;
      if (drag && drag.mode === 'link') { const R = g.B.get(drag.from); extra += `<path class="dg-tmp" d="M${r1(R.x)} ${r1(R.y)}L${r1(drag.p[0])} ${r1(drag.p[1])}"/>`; }
      const ex = g.ext, W = Math.max(isFinite(ex[2]) ? ex[2] + 300 : 0, (wrapEl.clientWidth || 900) / zoom), H = Math.max(isFinite(ex[3]) ? ex[3] + 240 : 0, (wrapEl.clientHeight || 480) / zoom);
      svg.setAttribute('viewBox', `0 0 ${Math.ceil(W)} ${Math.ceil(H)}`);
      svg.setAttribute('width', Math.ceil(W * zoom));
      svg.setAttribute('height', Math.ceil(H * zoom));
      svg.style.backgroundSize = `${20 * zoom}px ${20 * zoom}px`;
      svg.innerHTML = g.body + extra;
      tools();
      if (editing) place();
    }
    function tools() {
      const n = sel && sel.node && nodeById(sel.node), e = sel && sel.edge && edgeById(sel.edge);
      root.querySelector('[data-act="text"]').disabled = !n && !e;
      root.querySelector('[data-act="del"]').disabled = !n && !e;
      const rb = root.querySelector('[data-act="route"]');
      if (rb) { rb.disabled = !e; rb.textContent = 'Jalur' + (e ? `: ${e.route || 'auto'}` : ''); }
      const showNo = n && (n.type === 'dproc' || n.type === 'store');
      noField.hidden = !showNo;
      if (showNo && document.activeElement !== noInput) noInput.value = n.no ?? '';
      root.querySelector('[data-act="undo"]').disabled = !undo.length;
      root.querySelector('[data-act="redo"]').disabled = !redo.length;
      $('.dg-zoom').textContent = Math.round(zoom * 100) + '%';
    }
    function renderPages() {
      const bar = $('.dg-pages');
      bar.innerHTML = pages.map((p, i) => `<button type="button" class="btn btn-sm${i === cur ? ' sel' : ''}" data-page="${i}">${esc(p.name)}</button>`).join('') +
        (kind === 'tree' ? '' : '<button type="button" class="btn btn-sm" data-page="+" title="Tambah halaman diagram">+ Halaman</button>');
      bar.hidden = kind === 'tree' && pages.length < 2;
    }

    const pt = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom]; };
    function hitNode(p) {
      const ns = page().nodes;
      for (let i = ns.length - 1; i >= 0; i--) {
        const R = g.B.get(ns[i].id);
        if (ns[i].type !== 'pt' && p[0] >= R.l - 2 && p[0] <= R.r + 2 && p[1] >= R.t - 2 && p[1] <= R.b + 2) return ns[i].id;
      }
      return null;
    }
    function hit(p) {
      const sR = sel && sel.node && g.B.get(sel.node);
      if (sR && nodeById(sel.node).type !== 'conn' && near(p, [sR.r, sR.b], 8)) return { t: 'size', id: sel.node };
      for (const id of [sel && sel.node, hover]) {
        const R = id && g.B.get(id);
        if (R && ports(R).some((q) => near(p, q, 8))) return { t: 'port', id };
      }
      for (const L of g.edges) if (L.lab && p[0] >= L.lab.x0 - 3 && p[0] <= L.lab.x1 + 3 && p[1] >= L.lab.y0 - 3 && p[1] <= L.lab.y1 + 3) return { t: 'edge', id: L.e.id };
      const n = hitNode(p);
      if (n) return { t: 'node', id: n };
      for (const L of g.edges) for (let k = 0; k < L.pts.length - 1; k++) if (segDist(p, L.pts[k], L.pts[k + 1]) < 6) return { t: 'edge', id: L.e.id };
      return null;
    }

    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      commit();
      wrapEl.focus({ preventScroll: true });
      const p = pt(e), h = hit(p);
      svg.setPointerCapture(e.pointerId);
      if (!h) { sel = null; drag = { mode: 'pan', cx: e.clientX, cy: e.clientY, sl: wrapEl.scrollLeft, st: wrapEl.scrollTop }; render(); return; }
      if (h.t === 'port') drag = { mode: 'link', from: h.id, p };
      else if (h.t === 'size') { const R = g.B.get(h.id); drag = { mode: 'size', id: h.id, l: R.l, t: R.t, start: snapshot() }; }
      else if (h.t === 'node') { const n = nodeById(h.id); sel = { node: h.id }; drag = { mode: 'move', id: h.id, dx: n.x - p[0], dy: n.y - p[1], start: snapshot() }; }
      else sel = { edge: h.id };
      render();
      e.preventDefault();
    });
    svg.addEventListener('pointermove', (e) => {
      const p = pt(e);
      if (!drag) {
        const h = hit(p), nh = hitNode(p);
        svg.style.cursor = !h ? 'grab' : h.t === 'port' ? 'crosshair' : h.t === 'size' ? 'nwse-resize' : h.t === 'node' ? 'move' : 'pointer';
        if (nh !== hover && !(h && h.t === 'port')) { hover = nh; render(); }
        return;
      }
      if (drag.mode === 'pan') { wrapEl.scrollLeft = drag.sl - (e.clientX - drag.cx); wrapEl.scrollTop = drag.st - (e.clientY - drag.cy); return; }
      if (drag.mode === 'link') { drag.p = p; render(); return; }
      const n = nodeById(drag.id);
      if (drag.mode === 'move') {
        const s = size(n), nx = Math.max(snap(s.w / 2 + 10), snap(p[0] + drag.dx)), ny = Math.max(snap(s.h / 2 + 10), snap(p[1] + drag.dy));
        if (nx === n.x && ny === n.y) return;
        if (!drag.moved) push(drag.start);
        drag.moved = true;
        n.x = nx; n.y = ny;
      } else {
        const w = Math.max(40, snap(p[0] - drag.l)), h = Math.max(30, snap(p[1] - drag.t));
        if (w === n.w && h === n.h) return;
        if (!drag.moved) push(drag.start);
        drag.moved = true;
        n.w = w; n.h = h; n.x = drag.l + w / 2; n.y = drag.t + h / 2;
        if (n.type === 'conn') { n.h = n.w; }
      }
      render();
    });
    const endDrag = (e) => {
      if (!drag) return;
      if (drag.mode === 'link') { const to = hitNode(pt(e)); drag.mode = null; if (to && to !== drag.from) addEdge(drag.from, to); }
      if (drag.moved) save();
      drag = null;
      render();
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; render(); } });
    svg.addEventListener('dblclick', (e) => {
      const p = pt(e), h = hit(p);
      if (h && (h.t === 'node' || h.t === 'size')) startText({ node: h.id });
      else if (h && h.t === 'edge' && kind !== 'tree') startText({ edge: h.id });
      else if (!h) { sel = null; addNode(kind === 'dfd' ? 'dproc' : kind === 'tree' ? 'mod' : 'proc', p); }
    });

    /* Menulis teks di dalam bentuk atau label garis */
    function startText(target, selectAll) {
      const obj = target.node ? nodeById(target.node) : edgeById(target.edge);
      if (!obj) return;
      sel = target;
      editing = { target, obj, before: snapshot() };
      ta.value = target.node ? obj.text || '' : obj.label || '';
      ta.hidden = false;
      render();
      ta.focus({ preventScroll: true });
      if (selectAll) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length);
    }
    function place() {
      const { target, obj } = editing;
      let x, y, w, h, lines;
      if (target.node) {
        const R = g.B.get(target.node), top = obj.type === 'dproc' ? R.t + BAND : R.t;
        w = Math.max(R.w, 120); h = R.b - top; x = R.x - w / 2; y = top; lines = R.lines.length;
      } else {
        const L = g.edges.find((l) => l.e.id === target.edge);
        if (!L) return;
        const m = L.lab ? [(L.lab.x0 + L.lab.x1) / 2, L.lab.y] : L.pts[Math.floor(L.pts.length / 2) - (L.pts.length % 2 ? 0 : 1)].map((v, k) => (v + L.pts[Math.floor(L.pts.length / 2)][k]) / 2);
        lines = Math.max(1, ta.value.split('\n').length);
        w = Math.max(150, L.lab ? L.lab.x1 - L.lab.x0 + 30 : 0); h = lines * 16 + 14; x = m[0] - w / 2; y = m[1] - h / 2;
      }
      const lh = target.node ? LH : 16;
      Object.assign(ta.style, {
        left: x * zoom + 'px', top: y * zoom + 'px', width: w * zoom + 'px', height: h * zoom + 'px',
        fontSize: (target.node ? FS : 13) * zoom + 'px', lineHeight: lh * zoom + 'px',
        paddingTop: Math.max(0, (h - lines * lh) / 2 - 2) * zoom + 'px',
      });
    }
    function commit() {
      if (!editing) return;
      const changed = snapshot() !== editing.before;
      if (changed) push(editing.before);
      editing = null;
      ta.hidden = true;
      if (changed) save();
      render();
    }
    ta.addEventListener('input', () => {
      if (!editing) return;
      if (editing.target.node) editing.obj.text = ta.value; else editing.obj.label = ta.value;
      render();
    });
    ta.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); commit(); wrapEl.focus({ preventScroll: true }); }
    });
    ta.addEventListener('blur', commit);

    /* Menambah, menyambung, menghapus */
    const nextNo = (type) => {
      const P = page();
      if (type === 'dproc') return /context|konteks/i.test(P.name || '') ? '0' : String(P.nodes.filter((n) => n.type === 'dproc').length + 1);
      return 'D' + (P.nodes.filter((n) => n.type === 'store').length + 1);
    };
    const overlaps = (n) => { const A = box(n); return page().nodes.some((m) => { if (m === n) return false; const B = box(m); return A.l < B.r && A.r > B.l && A.t < B.b && A.b > B.t; }); };
    function addNode(type, at) {
      commit();
      push();
      const P = page();
      const n = { id: 'n' + ++seq, type, text: type === 'term' && P.nodes.some((m) => m.type === 'term') ? 'End' : T[type].d, x: 0, y: 0 };
      if (type === 'dproc' || type === 'store') n.no = nextNo(type);
      const from = !at && kind !== 'dfd' && sel && sel.node ? nodeById(sel.node) : null;
      const fromOuts = from ? P.edges.filter((e) => e.from === from.id).length : 0;
      // Sambung otomatis hanya kalau bentuk terpilih masih boleh punya panah keluar (End tidak, decision maksimal dua).
      const link = from && (kind === 'tree' || (fromOuts < (from.type === 'dec' ? 2 : 1) && !(from.type === 'term' && P.edges.some((e) => e.to === from.id))));
      const s = size(n);
      if (at) { n.x = snap(Math.max(at[0], s.w / 2 + 10)); n.y = snap(Math.max(at[1], s.h / 2 + 10)); }
      else if (from) {
        const R = box(from);
        if (kind === 'tree') { n.x = from.x + 100000; n.y = R.b + 80; }
        else if (from.type === 'dec' && fromOuts === 1) { n.x = snap(R.r + 150); n.y = from.y; } // cabang kedua di kanan, beri ruang untuk teks yang masih akan diketik
        else { n.x = from.x; n.y = snap(R.b + 50 + s.h / 2); }
      } else {
        n.x = snap((wrapEl.scrollLeft + wrapEl.clientWidth / 2) / zoom);
        n.y = snap((wrapEl.scrollTop + Math.min(wrapEl.clientHeight, 400) / 2) / zoom);
        n.x = Math.max(n.x, snap(s.w / 2 + 10)); n.y = Math.max(n.y, snap(s.h / 2 + 10));
      }
      for (let k = 0; k < 60 && kind !== 'tree' && overlaps(n); k++) n.y += 20;
      P.nodes.push(n);
      if (from && link) P.edges.push({ id: 'e' + ++seq, from: from.id, to: n.id, label: kind === 'flow' && from.type === 'dec' ? (fromOuts ? 'No' : 'Yes') : '' });
      if (kind === 'tree') tidy(P);
      sel = { node: n.id };
      save();
      render();
      reveal(n.id);
      startText(sel, true);
    }
    function addEdge(a, b) {
      const P = page();
      if (kind !== 'dfd' && P.edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))) return;
      push();
      const src = nodeById(a), outs = P.edges.filter((e) => e.from === a).length;
      const e = { id: 'e' + ++seq, from: a, to: b, label: kind === 'flow' && src.type === 'dec' ? (outs ? 'No' : 'Yes') : '' };
      P.edges.push(e);
      sel = { edge: e.id };
      save();
      render();
      if (kind === 'dfd') startText(sel, true);
    }
    function del() {
      if (!sel) return;
      commit();
      push();
      const P = page();
      if (sel.node) { P.nodes = P.nodes.filter((n) => n.id !== sel.node); P.edges = P.edges.filter((e) => e.from !== sel.node && e.to !== sel.node); }
      else P.edges = P.edges.filter((e) => e.id !== sel.edge);
      sel = null;
      save();
      render();
    }
    function reveal(id) {
      const R = g.B.get(id);
      if (!R) return;
      const L = R.l * zoom, Tt = R.t * zoom, Rr = R.r * zoom, Bb = R.b * zoom;
      if (L < wrapEl.scrollLeft || Rr > wrapEl.scrollLeft + wrapEl.clientWidth) wrapEl.scrollLeft = (L + Rr) / 2 - wrapEl.clientWidth / 2;
      if (Tt < wrapEl.scrollTop || Bb > wrapEl.scrollTop + wrapEl.clientHeight) wrapEl.scrollTop = (Tt + Bb) / 2 - wrapEl.clientHeight / 2;
    }
    const swap = (from, to) => { if (!from.length) return; commit(); to.push(snapshot()); pages = JSON.parse(from.pop()); cur = Math.min(cur, pages.length - 1); sel = null; save(); renderPages(); render(); };
    const ROUTES = ['auto', 'h', 'v', 't', 'r', 'l', 's'];

    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.dataset.add) { addNode(b.dataset.add); return; }
      if (b.dataset.page) {
        commit();
        if (b.dataset.page === '+') { pages.push({ name: (kind === 'dfd' ? 'Diagram ' : 'Flowchart ') + (pages.length + 1), nodes: [], edges: [] }); cur = pages.length - 1; save(); }
        else cur = +b.dataset.page;
        sel = null; hover = null;
        renderPages();
        render();
        return;
      }
      switch (b.dataset.act) {
        case 'text': if (sel) startText(sel); break;
        case 'del': del(); break;
        case 'route': { const ed = sel && sel.edge && edgeById(sel.edge); if (!ed) break; push(); ed.route = ROUTES[(ROUTES.indexOf(ed.route || 'auto') + 1) % ROUTES.length]; if (ed.route === 'auto') delete ed.route; save(); render(); break; }
        case 'tidy': push(); tidy(page()); save(); render(); break;
        case 'undo': swap(undo, redo); break;
        case 'redo': swap(redo, undo); break;
        case 'zin': zoom = Math.min(2, zoom + 0.25); render(); break;
        case 'zout': zoom = Math.max(0.5, zoom - 0.25); render(); break;
        case 'check': check(); break;
      }
    });
    noInput.addEventListener('input', () => { const n = sel && sel.node && nodeById(sel.node); if (!n) return; n.no = noInput.value; save(); render(); });
    noInput.addEventListener('focus', () => push());
    wrapEl.addEventListener('keydown', (e) => {
      if (e.target === ta) return;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); del(); }
      else if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? swap(redo, undo) : swap(undo, redo); }
      else if (mod && k === 'y') { e.preventDefault(); swap(redo, undo); }
      else if (e.key === 'Enter' && sel) { e.preventDefault(); startText(sel); }
      else if (e.key.startsWith('Arrow') && sel && sel.node) {
        e.preventDefault();
        const n = nodeById(sel.node), d = e.shiftKey ? 50 : 10;
        push();
        if (e.key === 'ArrowLeft') n.x = Math.max(10, n.x - d); if (e.key === 'ArrowRight') n.x += d;
        if (e.key === 'ArrowUp') n.y = Math.max(10, n.y - d); if (e.key === 'ArrowDown') n.y += d;
        save(); render();
      }
    });
    function check() {
      commit();
      const res = DG.check(kind, pages, cur);
      cbox.hidden = false;
      cbox.innerHTML = res.length
        ? `<p><strong>${res.length} hal perlu diperbaiki.</strong> Klik untuk menunjuk bentuk atau garisnya.</p><ul>${res.map((r, i) => `<li><button type="button" class="dg-issue" data-i="${i}">${esc(r.msg)}</button></li>`).join('')}</ul>`
        : '<p>✅ Tidak ada pelanggaran aturan dasar di halaman ini. Isi jawabanmu tetap dibandingkan dengan contoh jawaban.</p>';
      cbox.querySelectorAll('.dg-issue').forEach((b) => b.addEventListener('click', () => {
        const id = res[+b.dataset.i].ids[0];
        if (!id) return;
        sel = nodeById(id) ? { node: id } : { edge: id };
        render();
        if (sel.node) reveal(id);
      }));
    }
    addEventListener('themechange', () => render());
    renderPages();
    render();
    return {
      refresh: render,
      load(p) { pages = JSON.parse(JSON.stringify(p)); cur = 0; sel = null; hover = null; editing = null; ta.hidden = true; undo.length = redo.length = 0; seq = 0; reseq(); cbox.hidden = true; renderPages(); render(); },
    };
  };
})();
