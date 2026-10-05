// Mesin visualisasi program C (dipakai materi Algorithm and programming).
// Menampilkan: kode yang sedang jalan (bisa beberapa panel: Pseudocode, Flowchart, C), kotak memory
// (nama, tipe, nilai, alamat), panah pointer, buffer keyboard, output layar, dan trace table.
//
// Halaman memanggil:
//   cviz({ layout: 'wide' | undefined, programs: { key: {
//     title,                     // label tombol
//     input,                     // isi keyboard (stdin), opsional. Bisa diubah pembaca.
//     code | panes,              // `kode C`  atau  { Pseudocode: `...`, Flowchart: '<svg>...', C: `...` }
//     watch,                     // kolom trace table, misalnya ['i', 'total']
//     run: function* (m) { ... } // simulasi program; setiap yield m.step(...) = satu langkah
//   } } })
//
// Ukuran tipe mengikuti Dev-C++ (TDM-GCC, Windows 64-bit). Alamat dibuat sederhana mulai 0x1000.

const CV_SIZE = { char: 1, short: 2, int: 4, long: 4, 'long long': 8, float: 4, double: 8 };
const CV_PTR = 8;

/* ---------- printf mini: aturan format C yang dipakai di materi ---------- */
function cfmt(fmt, args) {
  let i = 0;
  return fmt.replace(/%([-+0 #]*)(\d+)?(?:\.(\d+))?(hh|h|ll|l|L)?([diuoxXfFeEcsp%])/g, (all, flags, width, prec, len, conv) => {
    if (conv === '%') return '%';
    const v = args[i++];
    let s;
    switch (conv) {
      case 'd': case 'i': s = String(Math.trunc(v)); break;
      case 'u': s = String(Math.trunc(v) >>> 0); break;
      case 'o': s = (Math.trunc(v) >>> 0).toString(8); break;
      case 'x': s = (Math.trunc(v) >>> 0).toString(16); break;
      case 'X': s = (Math.trunc(v) >>> 0).toString(16).toUpperCase(); break;
      case 'f': case 'F': s = Number(v).toFixed(prec === undefined ? 6 : +prec); break;
      case 'e': case 'E': {
        s = Number(v).toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, 'e$10$2');
        if (conv === 'E') s = s.toUpperCase();
        break;
      }
      case 'c': s = String.fromCharCode(v); break;
      case 's': s = String(v); if (prec !== undefined) s = s.slice(0, +prec); break;
      case 'p': s = '0x' + Number(v).toString(16).padStart(16, '0'); break;
    }
    if (/[dieEfF]/.test(conv) && Number(v) >= 0) {
      if (flags.includes('+')) s = '+' + s;
      else if (flags.includes(' ')) s = ' ' + s;
    }
    const w = width ? +width : 0;
    if (s.length < w) {
      if (flags.includes('-')) s = s.padEnd(w);
      else if (flags.includes('0') && /[diuoxXfFeE]/.test(conv)) {
        const sign = /^[+\- ]/.test(s) ? s[0] : '';
        s = sign + s.slice(sign.length).padStart(w - sign.length, '0');
      } else s = s.padStart(w);
    }
    return s;
  });
}

