// Mesin automata untuk visualisasi Compilation technique.
// Penulisan RE: union | atau +, star *, ε, kurung. Concatenation = ditulis berdampingan: (a|b)*abb.
// Isi file:
//   parseRE, showRE                  RE → pohon, pohon → teks
//   thompson                         RE → ε-NFA (gaya Hopcroft, seperti slide dosen), langkah, dan posisi state
//   parseTable, eclose, move         NFA/DFA dari tabel transisi
//   subsetSteps, traceSteps          NFA → DFA (subset construction), dan menjalankan string
//   followposSteps                   RE → DFA langsung (nullable, firstpos, lastpos, followpos)
//   minimizeSteps                    minimisasi DFA (table-filling atau partition)
//   layoutAuto, drawAuto, drawTree   gambar SVG (warna ikut tema lewat automata.css)
//   stepper                          kartu langkah: Kembali / Langkah berikutnya / mode tebak

const escHTML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const EPS = 'ε';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* ---------- RE ---------- */
function reTokens(src) {
  const out = [];
  for (const c of src.replace(/\s+/g, '')) {
    if (c === '|' || c === '+' || c === '∪') out.push({ t: '|' });
    else if (c === '*' || c === '(' || c === ')') out.push({ t: c });
    else if (c === 'ε' || c === 'λ') out.push({ t: 'eps' });
    else out.push({ t: 'sym', c });
  }
  return out;
}

function parseRE(src) {
  const toks = reTokens(src);
  let k = 0;
  const peek = () => toks[k] && toks[k].t;
  if (!toks.length) throw new Error('RE masih kosong.');
  function alt() {
    let n = cat();
    while (peek() === '|') { k++; n = { t: 'alt', a: n, b: cat() }; }
    return n;
  }
  function cat() {
    let n = star();
    while (['sym', 'eps', '('].includes(peek())) n = { t: 'cat', a: n, b: star() };
    return n;
  }
  function star() {
    let n = atom();
    while (peek() === '*') { k++; if (n.t !== 'star') n = { t: 'star', a: n }; }
    return n;
  }
  function atom() {
    const tok = toks[k];
    if (!tok) {
      if (toks[k - 1] && toks[k - 1].t === '|') throw new Error('Setelah | atau + harus ada RE. Di sini + berarti union. Untuk "satu kali atau lebih", tulis rr*.');
      throw new Error('RE berakhir terlalu cepat.');
    }
    k++;
    if (tok.t === 'sym') return { t: 'sym', c: tok.c };
    if (tok.t === 'eps') return { t: 'eps' };
    if (tok.t === '(') {
      const n = alt();
      if (peek() !== ')') throw new Error('Kurung tutup ) kurang.');
      k++;
      return n;
    }
    if (tok.t === ')') throw new Error('Ada ) tanpa pasangan, atau kurung kosong ().');
    if (tok.t === '|') throw new Error('Union (| atau +) butuh RE di kiri dan kanannya. Di sini + berarti union. Untuk "satu kali atau lebih", tulis rr*.');
    throw new Error('* harus ditulis setelah simbol atau kurung.');
  }
  const n = alt();
  if (k < toks.length) throw new Error('Ada ) tanpa pasangan.');
  return n;
}

// u = simbol union yang dipakai saat menulis ulang (ikut gaya penulis: | atau +).
function showRE(n, u = '|') {
  const prec = { alt: 0, cat: 1, star: 2, sym: 3, eps: 3 };
  const w = (c, p) => (prec[c.t] < p ? `(${showRE(c, u)})` : showRE(c, u));
  if (n.t === 'sym') return n.c;
  if (n.t === 'eps') return EPS;
  if (n.t === 'alt') return `${w(n.a, 0)}${u}${w(n.b, 1)}`;
  if (n.t === 'cat') return `${w(n.a, 1)}${w(n.b, 2)}`;
  return `${w(n.a, 3)}*`;
}
const reSymbols = (n) => (n.t === 'sym' ? [n.c] : n.t === 'eps' ? [] : [...new Set([...reSymbols(n.a), ...(n.b ? reSymbols(n.b) : [])])]);

/* ---------- Automaton dasar ---------- */
// A = { states: [nama], start, finals: Set, symbols: [simbol, mungkin termasuk ε], delta: { state: { simbol: [state] } } }
const targets = (A, q, a) => (A.delta[q] && A.delta[q][a]) || [];
function sortStates(A, set) { const idx = new Map(A.states.map((s, i) => [s, i])); return [...set].sort((x, y) => idx.get(x) - idx.get(y)); }
function eclose(A, set) {
  const out = new Set(set), stack = [...set];
  while (stack.length) for (const r of targets(A, stack.pop(), EPS)) if (!out.has(r)) { out.add(r); stack.push(r); }
  return sortStates(A, out);
}
function move(A, set, a) { const out = new Set(); for (const q of set) targets(A, q, a).forEach((r) => out.add(r)); return sortStates(A, out); }
const showSet = (s) => (s.length ? `{${s.join(',')}}` : '∅');
const inputSymbols = (A) => A.symbols.filter((s) => s !== EPS);

// Tabel transisi seperti di slide. Baris pertama = simbol input (boleh diawali kata seperti "state").
// Setiap baris: nama state (→ atau > = start, * = final), lalu satu sel per simbol.
// Sel: {p,q} atau p,q, dan - atau ∅ kalau kosong. Contoh:
//        0      1
//   →p   {p,q}  {p}
//   *s   {s}    {s}
function parseTable(text) {
  const lines = text.split('\n').map((l) => l.replace(/\{[^}]*\}/g, (m) => m.replace(/\s+/g, '')).trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('Tabel butuh baris simbol dan minimal satu baris state.');
  const split = (l) => l.split(/\s+|\t/).filter(Boolean);
  const rows = lines.slice(1).map(split);
  let symbols = split(lines[0]).map((s) => (s === 'eps' || s === 'e' ? EPS : s));
  if (symbols.length === rows[0].length) symbols = symbols.slice(1);
  if (new Set(symbols).size !== symbols.length) throw new Error('Ada simbol yang ditulis dua kali di baris pertama.');
  const A = { states: [], start: null, finals: new Set(), symbols, delta: {} };
  const cells = [];
  rows.forEach((r, i) => {
    const m = r[0].match(/^([→>*]*)(.+?)([*]*)$/);
    const name = m[2], marks = m[1] + m[3];
    if (A.states.includes(name)) throw new Error(`State ${name} ditulis dua kali.`);
    if (r.length - 1 !== symbols.length) throw new Error(`Baris ${name}: ada ${r.length - 1} sel, padahal ada ${symbols.length} simbol. Tulis - untuk sel kosong.`);
    A.states.push(name);
    if (/[→>]/.test(marks) && !A.start) A.start = name;
    if (marks.includes('*')) A.finals.add(name);
    cells.push(r.slice(1));
  });
  A.start ||= A.states[0];
  A.states.forEach((q, i) => {
    A.delta[q] = {};
    symbols.forEach((a, j) => {
      const c = cells[i][j].replace(/[{}]/g, '');
      const set = c === '-' || c === '∅' || c === '' ? [] : c.split(',').filter(Boolean);
      set.forEach((r) => { if (!A.states.includes(r)) throw new Error(`State ${r} (di baris ${q}) tidak ada di tabel.`); });
      if (set.length) A.delta[q][a] = set;
    });
  });
  if (!A.finals.size) throw new Error('Belum ada final state. Tandai dengan * di depan nama state, misalnya *q2.');
  return A;
}
const isDFA = (A) => !A.symbols.includes(EPS) && A.states.every((q) => A.symbols.every((a) => targets(A, q, a).length <= 1));
function accepts(A, str) {
  let cur = eclose(A, [A.start]);
  for (const c of str) cur = eclose(A, move(A, cur, c));
  return cur.some((q) => A.finals.has(q));
}

