// Mesin visualisasi linked list (single dan double), dipakai bersama oleh halaman viz.
// Halaman menyediakan:
//   CODE  : { namaOperasi: `kode C` }  (plus CODE.struct untuk tampilan awal)
//   OPS   : { namaOperasi: (x, pos) => generator }  setiap `yield` = satu langkah
//   check : (op, x, pos, n) => pesan error atau ''
// lalu memanggil listViz({ doubly, values, head, tail, pos, valueLabel, tag, noun }).
//   head       : nama pointer pertama di gambar ('top' untuk stack)
//   tail       : tampilkan pointer tail (default: hanya double linked list)
//   pos        : false = sembunyikan input posisi (stack, queue)
//   tag(id)    : teks di bawah node pengganti index, misalnya nama pasien
//   noun       : kata untuk list kosong ('Stack', 'Queue', ...)
// Generator memakai state global di bawah (nodes, head, tail, vars, ...) dan helper step/done/make.

const $ = (id) => document.getElementById(id);
const MAX = 7, VBW = 1270, TOP = 90, LIFT = 140, H = 50, STRIDE = 170;
let W = 120, DOUBLY = true, HEAD = 'head', TAIL = true, TAG = null, NOUN = 'List';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pointer = id node (angka) atau null.
let nodes, order, head, tail, vars, found, output, nextId, hl = new Set();
let running = null, playTimer = null, shown = {}, anim = 0, guessing = false;
let before, makeOp, count = 0; // keadaan sebelum operasi + pembuat generator, untuk tombol Kembali

const val = (id) => (id === null || id === undefined ? 'NULL' : TAG ? `${TAG(id)} (${nodes[id].val})` : nodes[id].val);
const step = (code, find, text, hot = []) => ({ code, line: CODE[code].findIndex((l) => l.includes(find)), text, hl: hot });
const done = (code, find, text) => ({ ...step(code, find, text), final: true });
const size = () => order.length;

// Node baru digambar turun di bawah list sampai semua pointernya tersambung.
function make(x, index) {
  const id = nextId++;
  nodes[id] = { id, val: x, prev: null, next: null, lifted: true };
  order.splice(index, 0, id);
  vars.newNode = id;
  return nodes[id];
}

// Node yang sudah terlepas (dan sudah di-free) dihapus dari gambar.
function remove(id) {
  order.splice(order.indexOf(id), 1);
  delete nodes[id];
}

function* finishInsert(c, n) {
  n.lifted = false;
  delete vars.newNode;
  yield done(c, 'size++', `Selesai. Node ${n.val} sudah masuk. List sekarang berisi ${order.length} node.`);
}

/* ---------- Menjalankan langkah ---------- */
function start(factory) {
  before = structuredClone({ nodes, order, head, tail, vars, nextId });
  makeOp = factory;
  restart();
  setBusy(true);
  advance();
}

function restart() {
  ({ nodes, order, head, tail, vars, nextId } = structuredClone(before));
  found = output = null;
  running = makeOp();
  guessing = false;
  count = 0;
}

// Generator tidak bisa mundur, jadi Kembali = ulang operasi dari awal sampai satu langkah sebelumnya.
function back() {
  if (count < 2) return;
  stopPlay();
  const target = count - 1;
  let st;
  restart();
  while (count < target) { st = running.next().value; count++; }
  setBusy(true);
  showStep(st);
}

// Mode tebak: sebelum langkah berikutnya tampil, pembaca diminta menebak dulu.
function advance() {
  if (!running) return;
  if ($('guess').checked && !guessing) {
    guessing = true;
    $('caption').innerHTML = '<b>Tebak dulu:</b> baris kode mana yang jalan berikutnya, dan pointer apa yang berubah? Klik lagi untuk melihat jawabannya.';
    $('code').querySelectorAll('.ln.on').forEach((l) => l.classList.replace('on', 'was'));
    return;
  }
  guessing = false;
  const r = running.next();
  if (r.done) return end();
  $('back').disabled = ++count < 2;
  showStep(r.value);
  if (r.value.final) end();
}