/* ---------- Mesin: memory + buffer keyboard + output ---------- */
function cvMachine(input) {
  const m = {
    cells: [], out: '', buf: input || '', pos: 0, lastRead: null, rows: [], wild: [], next: 0x1000,
  };
  const align = (n) => { m.next = Math.ceil(m.next / n) * n; };
  const elemType = (t) => t.replace(/\*$/, '');
  const sizeOf = (t) => (t.endsWith('*') ? CV_PTR : CV_SIZE[t]);

  // Konversi nilai seperti C: int dipotong ke bawah (menuju 0), char wrap around di -128..127, float dibulatkan.
  function conv(type, v) {
    if (v === undefined || v === null || type.endsWith('*')) return v;
    if (type === 'char') return ((Math.trunc(v) + 128) % 256 + 256) % 256 - 128;
    if (type === 'short') return ((Math.trunc(v) + 32768) % 65536 + 65536) % 65536 - 32768;
    if (type === 'int' || type === 'long') return Math.trunc(v) | 0;
    if (type === 'float') return Math.fround(v);
    return v;
  }

  // decl('int', 'x', 5) · decl('int', 'A[5]', [1,2]) · decl('char', 's[10]', 'BiNus') · decl('int*', 'p', m.addr('x'))
  m.decl = (type, spec, init) => {
    const [, name, dimStr] = spec.match(/^(\w+)((?:\[\d+\])*)$/);
    const dims = [...dimStr.matchAll(/\[(\d+)\]/g)].map((d) => +d[1]);
    const size = sizeOf(type);
    const count = dims.reduce((a, b) => a * b, 1);
    align(Math.min(size, 8));
    const cell = { name, type, size, dims, addr: m.next, vals: new Array(count).fill(undefined) };
    m.next += size * count;
    if (typeof init === 'string') {                     // string literal → kode char + '\0', sisanya 0
      cell.vals.fill(0);
      [...init].forEach((ch, i) => (cell.vals[i] = ch.charCodeAt(0)));
    } else if (Array.isArray(init)) {                   // initializer list: elemen sisanya jadi 0
      cell.vals.fill(0);
      init.forEach((v, i) => (cell.vals[i] = conv(type, v)));
    } else if (init !== undefined) cell.vals[0] = conv(type, init);
    m.cells.push(cell);
    return cell;
  };

  // Cari kotak (dan index elemen) yang menempati alamat tertentu.
  m.at = (addr) => {
    for (const c of m.cells) {
      const end = c.addr + c.size * c.vals.length;
      if (addr >= c.addr && addr < end && (addr - c.addr) % c.size === 0) return { cell: c, i: (addr - c.addr) / c.size };
    }
    return null;
  };
  m.readAt = (addr) => { const r = m.at(addr); return r ? r.cell.vals[r.i] : undefined; };
  m.writeAt = (addr, v) => {
    const r = m.at(addr);
    if (!r) { m.wild.push(addr); return; }              // di luar semua variabel: undefined behavior
    r.cell.vals[r.i] = conv(r.cell.type, v);
  };

  // Path: 'x', 'A[2]', 'a[1][2]', '*p', '**pp'
  m.addr = (path) => {
    const [, stars, name, idxStr] = path.match(/^(\**)(\w+)((?:\[\d+\])*)$/);
    const cell = m.cells.find((c) => c.name === name);
    if (!cell) throw new Error('variabel tidak ada: ' + name);
    const idx = [...idxStr.matchAll(/\[(\d+)\]/g)].map((d) => +d[1]);
    let flat = 0;
    idx.forEach((v, k) => (flat = flat * (cell.dims[k] || 1) + v));
    let addr = cell.addr + flat * cell.size;
    for (let s = 0; s < stars.length; s++) addr = m.readAt(addr);
    return addr;
  };
  m.get = (path) => m.readAt(m.addr(path));
  m.set = (path, v) => m.writeAt(m.addr(path), v);
  m.cell = (name) => m.cells.find((c) => c.name === name);
  m.str = (path) => {                                   // baca string C sampai '\0'
    let a = m.addr(path), s = '';
    for (let n = 0; n < 200; n++, a++) { const c = m.readAt(a); if (!c) break; s += String.fromCharCode(c); }
    return s;
  };

  /* ---------- Output ---------- */
  m.printf = (fmt, ...args) => { const s = cfmt(fmt, args); m.out += s; return s.length; };
  m.putchar = (c) => { m.out += String.fromCharCode(c); return c; };
  m.puts = (s) => { m.out += s + '\n'; return 1; };

  /* ---------- Input: scanf / getchar membaca dari buffer keyboard ---------- */
  const isWs = (ch) => /\s/.test(ch);
  const skipWs = () => { while (m.pos < m.buf.length && isWs(m.buf[m.pos])) m.pos++; };
  m.getchar = () => {
    if (m.pos >= m.buf.length) { m.lastRead = null; return -1; }
    m.lastRead = [m.pos, m.pos + 1];
    return m.buf.charCodeAt(m.pos++);
  };
  m.scanf = (fmt, ...paths) => {
    const start = m.pos;
    let count = 0, p = 0;
    const tokens = fmt.match(/%\d*(?:l|ll|h)?(?:[dfcsui]|\[\^?[^\]]*\])|\s+|[^%\s]+/g) || [];
    for (const tok of tokens) {
      if (/^\s+$/.test(tok)) { skipWs(); continue; }
      if (!tok.startsWith('%')) {                       // karakter biasa di format harus cocok persis
        let ok = true;
        for (const ch of tok) { if (m.buf[m.pos] === ch) m.pos++; else { ok = false; break; } }
        if (!ok) break;
        continue;
      }
      const [, w, , t] = tok.match(/^%(\d*)(l|ll|h)?([\s\S]*)$/); // [\s\S]: format %[^\n] berisi Enter
      const width = w ? +w : Infinity;
      const path = paths[p++];
      if (m.pos >= m.buf.length && count === 0) { m.lastRead = [start, m.pos]; return -1; }
      if (t === 'd' || t === 'i' || t === 'u') {
        skipWs();
        const mm = m.buf.slice(m.pos).match(/^[+-]?\d+/);
        if (!mm) break;
        m.pos += mm[0].length;
        m.set(path, parseInt(mm[0], 10));
      } else if (t === 'f') {
        skipWs();
        const mm = m.buf.slice(m.pos).match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
        if (!mm) break;
        m.pos += mm[0].length;
        m.set(path, parseFloat(mm[0]));
      } else if (t === 'c') {                           // %c TIDAK melewati spasi atau Enter
        if (m.pos >= m.buf.length) break;
        m.set(path, m.buf.charCodeAt(m.pos++));
      } else {                                          // %s atau %[...]
        let ok;
        if (t === 's') { skipWs(); ok = (ch) => !isWs(ch); }
        else {
          const neg = t[1] === '^';
          const set = t.slice(neg ? 2 : 1, -1).replace(/\\n/g, '\n');
          ok = (ch) => set.includes(ch) !== neg;
        }
        let s = '';
        while (m.pos < m.buf.length && s.length < width && ok(m.buf[m.pos])) s += m.buf[m.pos++];
        if (!s) break;
        const a = m.addr(path);
        [...s].forEach((ch, k) => m.writeAt(a + k, ch.charCodeAt(0)));
        m.writeAt(a + s.length, 0);
      }
      count++;
    }
    m.lastRead = [start, m.pos];
    return count;
  };

  m.step = (find, text, opts = {}) => ({ find, text, ...opts });
  return m;
}