/* ---------- Thompson's construction (gaya Hopcroft: concatenation disambung dengan ε) ---------- */
// Setiap fragment punya satu start dan satu final di garis tengahnya. Satuan posisi: 1 = jarak antar-state.
function thompson(ast, u = '|') {
  const P = [], E = [], steps = [];
  const node = (x, y) => (P.push([x, y]), P.length - 1);
  const edge = (from, to, label, curve) => (E.push({ from, to, label, curve }), E.length - 1);
  function shift(fr, dx, dy) {
    fr.states.forEach((s) => { P[s][0] += dx; P[s][1] += dy; });
    fr.edges.forEach((e) => { if (E[e].curve) E[e].curve.forEach((c) => { c[0] += dx; c[1] += dy; }); });
  }
  function build(n) {
    let fr;
    if (n.t === 'sym' || n.t === 'eps') {
      const s = node(0, 0), f = node(1, 0);
      fr = { s, f, w: 1, up: 0.5, down: 0.5, states: [s, f], edges: [edge(s, f, n.t === 'sym' ? n.c : EPS)], fresh: [s, f] };
      fr.freshEdges = fr.edges.slice();
    } else if (n.t === 'cat') {
      const A = build(n.a), B = build(n.b);
      shift(B, A.w + 1, 0);
      const e = edge(A.f, B.s, EPS);
      fr = { s: A.s, f: B.f, w: A.w + 1 + B.w, up: Math.max(A.up, B.up), down: Math.max(A.down, B.down), states: [...A.states, ...B.states], edges: [...A.edges, e, ...B.edges], fresh: [], freshEdges: [e] };
    } else if (n.t === 'alt') {
      const A = build(n.a), B = build(n.b), g = 0.12, W = Math.max(A.w, B.w);
      shift(A, 1 + (W - A.w) / 2, -(A.down + g));
      shift(B, 1 + (W - B.w) / 2, B.up + g);
      const s = node(0, 0), f = node(W + 2, 0);
      const es = [edge(s, A.s, EPS), edge(s, B.s, EPS), edge(A.f, f, EPS), edge(B.f, f, EPS)];
      fr = { s, f, w: W + 2, up: A.up + A.down + g, down: B.up + B.down + g, states: [s, ...A.states, ...B.states, f], edges: [...es, ...A.edges, ...B.edges], fresh: [s, f], freshEdges: es };
    } else {
      const A = build(n.a);
      shift(A, 1, 0);
      const s = node(0, 0), f = node(A.w + 2, 0);
      const top = -(A.up + 0.32) / 0.75, bot = (A.down + 0.32) / 0.75; // titik kontrol: puncak lengkung = 0.75 × kontrol
      const es = [
        edge(s, A.s, EPS),
        edge(A.f, A.s, EPS, [[P[A.f][0], top], [P[A.s][0], top]]), // ulangi
        edge(s, f, EPS, [[P[s][0] + 0.3, bot], [P[f][0] - 0.3, bot]]), // nol kali
        edge(A.f, f, EPS),
      ];
      fr = { s, f, w: A.w + 2, up: A.up + 0.42, down: A.down + 0.42, states: [s, ...A.states, f], edges: [...es, ...A.edges], fresh: [s, f], freshEdges: es };
    }
    fr.node = n;
    steps.push(fr);
    return fr;
  }
  const root = build(ast);
  // Nomor state seperti buku Aho: start fragment, isi cabang atas, isi cabang bawah, lalu final fragment.
  const order = root.states;
  const name = new Array(P.length);
  order.forEach((id, k) => (name[id] = String(k)));
  const A = { states: order.map((id) => name[id]), start: name[root.s], finals: new Set([name[root.f]]), symbols: [], delta: {} };
  A.states.forEach((q) => (A.delta[q] = {}));
  E.forEach((e) => { const q = name[e.from]; (A.delta[q][e.label] ||= []).push(name[e.to]); });
  const syms = new Set(E.map((e) => e.label));
  A.symbols = [...reSymbols(ast), EPS].filter((s) => syms.has(s));
  Object.values(A.delta).forEach((row) => Object.keys(row).forEach((a) => (row[a] = sortStates(A, row[a]))));

  const SX = 74, SY = 74;
  const px = (p) => [p[0] * SX, p[1] * SY];
  const geo = {
    nodes: P.map((p, id) => ({ id: name[id], label: name[id], x: px(p)[0], y: px(p)[1], start: id === root.s, final: id === root.f })),
    edges: E.map((e) => ({ from: name[e.from], to: name[e.to], label: e.label, curve: e.curve && e.curve.map(px) })),
  };
  const opText = {
    sym: (n) => `Simbol <code>${escHTML(n.c)}</code>: dua state baru dan satu transisi <code>${escHTML(n.c)}</code>.`,
    eps: () => 'ε: dua state baru dan satu transisi ε.',
    cat: (n) => `<b>Concatenation</b> <code>${escHTML(showRE(n, u))}</code>: final state bagian kiri disambung ke start state bagian kanan dengan ε. Final kiri tidak lagi final.`,
    alt: (n) => `<b>Union</b> <code>${escHTML(showRE(n, u))}</code>: start baru bercabang ε ke kedua bagian, karena string boleh mengikuti salah satunya. Kedua final menyatu lewat ε ke final baru.`,
    star: (n) => `<b>Star</b> <code>${escHTML(showRE(n, u))}</code>: start dan final baru, lalu 4 transisi ε: masuk, <b>ulangi</b> (final dalam → start dalam), <b>lewati</b> (nol kali), dan keluar.`,
  };
  const out = steps.map((fr, i) => {
    const xs = fr.states.map((s) => P[s][0]), mid = P[fr.s][1];
    return {
      shown: new Set(steps.slice(0, i + 1).flatMap((f) => f.fresh).map((id) => name[id])),
      shownEdges: new Set(steps.slice(0, i + 1).flatMap((f) => f.freshEdges)),
      hot: new Set(fr.fresh.map((id) => name[id])),
      hotEdges: new Set(fr.freshEdges),
      box: { x: Math.min(...xs) * SX - 30, y: (mid - fr.up) * SY - 6, w: (Math.max(...xs) - Math.min(...xs)) * SX + 60, h: (fr.up + fr.down) * SY + 12 },
      start: name[fr.s], final: name[fr.f],
      ask: `Bagian berikutnya: <code>${escHTML(showRE(fr.node, u))}</code>. Fragment seperti apa yang harus dibuat?`,
      text: opText[fr.node.t](fr.node),
    };
  });
  out.push({
    shown: new Set(A.states), shownEdges: new Set(E.map((e, i) => i)), hot: new Set(), hotEdges: new Set(), start: A.start, final: [...A.finals][0], done: true,
    text: `Selesai: ε-NFA untuk <code>${escHTML(showRE(ast, u))}</code> punya <b>${A.states.length} state</b>. Start = ${A.start}, final = ${[...A.finals][0]}. Setiap simbol menyumbang 2 state, dan setiap union atau star menyumbang 2 state lagi.`,
  });
  return { A, geo, steps: out };
}