function end() {
  running = null;
  guessing = false;
  stopPlay();
  setBusy(false);
  checkList();
}

function setBusy(busy) {
  document.querySelectorAll('[data-op]').forEach((b) => (b.disabled = busy));
  $('next').disabled = $('play').disabled = !busy;
  $('back').disabled = count < 2;
}

function stopPlay() {
  clearInterval(playTimer);
  playTimer = null;
  $('play').textContent = 'Putar otomatis';
}

// Pemeriksaan sendiri setelah setiap operasi: urutan gambar = urutan list,
// dan (untuk double) setiap prev cocok dengan next pasangannya.
function checkList() {
  const ids = [];
  let prev = null;
  for (let id = head; id !== null; id = nodes[id].next) {
    if (DOUBLY) console.assert(nodes[id].prev === prev, 'prev tidak cocok di node', nodes[id].val);
    ids.push(id);
    prev = id;
  }
  if (TAIL) console.assert(tail === prev, 'tail tidak menunjuk node terakhir');
  console.assert(ids.join() === order.join(), 'urutan gambar berbeda dengan urutan list');
}

/* ---------- Gambar ---------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ptrNames = () => [HEAD, ...(TAIL ? ['tail'] : []), ...Object.keys(vars)];
const ptrValue = (name) => (name === HEAD ? head : TAIL && name === 'tail' ? tail : vars[name]);

function showStep(st) {
  hl = new Set(st.hl || []);
  $('code').innerHTML = CODE[st.code].map((l, i) => `<span class="ln${i === st.line ? ' on' : ''}">${esc(l) || ' '}</span>`).join('');
  $('caption').textContent = st.text;
  $('vars').textContent = ptrNames().map((k) => `${k} → ${val(ptrValue(k))}`).join('   ·   ');
  $('output').textContent = output ? `Output: ${output.join(' ')}` : '';
  draw();
}

function layout() {
  const x0 = (VBW - (order.length * STRIDE - (STRIDE - W))) / 2;
  const pos = {};
  order.forEach((id, i) => (pos[id] = { x: x0 + i * STRIDE, y: TOP + (nodes[id].lifted ? LIFT : 0) }));
  return pos;
}

// Node bergeser halus ke posisi baru (350 ms), kecuali pengguna memilih gerak dikurangi.
function draw() {
  const target = layout();
  const from = {};
  for (const id in target) from[id] = shown[id] || target[id];
  cancelAnimationFrame(anim);
  if (reduceMotion) return render((shown = target));
  const t0 = performance.now();
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / 350), e = 1 - (1 - k) ** 3;
    shown = {};
    for (const id in target) shown[id] = { x: from[id].x + (target[id].x - from[id].x) * e, y: from[id].y + (target[id].y - from[id].y) * e };
    render(shown);
    if (k < 1) anim = requestAnimationFrame(tick);
  };
  anim = requestAnimationFrame(tick);
}

function arrow(sx, sy, ex, ey, dir, kind, hot) {
  const c = hot ? 'hot' : kind;
  // Panah yang melompati node di baris yang sama melengkung: next ke atas, prev ke bawah.
  const skip = Math.abs(ex - sx) > STRIDE && Math.abs(ey - sy) < H;
  const dx = Math.max(40, Math.abs(ex - sx) * 0.45) * dir, dy = kind === 'next' ? -80 : 80;
  const d = skip ? `M${sx} ${sy} C${sx} ${sy + dy} ${ex} ${ey + dy} ${ex} ${ey}` : `M${sx} ${sy} C${sx + dx} ${sy} ${ex - dx} ${ey} ${ex} ${ey}`;
  return `<path class="arrow ${kind}${hot ? ' hot' : ''}" d="${d}" marker-end="url(#tip-${c})"/>` +
    `<circle class="dot ${c}" cx="${sx}" cy="${sy}" r="4"/>`;
}

function nodeSvg(n, p, st) {
  const nullLine = (x) => `<line class="null" x1="${x + 8}" y1="${H - 10}" x2="${x + 22}" y2="10"/>`;
  const dataX = DOUBLY ? 30 : 0, dataW = DOUBLY ? 60 : 70; // double: [prev|data|next], single: [data|next]
  return `<g class="node ${st}" transform="translate(${p.x} ${p.y})">
    <rect class="body" width="${W}" height="${H}" rx="10"/>
    ${DOUBLY ? `<line class="div" x1="30" y1="0" x2="30" y2="${H}"/>` : ''}
    <line class="div" x1="${W - 30}" y1="0" x2="${W - 30}" y2="${H}"/>
    ${DOUBLY && n.prev === null ? nullLine(0) : ''}
    ${n.next === null ? nullLine(W - 30) : ''}
    <text class="val" x="${dataX + dataW / 2}" y="${H / 2}">${n.val}</text>
  </g>`;
}

function render(pos) {
  const s = ['<defs>' + ['next', 'prev', 'hot'].map((k) =>
    `<marker id="tip-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path class="tip ${k}" d="M0 0L10 5L0 10z"/></marker>`).join('') + '</defs>'];

  if (!order.length) s.push(`<text class="empty" x="${VBW / 2}" y="${TOP + H / 2}">${NOUN} kosong: ${HEAD} = NULL${TAIL ? ', tail = NULL' : ''}</text>`);

  let idx = 0;
  for (const id of order) {
    const n = nodes[id], p = pos[id];
    const st = vars.del === id ? 'del' : vars.newNode === id ? 'new' : found === id ? 'found' : Object.values(vars).includes(id) ? 'cur' : '';
    s.push(nodeSvg(n, p, st));
    if (!n.lifted) s.push(`<text class="idx" x="${p.x + W / 2}" y="${p.y + H + 24}">${TAG ? TAG(id) : `[${idx++}]`}</text>`);

    // Label pointer (head, tail, cur, ...) di atas node, atau di bawah node yang sedang turun.
    const names = ptrNames().filter((k) => ptrValue(k) === id);
    if (names.length) {
      const hot = names.some((k) => hl.has(k)) ? ' hot' : '';
      const cx = p.x + W / 2;
      s.push(n.lifted
        ? `<line class="ptr-line${hot}" x1="${cx}" y1="${p.y + H + 4}" x2="${cx}" y2="${p.y + H + 18}"/><text class="ptr${hot}" x="${cx}" y="${p.y + H + 36}">${names.join(', ')}</text>`
        : `<text class="ptr${hot}" x="${cx}" y="${p.y - 30}">${names.join(', ')}</text><line class="ptr-line${hot}" x1="${cx}" y1="${p.y - 22}" x2="${cx}" y2="${p.y - 4}"/>`);
    }
  }

  for (const id of order) {
    const n = nodes[id], p = pos[id];
    if (n.next !== null && pos[n.next]) {
      const q = pos[n.next];
      s.push(arrow(p.x + W - 15, p.y + H / 2, q.x - 3, q.y + H * (DOUBLY ? 0.3 : 0.5), 1, 'next', hl.has(id + '.next')));
    }
    if (DOUBLY && n.prev !== null && pos[n.prev]) {
      const q = pos[n.prev];
      s.push(arrow(p.x + 15, p.y + H / 2, q.x + W + 3, q.y + H * 0.7, -1, 'prev', hl.has(id + '.prev')));
    }
  }
  $('stage').innerHTML = s.join('');
}

/* ---------- Kontrol ---------- */
function reset(values) {
  stopPlay();
  running = null;
  guessing = false;
  count = 0;
  nodes = {}; order = []; vars = {}; head = tail = found = output = null; nextId = 0;
  let prev = null;
  for (const v of values) {
    const id = nextId++;
    nodes[id] = { id, val: v, prev: DOUBLY ? prev : null, next: null, lifted: false };
    if (prev === null) head = id; else nodes[prev].next = id;
    order.push(id);
    prev = id;
  }
  tail = prev;
  shown = {};
  showStep({ code: 'struct', line: -1, text: 'Pilih operasi di atas. Setiap operasi berjalan step by step.' });
  setBusy(false);
}