/* ---------- Tampilan ---------- */
function cviz({ programs, layout }) {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hex = (a) => '0x' + a.toString(16);
  const keys = Object.keys(programs);
  let prog, m, gen, running = false, guessing = false, timer = null, st = null, hot = new Set(), count = 0, input;
  window.cvizMissing = [];                              // dicek oleh tes: langkah yang barisnya tidak ditemukan

  document.querySelector('.viz').insertAdjacentHTML('beforeend', `
<div class="controls cv-progs">${keys.map((k) => `<button class="btn btn-sm" data-prog="${k}">${esc(programs[k].title)}</button>`).join('')}</div>
<div class="cv-main${layout === 'wide' ? ' wide' : ''}">
  <div class="cv-panes" id="cv-panes"></div>
  <div class="cv-side">
    <div class="card cv-cap">
      <p id="cv-caption" aria-live="polite"></p>
      <div class="ops">
        <button class="btn btn-sm" id="cv-back">Kembali</button>
        <button class="btn btn-go btn-sm" id="cv-next">Langkah berikutnya</button>
        <button class="btn btn-sm" id="cv-play">Putar otomatis</button>
        <button class="btn btn-sm" id="cv-reset">Ulang</button>
      </div>
      <label class="guess"><input type="checkbox" id="cv-guess"> Mode tebak: tebak dulu tiap langkah</label>
    </div>
    <div class="panel cv-mem-wrap"><div class="cv-title">Memory</div><div class="cv-mem" id="cv-mem"></div><svg class="cv-arrows" id="cv-arrows"></svg></div>
    <div class="cv-io" id="cv-io"></div>
    <div class="cv-trace" id="cv-trace"></div>
  </div>
</div>`);

  // Nilai dalam kotak: char tampil sebagai karakter + kodenya, pointer sebagai alamat, float tanpa nol berlebih.
  function show(cell, v) {
    if (v === undefined) return '<span class="cv-garbage" title="Belum diisi: garbage value">?</span>';
    if (cell.type.endsWith('*')) return v === 0 ? 'NULL' : hex(v);
    if (cell.type === 'char') {
      const map = { 0: "'\\0'", 10: "'\\n'", 32: "' '", 9: "'\\t'" };
      const ch = map[v] || (v >= 33 && v < 127 ? `'${String.fromCharCode(v)}'` : '');
      return `${esc(ch)}<small>${v}</small>`;
    }
    if (cell.type === 'float' || cell.type === 'double') { const t = parseFloat(Number(v).toFixed(6)); return Number.isInteger(t) ? t.toFixed(1) : String(t); }
    return String(v);
  }
  const typeLabel = (c) => c.type + (c.dims.length ? c.dims.map((d) => `[${d}]`).join('') : '');

  function renderMemory() {
    const html = m.cells.map((c) => {
      const el = (i) => {
        const addr = c.addr + i * c.size;
        const cls = ['cv-box', hot.has(addr) ? 'hot' : '', c.type.endsWith('*') && c.vals[i] ? 'ptr' : ''].join(' ');
        const idx = c.dims.length ? `<div class="cv-idx">${c.dims.length === 2 ? `[${Math.floor(i / c.dims[1])}][${i % c.dims[1]}]` : `[${i}]`}</div>` : '';
        return `<div class="${cls}" data-addr="${addr}"><div class="cv-val">${show(c, c.vals[i])}</div>${idx}<div class="cv-addr">${hex(addr)}</div></div>`;
      };
      let body;
      if (!c.dims.length) body = el(0);
      else {
        // Array panjang dipotong: tampilkan sampai sedikit setelah '\0' (string) atau 12 elemen pertama.
        let n = c.vals.length;
        if (n > 12) { const z = c.type === 'char' ? c.vals.indexOf(0) : -1; n = z >= 0 ? Math.min(n, z + 2) : 12; }
        if (c.dims.length === 2) {
          body = Array.from({ length: c.dims[0] }, (_, r) => `<div class="cv-row"><span class="cv-rowlbl">[${r}]</span>${Array.from({ length: c.dims[1] }, (_, k) => el(r * c.dims[1] + k)).join('')}</div>`).join('');
        } else body = `<div class="cv-row">${Array.from({ length: n }, (_, i) => el(i)).join('')}${n < c.vals.length ? `<span class="cv-more">… +${c.vals.length - n}</span>` : ''}</div>`;
      }
      return `<div class="cv-var${c.dims.length ? ' arr' : ''}"><div class="cv-name">${esc(c.name)} <span>${esc(typeLabel(c))}</span></div>${body}</div>`;
    }).join('');
    $('cv-mem').innerHTML = html || '<p class="label">Belum ada variabel.</p>';
    requestAnimationFrame(drawArrows);
  }

  // Panah pointer: dari kotak pointer ke kotak yang alamatnya disimpan.
  function drawArrows() {
    const wrap = $('cv-mem').parentElement, svg = $('cv-arrows');
    const base = wrap.getBoundingClientRect();
    svg.setAttribute('width', base.width); svg.setAttribute('height', base.height);
    let s = '<defs><marker id="cv-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="cv-tip"/></marker></defs>';
    for (const c of m.cells) {
      if (!c.type.endsWith('*')) continue;
      c.vals.forEach((v, i) => {
        if (!v) return;
        const from = $('cv-mem').querySelector(`[data-addr="${c.addr + i * c.size}"]`);
        const to = $('cv-mem').querySelector(`[data-addr="${v}"]`);
        if (!from || !to) return;
        // Dari kotak nilai pointer ke kotak nilai target: lewat atas kalau target di atas atau sebaris,
        // lewat bawah kalau target di bawah. Label alamat tidak tertimpa.
        const a = from.querySelector('.cv-val').getBoundingClientRect(), b = to.querySelector('.cv-val').getBoundingClientRect();
        const x1 = a.left + a.width / 2 - base.left, x2 = b.left + b.width / 2 - base.left;
        const dip = Math.max(28, Math.abs(x2 - x1) * 0.25);
        let y1, y2, c1, c2;
        if (b.top > a.bottom) { y1 = a.bottom - base.top; y2 = b.top - base.top - 2; c1 = y1 + dip; c2 = y2 - dip; }
        else if (b.bottom < a.top) { y1 = a.top - base.top; y2 = b.bottom - base.top + 2; c1 = y1 - dip; c2 = y2 + dip; }
        else { const up = Math.max(48, Math.abs(x2 - x1) * 0.3); y1 = a.top - base.top; y2 = b.top - base.top - 2; c1 = y1 - up; c2 = y2 - up; } // lengkung di atas label nama
        s += `<path class="cv-arrow" d="M${x1} ${y1} C${x1} ${c1} ${x2} ${c2} ${x2} ${y2}" marker-end="url(#cv-tip)"/>`;
      });
    }
    svg.innerHTML = s;
  }

  function renderIO() {
    const parts = [];
    if (prog.input !== undefined) {
      const chars = [...m.buf].map((ch, i) => {
        const read = m.lastRead && i >= m.lastRead[0] && i < m.lastRead[1];
        const cls = i < m.pos ? (read ? 'read' : 'done') : i === m.pos ? 'next' : '';
        const label = ch === '\n' ? '↵' : ch === ' ' ? '␣' : esc(ch);
        return `<span class="cv-ch ${cls}">${label}</span>`;
      }).join('');
      parts.push(`<div class="card cv-buf-card"><div class="cv-title">Buffer keyboard <span class="label">(↵ = Enter, ␣ = spasi)</span></div>
        <div class="cv-buf">${chars || '<span class="label">kosong</span>'}</div>
        <label class="cv-input"><span class="label">Isi keyboard (ubah, lalu tekan Ulang):</span><textarea id="cv-stdin" rows="2" spellcheck="false">${esc(prog.inputEdit ?? prog.input)}</textarea></label></div>`);
    }
    parts.push(`<div class="card cv-out-card"><div class="cv-title">Output layar</div><pre class="cv-out">${esc(m.out)}<span class="cv-caret"></span></pre></div>`);
    $('cv-io').innerHTML = parts.join('');
    const ta = $('cv-stdin');
    if (ta) ta.oninput = () => (prog.inputEdit = ta.value);
  }

  function renderTrace() {
    if (!prog.watch) { $('cv-trace').innerHTML = ''; return; }
    const rows = m.rows.map((r, i) => `<tr${i === m.rows.length - 1 ? ' class="last"' : ''}><td>${i + 1}</td>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('');
    $('cv-trace').innerHTML = `<div class="card"><div class="cv-title">Trace table</div><table><tr><th>#</th>${prog.watch.map((w) => `<th><code>${esc(w)}</code></th>`).join('')}</tr>${rows || `<tr><td colspan="${prog.watch.length + 1}" class="label">Baris baru ditambahkan setiap iterasi.</td></tr>`}</table></div>`;
  }

  function renderPanes() {
    const panes = prog.panes || { C: prog.code };
    const find = !st ? {} : typeof st.find === 'string' ? { [Object.keys(panes).find((k) => k !== 'Flowchart')]: st.find } : st.find || {};
    $('cv-panes').innerHTML = Object.entries(panes).map(([name, src]) => {
      if (name === 'Flowchart') return `<div class="card cv-pane"><div class="cv-title">${name}</div><div class="cv-flow">${src}</div></div>`;
      const lines = src.split('\n');
      const on = find[name] ? lines.findIndex((l) => l.includes(find[name])) : -1;
      if (find[name] && on < 0) window.cvizMissing.push(`${prog.title} / ${name}: ${find[name]}`);
      return `<div class="card cv-pane"><div class="cv-title">${name}</div><pre class="cv-code">${lines.map((l, i) => `<span class="ln${i === on ? ' on' : ''}">${esc(l) || ' '}</span>`).join('')}</pre></div>`;
    }).join('');
    if (find.Flowchart) {
      const node = $('cv-panes').querySelector(`[data-id="${find.Flowchart}"]`);
      if (node) node.classList.add('on'); else window.cvizMissing.push(`${prog.title} / Flowchart: ${find.Flowchart}`);
    }
  }

  function render() {
    hot = new Set((st && st.hot || []).map((p) => { try { return m.addr(p); } catch (e) { return -1; } }));
    $('cv-caption').innerHTML = st ? st.text : `Program <b>${esc(prog.title)}</b>. Tekan <b>Langkah berikutnya</b> untuk mulai.`;
    if (m.wild.length) $('cv-caption').innerHTML += `<br><span class="cv-warn">Menulis ke alamat ${m.wild.map(hex).join(', ')}, di luar semua variabel (undefined behavior).</span>`;
    renderPanes(); renderMemory(); renderIO(); renderTrace();
  }

  function load(key) {
    prog = programs[key];
    document.querySelectorAll('[data-prog]').forEach((b) => b.classList.toggle('sel', b.dataset.prog === key));
    stop();
    input = prog.inputEdit ?? prog.input;
    if (input !== undefined && !input.endsWith('\n')) input += '\n'; // Enter terakhir yang diketik
    restart();
    render();
  }

  // Generator tidak bisa mundur, jadi Kembali = jalankan ulang dari awal sampai satu langkah sebelumnya.
  function restart() {
    m = cvMachine(input);
    m.trace = () => m.rows.push(prog.watch.map((w) => {
      const c = m.cell(w.replace(/\W.*$/, ''));
      try {
        if (c && c.type === 'char' && c.dims.length && w === c.name) return `"${esc(m.str(w))}"`; // array char utuh → string
        return show(c || { type: 'int', dims: [] }, m.get(w));
      } catch (e) { return '?'; }
    }));
    gen = prog.run(m);
    st = null; running = true; guessing = false; count = 0;
    $('cv-next').disabled = $('cv-play').disabled = false;
    $('cv-back').disabled = true;
  }
  function back() {
    if (!count) return;
    stop();
    const target = count - 1;
    restart();
    while (count < target) { st = gen.next().value; count++; }
    $('cv-back').disabled = !count;
    render();
  }

  function advance() {
    if (!running) return;
    if ($('cv-guess').checked && !guessing && st) {
      guessing = true;
      $('cv-caption').innerHTML = '<b>Tebak dulu:</b> baris mana yang jalan berikutnya, dan apa yang berubah di memory atau layar? Klik lagi untuk melihat.';
      return;
    }
    guessing = false;
    const r = gen.next();
    if (r.done) return finish();
    st = r.value; count++;
    $('cv-back').disabled = false;
    render();
    if (st.final) finish();
  }
  function finish() {
    running = false;
    stop();
    $('cv-next').disabled = $('cv-play').disabled = true;
  }
  function stop() { clearInterval(timer); timer = null; $('cv-play').textContent = 'Putar otomatis'; }

  document.querySelectorAll('[data-prog]').forEach((b) => (b.onclick = () => load(b.dataset.prog)));
  $('cv-next').onclick = advance;
  $('cv-back').onclick = back;
  $('cv-reset').onclick = () => load(keys.find((k) => programs[k] === prog));
  $('cv-play').onclick = () => {
    if (timer) return stop();
    $('cv-play').textContent = 'Jeda';
    timer = setInterval(advance, 1100);
    advance();
  };
  addEventListener('resize', () => requestAnimationFrame(drawArrows));
  window.cvizRun = (key) => { load(key); let n = 0; while (running && n++ < 2000) advance(); return m; }; // untuk tes
  load(keys[0]);
}

/* ---------- Flowchart sederhana: dipakai halaman yang punya panel Flowchart ---------- */
// node(id, jenis, x, y, w, h, teks): jenis = 'term' | 'io' | 'proc' | 'dec'. Koordinat = titik tengah.
function cvNode(id, kind, x, y, w, h, text) {
  const l = x - w / 2, t = y - h / 2;
  const shape = kind === 'term' ? `<rect x="${l}" y="${t}" width="${w}" height="${h}" rx="${h / 2}"/>`
    : kind === 'io' ? `<polygon points="${l + 12},${t} ${l + w},${t} ${l + w - 12},${t + h} ${l},${t + h}"/>`
    : kind === 'dec' ? `<polygon points="${x},${t} ${l + w},${y} ${x},${t + h} ${l},${y}"/>`
    : `<rect x="${l}" y="${t}" width="${w}" height="${h}" rx="6"/>`;
  return `<g class="cv-fn" data-id="${id}">${shape}<text x="${x}" y="${y}">${text}</text></g>`;
}
function cvFlow(width, height, parts) {
  return `<svg class="cv-flowsvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Flowchart">
    <defs><marker id="cv-ftip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="cv-ftip"/></marker></defs>
    ${parts.join('')}</svg>`;
}
const cvLine = (d, label, lx, ly) => `<path class="cv-fl" d="${d}" marker-end="url(#cv-ftip)"/>${label ? `<text class="cv-flbl" x="${lx}" y="${ly}">${label}</text>` : ''}`;