/* ---------- Subset construction: NFA (atau ε-NFA) → DFA ---------- */
function subsetSteps(N) {
  const syms = inputSymbols(N), hasEps = N.symbols.includes(EPS);
  const D = [], byKey = new Map(), steps = [];
  const key = (s) => s.join(',');
  const finalOf = (s) => s.some((q) => N.finals.has(q));
  const snap = () => D.map((r) => ({ ...r, trans: { ...r.trans } }));
  function add(set) {
    const r = { name: LETTERS[D.length] || `S${D.length}`, set, trans: {}, final: finalOf(set) };
    D.push(r); byKey.set(key(set), r);
    return r;
  }
  const s0 = eclose(N, [N.start]);
  add(s0);
  steps.push({
    rows: snap(), cur: 0, hotNFA: s0,
    text: hasEps
      ? `Start state DFA = ECLOSE(${N.start}) = ${showSet(s0)}: semua state yang bisa dicapai dari ${N.start} <b>tanpa membaca input</b> (lewat ε saja). Beri nama <b>A</b>.`
      : `Start state DFA = {${N.start}}. Beri nama <b>A</b>. Setiap state DFA adalah <b>himpunan</b> state NFA tempat mesin mungkin berada.`,
  });
  for (let i = 0; i < D.length; i++) {
    for (const a of syms) {
      const S = D[i], mv = move(N, S.set, a), T = hasEps ? eclose(N, mv) : mv;
      // Tulis hanya δ yang tidak kosong, supaya kalimatnya tidak penuh ∅.
      const full = S.set.filter((q) => targets(N, q, a).length);
      const parts = (full.map((q) => `δ(${q},${a}) = ${showSet(sortStates(N, targets(N, q, a)))}`).join(', ') || `semua δ(·,${a}) = ∅`) + (full.length && full.length < S.set.length ? `, sisanya ∅` : '');
      let tail, isNew = false;
      if (!T.length) { S.trans[a] = '∅'; tail = 'Hasilnya ∅: tidak ada state yang bisa dicapai (<b>dead state</b>). Biasanya tidak digambar.'; }
      else if (byKey.has(key(T))) { S.trans[a] = byKey.get(key(T)).name; tail = `Set ini sudah ada, yaitu <b>${S.trans[a]}</b>.`; }
      else { const r = add(T); S.trans[a] = r.name; isNew = true; tail = `Set ini <b>belum ada</b> → state baru <b>${r.name}</b>, yang nanti juga harus diproses.`; }
      steps.push({
        rows: snap(), cur: i, sym: a, hotNFA: T, isNew,
        ask: `Dari <b>${S.name}</b> = ${showSet(S.set)} dengan input <code>${escHTML(a)}</code>, ke set mana?`,
        text: `Dari <b>${S.name}</b> = ${showSet(S.set)} dengan input <code>${escHTML(a)}</code>: ${parts}. Gabungannya ${showSet(mv)}${hasEps ? `, lalu ECLOSE = ${showSet(T)}` : ''}. ${tail}`,
      });
    }
  }
  const dfa = { states: D.map((r) => r.name), start: 'A', finals: new Set(D.filter((r) => r.final).map((r) => r.name)), symbols: syms, delta: {} };
  D.forEach((r) => { dfa.delta[r.name] = {}; syms.forEach((a) => { if (r.trans[a] !== '∅') dfa.delta[r.name][a] = [r.trans[a]]; }); });
  steps.push({
    rows: snap(), done: true, hotNFA: [],
    text: `Selesai: tidak ada state yang belum diproses. DFA punya <b>${D.length} state</b>. Final state DFA = set yang memuat final state NFA (${[...N.finals].join(', ')}): <b>${[...dfa.finals].join(', ')}</b>.`,
  });
  return { steps, dfa, rows: D };
}

// Jalankan string pada NFA: set state aktif setelah setiap simbol.
function traceSteps(N, str) {
  const hasEps = N.symbols.includes(EPS), steps = [];
  let cur = eclose(N, [N.start]);
  steps.push({ cur, read: 0, text: hasEps ? `Mulai di ECLOSE(${N.start}) = ${showSet(cur)}. Mesin bisa berada di semua state ini sekaligus, karena ε tidak membaca input.` : `Mulai di {${N.start}}.` });
  for (let i = 0; i < str.length; i++) {
    const a = str[i], mv = move(N, cur, a), next = hasEps ? eclose(N, mv) : mv;
    steps.push({
      cur: next, read: i + 1, prev: cur,
      ask: `Aktif: ${showSet(cur)}. Setelah membaca <code>${escHTML(a)}</code>, state mana yang aktif?`,
      text: `Baca <code>${escHTML(a)}</code>: dari ${showSet(cur)} ke ${showSet(mv)}${hasEps ? `, lalu ECLOSE = ${showSet(next)}` : ''}.${next.length ? '' : ' Set kosong: semua jalur mati, string pasti ditolak.'}`,
    });
    cur = next;
    if (!cur.length) break;
  }
  const ok = cur.length > 0 && steps.length === str.length + 1 && cur.some((q) => N.finals.has(q));
  steps[steps.length - 1].verdict = ok;
  steps[steps.length - 1].text += ok
    ? ` Input habis dan set aktif memuat final state (${cur.filter((q) => N.finals.has(q)).join(', ')}) → <b>accepted</b>.`
    : ` → <b>rejected</b>${cur.length && steps.length === str.length + 1 ? ': input habis, tapi tidak ada final state di set aktif' : ''}.`;
  return steps;
}