function listViz({ doubly, values = [10, 20, 30, 40], head = 'head', tail = doubly, pos = true, valueLabel = 'Nilai', tag = null, noun = 'List' }) {
  DOUBLY = doubly;
  HEAD = head; TAIL = tail; TAG = tag; NOUN = noun;
  W = doubly ? 120 : 100;
  const ops = Object.keys(OPS);
  document.querySelector('.viz').insertAdjacentHTML('beforeend', `
<div class="controls">
  <label>${valueLabel} <input class="field" id="val" type="number" value="25"></label>
  <label${pos ? '' : ' style="display: none"'}>Posisi <input class="field" id="pos" type="number" value="2" min="0"></label>
  <label class="check push" title="Sebelum langkah berikutnya tampil, tebak dulu baris kode dan pointer yang berubah"><input type="checkbox" id="guess"> Mode tebak</label>
  <button class="btn btn-sm" id="reset">Reset list</button>
</div>
<div class="controls ops">${ops.map((op) => `<button class="btn btn-sm" data-op="${op}">${op}</button>`).join('')}</div>
<div class="stage-wrap">
  <svg id="stage" viewBox="0 0 ${VBW} 330" role="img" aria-label="Gambar ${doubly ? 'double' : 'single'} linked list"></svg>
  <p class="label legend">
    <span style="--c: var(--go-ink)">next</span>
    ${doubly ? '<span style="--c: var(--focus)">prev</span>' : ''}
    <span style="--c: var(--hot)">baru berubah</span>
  </p>
</div>
<div class="bottom">
  <pre class="code" id="code"></pre>
  <div class="card side">
    <p id="caption" aria-live="polite"></p>
    <p id="vars"></p>
    <p id="output"></p>
    <div class="ops">
      <button class="btn btn-sm" id="back">Kembali</button>
      <button class="btn btn-go btn-sm" id="next">Langkah berikutnya</button>
      <button class="btn btn-sm" id="play">Putar otomatis</button>
    </div>
  </div>
</div>`);

  document.querySelectorAll('[data-op]').forEach((b) => (b.onclick = () => {
    const x = Number($('val').value), p = Number($('pos').value), op = b.dataset.op;
    const err = check(op, x, p, order.length);
    if (err) return ($('caption').textContent = err);
    start(() => OPS[op](x, p));
  }));
  $('next').onclick = advance;
  $('back').onclick = back;
  $('play').onclick = () => {
    if (playTimer) return stopPlay();
    $('play').textContent = 'Jeda';
    playTimer = setInterval(advance, 1100);
    advance();
  };
  $('reset').onclick = () => reset(values);
  reset(values);
}

// Pesan error yang sama untuk kedua jenis list.
function checkCommon(op, x, p, n) {
  const ins = /insert|push|enqueue/i.test(op), del = /delete|pop|dequeue|cancel/i.test(op);
  if ((ins || /search|cancel/.test(op)) && !(Number.isInteger(x) && Math.abs(x) <= 999)) return 'Isi nilai dengan bilangan bulat dari -999 sampai 999.';
  if (ins && n >= MAX) return `${NOUN} sudah berisi ${MAX} node, batas gambar ini. Keluarkan satu node dulu.`;
  if (op === 'insertAt' && !(Number.isInteger(p) && p >= 0 && p <= n)) return `Posisi insertAt harus 0 sampai ${n}.`;
  if (del && n === 0) return `${NOUN} kosong, tidak ada node yang bisa dikeluarkan.`;
  if (op === 'deleteAt' && !(Number.isInteger(p) && p >= 0 && p < n)) return `Posisi deleteAt harus 0 sampai ${n - 1}.`;
  return '';
}