/* ---------- RE → DFA langsung (followpos) ---------- */
function followposSteps(ast, u = '|') {
  const root = { t: 'cat', a: ast, b: { t: 'sym', c: '#' } };
  const leaves = [], post = [];
  (function walk(n, depth) {
    n.depth = depth;
    if (n.a) walk(n.a, depth + 1);
    if (n.b) walk(n.b, depth + 1);
    if (n.t === 'sym') { leaves.push(n); n.pos = leaves.length; }
    post.push(n);
  })(root, 0);
  const steps = [], follow = leaves.map(() => new Set());
  const S = (set) => `{${[...set].sort((a, b) => a - b).join(',')}}`;
  const shownFollow = () => follow.map((f) => [...f].sort((a, b) => a - b));
  const base = { root, leaves };
  steps.push({ ...base, phase: 'tree', k: 0, fol: shownFollow(), text: `Tambahkan <code>#</code> di akhir: <code>(${escHTML(showRE(ast, u))})#</code>. Posisi <code>#</code> menandai "string selesai". Lalu beri nomor posisi pada setiap leaf simbol (ε tidak diberi nomor).` });
  const rule = {
    sym: (n) => `Leaf posisi ${n.pos} (<code>${escHTML(n.c)}</code>): nullable = F, firstpos = lastpos = {${n.pos}}.`,
    eps: () => 'Leaf ε: nullable = T, firstpos = lastpos = ∅.',
    alt: (n) => `Node <b>|</b>: nullable = ${n.a.nullable ? 'T' : 'F'} OR ${n.b.nullable ? 'T' : 'F'}. firstpos dan lastpos = gabungan milik kedua anak, karena string bisa berasal dari anak mana saja.`,
    cat: (n) => `Node <b>·</b>: nullable = ${n.a.nullable ? 'T' : 'F'} AND ${n.b.nullable ? 'T' : 'F'}. firstpos: ${n.a.nullable ? 'anak kiri nullable, jadi gabungkan firstpos kiri dan kanan' : 'anak kiri tidak nullable, jadi ambil firstpos kiri saja'}. lastpos: ${n.b.nullable ? 'anak kanan nullable, jadi gabungkan lastpos kiri dan kanan' : 'anak kanan tidak nullable, jadi ambil lastpos kanan saja'}.`,
    star: () => 'Node <b>*</b>: selalu nullable (boleh nol kali). firstpos dan lastpos sama dengan anaknya.',
  };
  post.forEach((n, i) => {
    if (n.t === 'sym') { n.nullable = false; n.first = new Set([n.pos]); n.last = new Set([n.pos]); }
    else if (n.t === 'eps') { n.nullable = true; n.first = new Set(); n.last = new Set(); }
    else if (n.t === 'alt') { n.nullable = n.a.nullable || n.b.nullable; n.first = new Set([...n.a.first, ...n.b.first]); n.last = new Set([...n.a.last, ...n.b.last]); }
    else if (n.t === 'cat') {
      n.nullable = n.a.nullable && n.b.nullable;
      n.first = n.a.nullable ? new Set([...n.a.first, ...n.b.first]) : new Set(n.a.first);
      n.last = n.b.nullable ? new Set([...n.a.last, ...n.b.last]) : new Set(n.b.last);
    } else { n.nullable = true; n.first = new Set(n.a.first); n.last = new Set(n.a.last); }
    steps.push({ ...base, phase: 'npl', k: i + 1, hotNode: n, fol: shownFollow(), ask: 'Berapa nullable, firstpos, dan lastpos node yang disorot?', text: `${rule[n.t](n)} Hasil: ${n.nullable ? 'T' : 'F'}, ${S(n.first)}, ${S(n.last)}.` });
  });
  post.forEach((n) => {
    if (n.t === 'cat') {
      n.b.first.size && n.a.last.forEach((i) => n.b.first.forEach((j) => follow[i - 1].add(j)));
      steps.push({ ...base, phase: 'follow', k: post.length, hotNode: n, hotPos: [...n.a.last], fol: shownFollow(), ask: 'Node · ini menambah followpos apa?', text: `<b>Aturan ·</b>: setelah posisi terakhir anak kiri (lastpos kiri = ${S(n.a.last)}) bisa langsung datang posisi pertama anak kanan (firstpos kanan = ${S(n.b.first)}). Jadi ${S(n.b.first)} masuk ke followpos dari ${[...n.a.last].join(', ') || '(tidak ada)'}.` });
    } else if (n.t === 'star') {
      n.last.forEach((i) => n.first.forEach((j) => follow[i - 1].add(j)));
      steps.push({ ...base, phase: 'follow', k: post.length, hotNode: n, hotPos: [...n.last], fol: shownFollow(), ask: 'Node * ini menambah followpos apa?', text: `<b>Aturan *</b>: setelah satu putaran selesai (lastpos = ${S(n.last)}), putaran berikutnya bisa dimulai (firstpos = ${S(n.first)}). Jadi ${S(n.first)} masuk ke followpos dari ${[...n.last].join(', ') || '(tidak ada)'}.` });
    }
  });
  // DFA
  const syms = [...new Set(leaves.map((l) => l.c))].filter((c) => c !== '#');
  const hash = leaves.length, D = [], byKey = new Map();
  const key = (s) => s.join(',');
  const snap = () => D.map((r) => ({ ...r, trans: { ...r.trans } }));
  const add = (set) => { const r = { name: LETTERS[D.length] || `S${D.length}`, set, trans: {}, final: set.includes(hash) }; D.push(r); byKey.set(key(set), r); return r; };
  const first = [...root.first].sort((a, b) => a - b);
  add(first);
  const fol = shownFollow();
  steps.push({ ...base, phase: 'dfa', k: post.length, fol, rows: snap(), cur: 0, text: `Start state DFA = firstpos(root) = ${S(first)}. Beri nama <b>A</b>. State DFA = himpunan posisi yang mungkin dibaca berikutnya.` });
  for (let i = 0; i < D.length; i++) for (const a of syms) {
    const St = D[i], ps = St.set.filter((p) => leaves[p - 1].c === a);
    const T = [...new Set(ps.flatMap((p) => fol[p - 1]))].sort((x, y) => x - y);
    let tail;
    if (!ps.length) { St.trans[a] = '∅'; tail = `Tidak ada posisi <code>${escHTML(a)}</code> di ${S(St.set)}, jadi tidak ada transisi (∅).`; }
    else if (byKey.has(key(T))) { St.trans[a] = byKey.get(key(T)).name; tail = `Set ini sudah ada: <b>${St.trans[a]}</b>.`; }
    else { const r = add(T); St.trans[a] = r.name; tail = `Set baru → <b>${r.name}</b>${r.final ? ` (memuat posisi ${hash} = #, jadi final)` : ''}.`; }
    steps.push({
      ...base, phase: 'dfa', k: post.length, fol, rows: snap(), cur: i, sym: a, hotPos: ps,
      ask: `Dari <b>${St.name}</b> = ${S(St.set)} dengan input <code>${escHTML(a)}</code>, ke set mana?`,
      text: ps.length ? `Dari <b>${St.name}</b> = ${S(St.set)}, posisi yang berisi <code>${escHTML(a)}</code>: ${ps.join(', ')}. Gabungkan followpos-nya: ${ps.map((p) => `fp(${p}) = ${S(fol[p - 1])}`).join(' ∪ ')} = ${S(T)}. ${tail}` : tail,
    });
  }
  const dfa = { states: D.map((r) => r.name), start: 'A', finals: new Set(D.filter((r) => r.final).map((r) => r.name)), symbols: syms, delta: {} };
  D.forEach((r) => { dfa.delta[r.name] = {}; syms.forEach((a) => { if (r.trans[a] !== '∅') dfa.delta[r.name][a] = [r.trans[a]]; }); });
  steps.push({ ...base, phase: 'dfa', k: post.length, fol, rows: snap(), done: true, text: `Selesai: DFA punya <b>${D.length} state</b>. Final state = set yang memuat posisi ${hash} (#): <b>${[...dfa.finals].join(', ')}</b>.` });
  return { steps, dfa, leaves, root, follow: fol };
}

/* ---------- Minimisasi DFA ---------- */
// Langkah persiapan yang sama untuk kedua metode: buang state yang tidak tercapai, lengkapi dengan dead state.
function prepareDFA(D) {
  const notes = [];
  const seen = new Set([D.start]), queue = [D.start];
  while (queue.length) { const q = queue.shift(); D.symbols.forEach((a) => targets(D, q, a).forEach((r) => { if (!seen.has(r)) { seen.add(r); queue.push(r); } })); }
  // State yang tidak tercapai tidak dibuang, supaya hasilnya sama dengan slide dosen. Cukup diberi catatan.
  const gone = D.states.filter((q) => !seen.has(q));
  let A = D;
  if (gone.length) notes.push(`Catatan: state <b>${gone.join(', ')}</b> tidak bisa dicapai dari start state ${D.start}. Slide dosen tetap mengikutsertakannya di tabel, jadi di sini juga. Di DFA yang benar-benar minimum, state seperti ini boleh dibuang.`);
  if (A.states.some((q) => A.symbols.some((a) => !targets(A, q, a).length))) {
    const dead = '∅';
    A = { ...A, states: [...A.states, dead], delta: { ...A.delta } };
    A.states.forEach((q) => { A.delta[q] = { ...(A.delta[q] || {}) }; A.symbols.forEach((a) => { if (!targets(A, q, a).length) A.delta[q][a] = [dead]; }); });
    notes.push('Ada transisi yang kosong. Tambahkan <b>dead state ∅</b> (bukan final, semua transisinya ke dirinya sendiri), supaya setiap state punya transisi untuk setiap simbol.');
  }
  return { A, notes };
}
const next1 = (A, q, a) => targets(A, q, a)[0];

function minimizeSteps(D0, method) {
  const { A, notes } = prepareDFA(D0);
  const Q = A.states, syms = A.symbols, steps = [];
  const fin = (q) => A.finals.has(q);
  let groups, lastMarks = null;
  notes.forEach((t) => steps.push({ A, phase: 'prep', text: t }));
  if (method === 'table') {
    const mark = new Map(); // "p|q" → { pass, why }
    const k = (p, q) => (Q.indexOf(p) < Q.indexOf(q) ? `${p}|${q}` : `${q}|${p}`);
    const snap = () => new Map(mark);
    steps.push({ A, phase: 'table', marks: snap(), text: 'Buat tabel segitiga: satu sel untuk setiap <b>pasangan</b> state. Sel diberi X kalau pasangan itu <b>distinguishable</b> (pasti beda).' });
    Q.forEach((p, i) => Q.slice(i + 1).forEach((q) => { if (fin(p) !== fin(q)) mark.set(k(p, q), { pass: 0, why: 'satu final, satu bukan' }); }));
    const basis = [...mark.keys()];
    steps.push({ A, phase: 'table', marks: snap(), hot: basis, text: `<b>Basis</b>: tandai semua pasangan (final, bukan final), karena string kosong sudah membedakan keduanya. ${basis.length} sel ditandai.` });
    for (let pass = 1; ; pass++) {
      let changed = 0;
      Q.forEach((p, i) => Q.slice(i + 1).forEach((q) => {
        if (mark.has(k(p, q))) return;
        for (const a of syms) {
          const r = next1(A, p, a), s = next1(A, q, a);
          if (r !== s && mark.has(k(r, s))) {
            mark.set(k(p, q), { pass, why: `${a}: (${r},${s})` });
            changed++;
            steps.push({ A, phase: 'table', marks: snap(), hot: [k(p, q)], via: k(r, s), ask: `Putaran ${pass}: cek pasangan (${p},${q}) yang belum ditandai. Apakah harus ditandai?`, text: `Putaran ${pass}: pasangan (<b>${p},${q}</b>) dengan input <code>${escHTML(a)}</code> pergi ke (${r},${s}), dan (${r},${s}) <b>sudah ditandai</b>. String pembeda (${r},${s}) diawali ${escHTML(a)} juga membedakan (${p},${q}) → tandai.` });
            return;
          }
        }
      }));
      steps.push({ A, phase: 'table', marks: snap(), text: changed ? `Putaran ${pass} selesai, ${changed} sel baru ditandai. Ulangi sekali lagi, karena tanda baru bisa memicu tanda lain.` : `Putaran ${pass}: <b>tidak ada sel baru</b> yang ditandai, jadi proses selesai. Sel kosong = pasangan <b>ekuivalen</b> (O).` });
      if (!changed) break;
    }
    // Gabungkan pasangan ekuivalen menjadi grup.
    const parent = new Map(Q.map((q) => [q, q]));
    const find = (q) => (parent.get(q) === q ? q : find(parent.get(q)));
    Q.forEach((p, i) => Q.slice(i + 1).forEach((q) => { if (!mark.has(k(p, q))) parent.set(find(q), find(p)); }));
    groups = [];
    Q.forEach((q) => { const r = find(q); let g = groups.find((x) => x[0] === r); if (!g) groups.push((g = [r])); if (q !== r) g.push(q); });
    groups = groups.map((g) => sortStates(A, g));
    lastMarks = snap();
  } else {
    let P = [Q.filter(fin), Q.filter((q) => !fin(q))].filter((g) => g.length);
    const gi = (P2, q) => P2.findIndex((g) => g.includes(q));
    const name = (i) => `G${i + 1}`;
    steps.push({ A, phase: 'part', P: P.map((g) => [...g]), text: `<b>Round 0</b>: pisahkan state final dan bukan final: ${P.map((g, i) => `${name(i)} = {${g.join(',')}}`).join(', ')}. Ini 0-equivalence: kedua grup pasti beda karena string kosong.` });
    for (let round = 1; ; round++) {
      const sig = new Map(Q.map((q) => [q, syms.map((a) => gi(P, next1(A, q, a)))]));
      const next = [];
      P.forEach((g) => {
        const sub = new Map();
        g.forEach((q) => { const s = sig.get(q).join(','); if (!sub.has(s)) sub.set(s, []); sub.get(s).push(q); });
        next.push(...sub.values());
      });
      const split = next.length !== P.length;
      steps.push({
        A, phase: 'part', P: P.map((g) => [...g]), sig, next: next.map((g) => [...g]), round,
        ask: `Round ${round}: untuk setiap state, ke grup mana transisinya? State mana yang harus dipisah?`,
        text: split
          ? `<b>Round ${round}</b>: tulis grup tujuan setiap transisi. State di grup yang sama tetapi barisnya <b>berbeda</b> harus dipisah, karena ada input yang membawa mereka ke grup berbeda. Hasil: ${next.map((g) => `{${g.join(',')}}`).join(' ')}.`
          : `<b>Round ${round}</b>: di setiap grup, semua state punya baris tujuan yang <b>sama</b>. Tidak ada yang dipisah, jadi partisi sudah final: ${next.map((g) => `{${g.join(',')}}`).join(' ')}.`,
      });
      P = next;
      if (!split) break;
    }
    groups = P.map((g) => sortStates(A, g));
  }
  // DFA minimum: satu state per grup. Nama grup = gabungan nama state-nya.
  const gname = (g) => g.join(',');
  const of = (q) => gname(groups.find((g) => g.includes(q)));
  const M = { states: groups.map(gname), start: of(A.start), finals: new Set(groups.filter((g) => fin(g[0])).map(gname)), symbols: syms, delta: {} };
  groups.forEach((g) => { M.delta[gname(g)] = {}; syms.forEach((a) => (M.delta[gname(g)][a] = [of(next1(A, g[0], a))])); });
  const merged = groups.filter((g) => g.length > 1);
  steps.push({
    A, phase: 'done', M, groups, marks: method === 'table' ? lastMarks : null, P: method === 'table' ? null : groups,
    text: `Selesai: ${A.states.length} state menjadi <b>${groups.length} state</b>. ${merged.length ? `Yang digabung: ${merged.map((g) => `{${g.join(',')}}`).join(', ')}.` : 'Tidak ada yang bisa digabung: DFA ini sudah minimum.'} Transisi grup diambil dari salah satu anggotanya, karena semua anggota pergi ke grup yang sama.`,
  });
  return { steps, M, groups, A };
}

/* ---------- Layout dan gambar ---------- */
const AU_R = 18;
function nodeSize(label) {
  const n = [...String(label)].length;
  return n <= 2 ? { w: AU_R * 2, h: AU_R * 2, circle: true } : { w: Math.max(AU_R * 2, n * 9.2 + 20), h: AU_R * 2, circle: false };
}

// Posisi state untuk automaton dari tabel. Panah balik (loop) diabaikan, lalu setiap state ditaruh di kolom
// = jalur terpanjang dari start. Hasilnya mengalir dari kiri ke kanan seperti gambar di buku.
function layoutAuto(A, { dx, dy = 96 } = {}) {
  // Jarak antar-kolom cukup untuk node terlebar ditambah label edge terpanjang.
  const label = (q, r) => A.symbols.filter((a) => targets(A, q, a).includes(r)).join(',');
  const longest = Math.max(1, ...A.states.flatMap((q) => A.states.map((r) => label(q, r).length)));
  dx ||= Math.max(110, Math.max(...A.states.map((q) => nodeSize(q).w)) + 9 * longest + 44);
  const all = (q) => [...new Set(A.symbols.flatMap((a) => targets(A, q, a)))];
  const seen = new Set(), stack = new Set(), back = new Set(), post = [];
  (function dfs(q) {
    seen.add(q); stack.add(q);
    all(q).forEach((r) => { if (stack.has(r)) back.add(`${q}\u0000${r}`); else if (!seen.has(r)) dfs(r); });
    stack.delete(q); post.push(q);
  })(A.start);
  const reach = new Set(seen);
  A.states.forEach((q) => { if (!seen.has(q)) (function dfs(p) { seen.add(p); stack.add(p); all(p).forEach((r) => { if (stack.has(r)) back.add(`${p}\u0000${r}`); else if (!seen.has(r)) dfs(r); }); stack.delete(p); post.push(p); })(q); });
  const layer = new Map(A.states.map((q) => [q, 0]));
  [...post].reverse().forEach((q) => all(q).forEach((r) => { if (!back.has(`${q}\u0000${r}`)) layer.set(r, Math.max(layer.get(r), layer.get(q) + 1)); }));
  const maxL = Math.max(...[...reach].map((q) => layer.get(q)));
  A.states.forEach((q) => { if (!reach.has(q)) layer.set(q, layer.get(q) + maxL + 1); }); // state tak tercapai di kanan
  const cols = [];
  [...layer.keys()].forEach((q) => (cols[layer.get(q)] ||= []).push(q));
  // Urutkan isi kolom berdasarkan rata-rata posisi pendahulunya, supaya garis jarang bersilangan.
  const yIdx = new Map();
  cols.forEach((col, L) => {
    if (L > 0) {
      const bary = (q) => { const pre = A.states.filter((p) => layer.get(p) < L && all(p).includes(q)); return pre.length ? pre.reduce((s, p) => s + yIdx.get(p), 0) / pre.length : 0; };
      col.sort((p, q) => bary(p) - bary(q));
    }
    col.forEach((q, i) => yIdx.set(q, i - (col.length - 1) / 2));
  });
  const nodes = A.states.map((q) => ({ id: q, label: q, x: layer.get(q) * dx, y: yIdx.get(q) * dy, start: q === A.start, final: A.finals.has(q) }));
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const merged = new Map();
  A.states.forEach((q) => A.symbols.forEach((a) => targets(A, q, a).forEach((r) => {
    const key = `${q}\u0000${r}`;
    if (!merged.has(key)) merged.set(key, { from: q, to: r, labels: [] });
    merged.get(key).labels.push(a);
  })));
  const edges = [...merged.values()].map((e) => {
    const p = pos.get(e.from), q = pos.get(e.to);
    const back = merged.has(`${e.to}\u0000${e.from}`);
    const lp = layer.get(e.from), lq = layer.get(e.to), far = Math.abs(lp - lq);
    let bend = 0;
    if (e.from !== e.to) {
      if (lp === lq) bend = Math.abs(p.y - q.y) > dy * 1.1 ? 46 : back ? 22 : 0;
      else if (far > 1) bend = 28 + 16 * far;
      else if (back) bend = 22;
    }
    return { from: e.from, to: e.to, label: e.labels.join(','), bend };
  });
  return { nodes, edges };
}

// Gambar automaton. g = { nodes: [{id,label,x,y,start,final}], edges: [{from,to,label,bend?,curve?}] }.
// opt: hot/new = Set id state, hotEdges/shownEdges = Set index edge, shown = Set id state, box = kotak fragment.
function drawAuto(g, opt = {}) {
  const pos = new Map(g.nodes.map((n) => [n.id, n]));
  const visible = (n) => !opt.shown || opt.shown.has(n.id);
  const pts = [];
  const seen = (x, y) => pts.push([x, y]);
  let edgesSvg = '';
  g.edges.forEach((e, i) => {
    if (opt.shownEdges && !opt.shownEdges.has(i)) return;
    const p = pos.get(e.from), q = pos.get(e.to);
    if (!visible(p) || !visible(q)) return;
    const sp = nodeSize(p.label), sq = nodeSize(q.label);
    const cls = `au-edge${opt.hotEdges && opt.hotEdges.has(i) ? ' hot' : ''}${e.label === EPS ? ' eps' : ''}`;
    let d, tip, dir, lx, ly;
    if (e.from === e.to) {
      const top = p.y - sp.h / 2;
      d = `M${p.x - 9} ${top + 1}C${p.x - 36} ${top - 46} ${p.x + 36} ${top - 46} ${p.x + 9} ${top + 1}`;
      tip = [p.x + 9, top + 1]; dir = [9 - 36, 47]; lx = p.x; ly = top - 44;
      seen(p.x, top - 50);
    } else if (e.curve) {
      const [c1, c2] = e.curve;
      const a = clipTo([p.x, p.y], c1, sp), b = clipTo([q.x, q.y], c2, sq);
      d = `M${a[0]} ${a[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
      tip = b; dir = [b[0] - c2[0], b[1] - c2[1]];
      lx = 0.125 * a[0] + 0.375 * c1[0] + 0.375 * c2[0] + 0.125 * b[0];
      ly = 0.125 * a[1] + 0.375 * c1[1] + 0.375 * c2[1] + 0.125 * b[1] + (c1[1] < p.y ? -11 : 11);
      seen(lx, ly);
    } else {
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, L = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const nx = (q.y - p.y) / L, ny = -(q.x - p.x) / L; // normal kiri arah jalan (ke atas untuk panah ke kanan)
      const bend = e.bend || 0;
      const c = [mx + nx * bend * 2, my + ny * bend * 2];
      const a = clipTo([p.x, p.y], bend ? c : [q.x, q.y], sp), b = clipTo([q.x, q.y], bend ? c : [p.x, p.y], sq);
      d = bend ? `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
      tip = b; dir = bend ? [b[0] - c[0], b[1] - c[1]] : [q.x - p.x, q.y - p.y];
      const off = bend ? 11 : 12, sgn = bend >= 0 ? 1 : -1;
      lx = (bend ? 0.25 * a[0] + 0.5 * c[0] + 0.25 * b[0] : mx) + nx * off * sgn;
      ly = (bend ? 0.25 * a[1] + 0.5 * c[1] + 0.25 * b[1] : my) + ny * off * sgn;
      seen(lx, ly);
    }
    const L = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / L, uy = dir[1] / L;
    const head = `${tip[0]},${tip[1]} ${tip[0] - ux * 10 - uy * 5},${tip[1] - uy * 10 + ux * 5} ${tip[0] - ux * 10 + uy * 5},${tip[1] - uy * 10 - ux * 5}`;
    edgesSvg += `<g class="${cls}"><path d="${d}"/><polygon points="${head}"/><text x="${lx}" y="${ly}">${escHTML(e.label)}</text></g>`;
  });
  let nodesSvg = '';
  g.nodes.forEach((n) => {
    if (!visible(n)) return;
    const s = nodeSize(n.label);
    const cls = `au-node${opt.hot && opt.hot.has(n.id) ? ' hot' : ''}${opt.dim && opt.dim.has(n.id) ? ' dim' : ''}`;
    const shape = (inset) => (s.circle ? `<circle cx="${n.x}" cy="${n.y}" r="${s.w / 2 - inset}"${inset ? ' class="ring"' : ''}/>` : `<rect x="${n.x - s.w / 2 + inset}" y="${n.y - s.h / 2 + inset}" width="${s.w - inset * 2}" height="${s.h - inset * 2}" rx="${s.h / 2 - inset}"${inset ? ' class="ring"' : ''}/>`);
    const isFinal = opt.finalOverride ? opt.finalOverride === n.id : n.final;
    const isStart = opt.startOverride ? opt.startOverride === n.id : n.start;
    let start = '';
    if (isStart) {
      const x0 = n.x - s.w / 2;
      start = `<g class="au-start"><path d="M${x0 - 38} ${n.y}H${x0 - 2}"/><polygon points="${x0 - 1},${n.y} ${x0 - 11},${n.y - 5} ${x0 - 11},${n.y + 5}"/></g>`;
      seen(x0 - 44, n.y);
    }
    nodesSvg += `${start}<g class="${cls}">${shape(0)}${isFinal ? shape(4) : ''}<text x="${n.x}" y="${n.y}">${escHTML(n.label)}</text></g>`;
    seen(n.x - s.w / 2, n.y - s.h / 2); seen(n.x + s.w / 2, n.y + s.h / 2);
  });
  let box = '';
  if (opt.box) {
    const b = opt.box;
    box = `<rect class="au-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="16"/>`;
    seen(b.x, b.y); seen(b.x + b.w, b.y + b.h);
  }
  // Ukuran gambar tetap sama walau sebagian state belum tampil (mode bertahap), jadi gambar tidak melompat.
  g.nodes.forEach((n) => { const s = nodeSize(n.label); seen(n.x - s.w / 2 - (n.start ? 44 : 0), n.y - s.h / 2); seen(n.x + s.w / 2, n.y + s.h / 2); });
  if (opt.extent) opt.extent.forEach(([x, y]) => seen(x, y));
  const pad = 16, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
  return svgOpen(x0, y0, w, h, opt.label || 'Diagram transisi') + `${box}${edgesSvg}${nodesSvg}</svg>`;
}
// Ukuran asli = 1 satuan per piksel. Gambar kecil tidak diperbesar, gambar besar diperkecil sampai 60%, lalu di-scroll.
const svgOpen = (x0, y0, w, h, label) => `<svg class="au-svg" viewBox="${x0} ${y0} ${w} ${h}" width="${Math.round(w)}" height="${Math.round(h)}" style="min-width:${Math.round(Math.min(w, Math.max(w * 0.6, 300)))}px" role="img" aria-label="${escHTML(label)}">`;
function clipTo(p, toward, s) {
  const dx = toward[0] - p[0], dy = toward[1] - p[1], L = Math.hypot(dx, dy) || 1;
  const t = s.circle ? s.w / 2 / L : Math.min(dx ? s.w / 2 / Math.abs(dx) : Infinity, dy ? s.h / 2 / Math.abs(dy) : Infinity);
  return [p[0] + dx * t, p[1] + dy * t];
}

// Pohon (syntax tree, parse tree). root: { kids: [...] }. opt.label(n), opt.annot(n) → { left, right, top, below }, opt.show(n), opt.hot(n).
function drawTree(root, opt) {
  const kids = opt.kids || ((n) => [n.a, n.b].filter(Boolean));
  const L = [], dx = opt.dx || 64, dy = opt.dy || 66;
  let leafX = 0;
  (function place(n, d) {
    n._d = d;
    const ks = kids(n);
    if (!ks.length) n._x = leafX++;
    else { ks.forEach((k) => place(k, d + 1)); n._x = (ks[0]._x + ks[ks.length - 1]._x) / 2; }
    L.push(n);
  })(root, 0);
  const X = (n) => n._x * dx, Y = (n) => n._d * dy;
  const show = opt.show || (() => true);
  let lines = '', nodes = '';
  L.forEach((n) => {
    if (!show(n)) return;
    kids(n).forEach((k) => { if (show(k)) lines += `<line class="au-tl" x1="${X(n)}" y1="${Y(n)}" x2="${X(k)}" y2="${Y(k)}"/>`; });
    const lab = String(opt.label(n)), s = nodeSize(lab);
    const a = opt.annot ? opt.annot(n) : {};
    const cls = `au-tn${opt.cls ? ' ' + opt.cls(n) : ''}${opt.hot && opt.hot(n) ? ' hot' : ''}`;
    const shape = s.circle ? `<circle cx="${X(n)}" cy="${Y(n)}" r="${s.w / 2}"/>` : `<rect x="${X(n) - s.w / 2}" y="${Y(n) - s.h / 2}" width="${s.w}" height="${s.h}" rx="${s.h / 2}"/>`;
    nodes += `<g class="${cls}">${shape}<text x="${X(n)}" y="${Y(n)}">${escHTML(lab)}</text>`
      + (a.left ? `<text class="au-fp" x="${X(n) - s.w / 2 - 5}" y="${Y(n)}">${escHTML(a.left)}</text>` : '')
      + (a.right ? `<text class="au-lp" x="${X(n) + s.w / 2 + 5}" y="${Y(n)}">${escHTML(a.right)}</text>` : '')
      + (a.top ? `<text class="au-nl" x="${X(n)}" y="${Y(n) - s.h / 2 - 9}">${escHTML(a.top)}</text>` : '')
      + (a.below ? `<text class="au-pos" x="${X(n)}" y="${Y(n) + s.h / 2 + 13}">${escHTML(a.below)}</text>` : '')
      + '</g>';
  });
  const maxX = Math.max(...L.map(X)), maxY = Math.max(...L.map(Y));
  const side = opt.side || 30;
  const x0 = -side - 20, y0 = -42, w = maxX + 2 * side + 40, h = maxY + 84;
  return svgOpen(x0, y0, w, h, opt.aria || 'Pohon') + `${lines}${nodes}</svg>`;
}

// Tabel transisi automaton sebagai HTML. opt.hotRow, opt.hotCell = [state, simbol], opt.setOf(state) untuk kolom set.
function tableHTML(A, opt = {}) {
  const head = `<tr><th>State</th>${opt.setOf ? '<th>Set</th>' : ''}${A.symbols.map((a) => `<th>${escHTML(a)}</th>`).join('')}</tr>`;
  const rows = A.states.map((q) => {
    const mark = `${q === A.start ? '→' : ''}${A.finals.has(q) ? '*' : ''}`;
    return `<tr class="${opt.hotRow === q ? 'cur' : ''}"><td class="st">${mark}${escHTML(q)}</td>${opt.setOf ? `<td>${escHTML(opt.setOf(q))}</td>` : ''}${A.symbols.map((a) => {
      const t = sortStates(A, targets(A, q, a));
      const hot = opt.hotCell && opt.hotCell[0] === q && opt.hotCell[1] === a;
      return `<td class="${hot ? 'hot' : ''}">${t.length ? escHTML(opt.braces === false || t.length === 1 && opt.braces !== true ? t.join(',') : `{${t.join(',')}}`) : '∅'}</td>`;
    }).join('')}</tr>`;
  }).join('');
  return `<table class="au-table">${head}${rows}</table>`;
}

/* ---------- Kartu langkah ---------- */
// box = elemen kartu. onShow(step, index) menggambar state. Tombol: Kembali, Langkah berikutnya, Langsung ke hasil, Ulang.
// Mode tebak (checkbox guessBox): langkah yang punya .ask tampil dulu sebagai pertanyaan, hasilnya muncul di klik berikutnya.
function stepper(box, onShow, guessBox) {
  box.innerHTML = `<p class="au-cap" aria-live="polite"></p><div class="ops">
    <button class="btn btn-sm" data-go="back">Kembali</button>
    <button class="btn btn-go btn-sm" data-go="next">Langkah berikutnya</button>
    <button class="btn btn-sm" data-go="end">Langsung ke hasil</button>
    <button class="btn btn-sm" data-go="reset">Ulang</button></div><p class="label au-count"></p>`;
  const cap = box.querySelector('.au-cap'), count = box.querySelector('.au-count');
  const btn = (k) => box.querySelector(`[data-go="${k}"]`);
  let steps = [], i = 0, asking = false;
  const guess = () => guessBox && guessBox.checked;
  function render() {
    const s = steps[i];
    if (asking) {
      onShow(steps[i - 1], i - 1, true);
      cap.innerHTML = `<b>Tebak dulu.</b> ${s.ask} <span class="label">Klik Langkah berikutnya untuk melihat jawabannya.</span>`;
    } else {
      onShow(s, i, false);
      cap.innerHTML = s.text;
    }
    btn('back').disabled = i === 0 && !asking;
    btn('next').disabled = i === steps.length - 1 && !asking;
    btn('end').disabled = btn('next').disabled;
    count.textContent = `Langkah ${i + 1} dari ${steps.length}`;
  }
  box.addEventListener('click', (e) => {
    const k = e.target.dataset && e.target.dataset.go;
    if (!k) return;
    if (k === 'next') { if (asking) asking = false; else if (i < steps.length - 1) { i++; asking = guess() && !!steps[i].ask; } }
    if (k === 'back') { if (asking) { asking = false; i--; } else if (i > 0) i--; }
    if (k === 'end') { i = steps.length - 1; asking = false; }
    if (k === 'reset') { i = 0; asking = false; }
    render();
  });
  return {
    load(s, at = 0) { steps = s; i = Math.min(at, s.length - 1); asking = false; render(); },
    get index() { return i; },
  };
}

/* ---------- Gambar di slide dan notes ---------- */
// <div class="au-fig" data-thompson="(a|b)*a"></div>      ε-NFA hasil Thompson
// <div class="au-fig" data-auto>tabel transisi</div>        diagram dari tabel (format parseTable)
// <div class="au-fig" data-tree="(a|b)*abb"></div>          syntax tree + nullable/firstpos/lastpos (data-plain = nomor posisi saja)
function renderFigures(root = document) {
  root.querySelectorAll('[data-thompson]').forEach((el) => {
    const src = el.dataset.thompson;
    el.innerHTML = drawAuto(thompson(parseRE(src), src.includes('+') ? '+' : '|').geo, { label: `ε-NFA untuk ${src}` });
  });
  root.querySelectorAll('[data-auto]').forEach((el) => { el.innerHTML = drawAuto(layoutAuto(parseTable(el.textContent)), { label: el.dataset.auto || 'Diagram transisi' }); });
  root.querySelectorAll('[data-tree]').forEach((el) => {
    const F = followposSteps(parseRE(el.dataset.tree)), plain = 'plain' in el.dataset;
    const S = (set) => `{${[...set].sort((a, b) => a - b).join(',')}}`;
    el.innerHTML = drawTree(F.root, {
      dx: 98, dy: 52, side: 50, aria: `Syntax tree untuk ${el.dataset.tree}#`,
      label: (n) => (n.t === 'sym' ? n.c : { cat: '·', alt: '|', star: '*', eps: 'ε' }[n.t]),
      cls: (n) => (n.t === 'sym' || n.t === 'eps' ? 'term' : ''),
      annot: (n) => ({ below: n.pos ? String(n.pos) : '', ...(plain ? {} : { left: S(n.first), right: S(n.last), top: n.nullable ? 'T' : 'F' }) }),
    });
  });
}

if (typeof module !== 'undefined') module.exports = { parseRE, showRE, reSymbols, thompson, parseTable, eclose, move, accepts, isDFA, subsetSteps, traceSteps, followposSteps, minimizeSteps, prepareDFA, layoutAuto, drawAuto, drawTree, tableHTML, showSet, EPS, escHTML };
