// Mesin grammar (CFG) untuk visualisasi Compilation technique. Butuh automata.js (parseRE, escHTML, EPS).
// Penulisan grammar: satu baris per variabel, "A → α | β" (boleh ->), ε untuk string kosong.
//   Variabel = huruf besar, boleh diikuti ' (A, A', E'). Simbol lain = terminal.
//   Rapat ("A → aB | ε"): setiap karakter satu simbol, kecuali id, num, dan int.
//   Berspasi ("T → int * T | ( E )"): dipisah spasi, jadi terminal boleh lebih dari satu huruf (int, id).
// Isi file:
//   parseGrammar, showGrammar        teks ↔ grammar
//   leftFactorSteps                  left factoring langkah demi langkah
//   leftRecursionSteps               eliminasi left recursion (urutan A1..An, seperti slide dosen)
//   reToCFG                          RE → CFG
//   findTrees, derivation            parse tree untuk sebuah string, lalu LMD/RMD-nya
//   firstFollow, firstFollowSteps    FIRST dan FOLLOW (FIRST yang dibutuhkan dihitung dulu, FOLLOW diulang sampai tidak berubah)
//   ll1TableSteps, ll1Parse          tabel LL(1) (conflict = bukan LL(1)) dan trace stack, opsional panic mode

if (typeof module !== 'undefined') { const au = require('./automata.js'); globalThis.escHTML = au.escHTML; globalThis.showRE = au.showRE; }
const isNT = (s) => /^[A-Z][0-9]*'*$/.test(s);
// Grammar rapat: satu karakter = satu simbol, kecuali variabel (A, A') dan token umum id, num, int.
const tokenize = (g, text) => (g.spaced ? text.split(/\s+/).filter(Boolean) : text.replace(/\s+/g, '').match(/id|num|int|[A-Z][0-9]*'*|./gu) || []);

function parseGrammar(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('Grammar masih kosong.');
  const g = { order: [], P: new Map(), spaced: false };
  const raw = lines.map((l, i) => {
    const m = l.match(/^(\S+?)\s*(?:→|->|::=)\s*(.*)$/);
    if (!m) throw new Error(`Baris ${i + 1}: tulis seperti "A → aB | b".`);
    if (!isNT(m[1])) throw new Error(`Baris ${i + 1}: ruas kiri (${m[1]}) harus variabel, yaitu huruf besar seperti A atau E'.`);
    const alts = m[2].split('|').map((a) => a.trim());
    if (alts.some((a) => a === '')) throw new Error(`Baris ${i + 1}: ada alternatif kosong. Tulis ε untuk string kosong.`);
    if (alts.some((a) => /\s/.test(a))) g.spaced = true;
    return [m[1], alts];
  });
  const tok = (a) => (a === 'ε' || a === 'eps' ? [] : tokenize(g, a.replace(/ε/g, '')));
  raw.forEach(([A, alts]) => {
    if (!g.P.has(A)) { g.order.push(A); g.P.set(A, []); }
    g.P.get(A).push(...alts.map(tok));
  });
  return g;
}
const showAlt = (g, alt) => (alt.length ? alt.join(g.spaced ? ' ' : '') : 'ε');
function showGrammar(g, hot = {}) {
  return g.order.map((A) => ({ A, alts: g.P.get(A).map((a) => showAlt(g, a)), hot: hot[A] })).filter((r) => r.alts.length);
}
const cloneG = (g) => ({ order: [...g.order], P: new Map([...g.P].map(([A, alts]) => [A, alts.map((a) => [...a])])), spaced: g.spaced });
// Nama variabel baru: A', A'', A''' ... (yang belum dipakai)
function fresh(g, A) { const base = A.replace(/'+$/, ''); let n = base + "'"; while (g.P.has(n)) n += "'"; return n; }
function insertAfter(g, A, N) {
  const base = A.replace(/'+$/, '');
  let at = g.order.indexOf(A);
  g.order.forEach((X, i) => { if (X.replace(/'+$/, '') === base && i > at) at = i; });
  g.order.splice(at + 1, 0, N);
}
const sameStart = (a, b) => a.length && b.length && a[0] === b[0];

/* ---------- Left factoring ---------- */
function leftFactorSteps(g0) {
  const g = cloneG(g0), steps = [];
  steps.push({ g: cloneG(g), text: 'Cari variabel yang punya <b>dua alternatif atau lebih dengan awalan yang sama</b>. Parser top-down tidak bisa memilih di antara alternatif seperti itu hanya dengan melihat satu token.' });
  for (let guard = 0; guard < 50; guard++) {
    let found = null;
    for (const A of g.order) {
      const alts = g.P.get(A);
      for (let i = 0; i < alts.length && !found; i++) {
        const group = alts.filter((b) => sameStart(alts[i], b));
        if (group.length < 2) continue;
        let k = 0;
        while (group.every((b) => b.length > k && b[k] === group[0][k])) k++;
        found = { A, group, prefix: group[0].slice(0, k) };
      }
      if (found) break;
    }
    if (!found) break;
    const { A, group, prefix } = found, N = fresh(g, A), alts = g.P.get(A);
    const before = alts.map((a) => showAlt(g, a));
    const first = alts.indexOf(group[0]);
    const rest = alts.filter((a) => !group.includes(a));
    rest.splice(alts.slice(0, first).filter((a) => !group.includes(a)).length, 0, [...prefix, N]);
    g.P.set(A, rest);
    g.P.set(N, group.map((a) => a.slice(prefix.length)));
    insertAfter(g, A, N);
    const pre = showAlt(g, prefix);
    steps.push({
      g: cloneG(g), hot: { [A]: true, [N]: true },
      ask: `Di ${A}, alternatif ${group.map((a) => `<code>${escHTML(showAlt(g, a))}</code>`).join(', ')} punya awalan yang sama. Apa hasil left factoring-nya?`,
      text: `${A} → ${before.map((a) => `<code>${escHTML(a)}</code>`).join(' | ')}. Alternatif ${group.map((a) => `<code>${escHTML(showAlt(g, a))}</code>`).join(', ')} sama-sama diawali <code>${escHTML(pre)}</code> (awalan bersama terpanjang). Keluarkan awalan itu: <code>${escHTML(A)} → ${escHTML(pre)}${g.spaced ? ' ' : ''}${escHTML(N)}</code>, dan sisanya pindah ke variabel baru <code>${escHTML(N)} → ${group.map((a) => escHTML(showAlt(g, a.slice(prefix.length)))).join(' | ')}</code>. Sisa yang kosong ditulis ε.`,
    });
  }
  steps.push({ g: cloneG(g), done: true, text: steps.length > 1 ? 'Selesai: tidak ada lagi dua alternatif dari variabel yang sama dengan awalan yang sama. Sekarang parser cukup melihat <b>satu token</b> untuk memilih alternatif.' : 'Grammar ini tidak perlu left factoring: tidak ada dua alternatif dengan awalan yang sama.' });
  return steps;
}

/* ---------- Eliminasi left recursion ---------- */
function leftRecursionSteps(g0, order) {
  const g = cloneG(g0), steps = [];
  order = order && order.length ? order : g.order.filter((A) => g.P.has(A));
  steps.push({ g: cloneG(g), text: `Urutan variabel: <b>${order.join(', ')}</b>. Untuk setiap A<sub>i</sub> (dari kiri), substitusikan dulu variabel yang <b>lebih awal</b> di urutan kalau muncul di depan alternatif A<sub>i</sub>, lalu hapus <b>immediate left recursion</b> di A<sub>i</sub>.` });
  order.forEach((Ai, i) => {
    for (let j = 0; j < i; j++) {
      const Aj = order[j], alts = g.P.get(Ai);
      if (!alts.some((a) => a[0] === Aj)) continue;
      const out = [];
      alts.forEach((a) => { if (a[0] === Aj) g.P.get(Aj).forEach((d) => out.push([...d, ...a.slice(1)])); else out.push(a); });
      g.P.set(Ai, out);
      steps.push({
        g: cloneG(g), hot: { [Ai]: true },
        ask: `${Ai} punya alternatif yang diawali ${Aj}, dan ${Aj} lebih awal di urutan. Apa hasil substitusinya?`,
        text: `<b>Substitusi</b> ${Aj} ke ${Ai}: alternatif ${Ai} yang diawali <code>${Aj}</code> diganti dengan setiap alternatif ${Aj} (<code>${escHTML(g.P.get(Aj).map((d) => showAlt(g, d)).join(' | '))}</code>). Tujuannya membuat left recursion tersembunyi (lewat ${Aj}) menjadi terlihat langsung.`,
      });
    }
    const alts = g.P.get(Ai);
    const rec = alts.filter((a) => a[0] === Ai && a.length > 1), base = alts.filter((a) => a[0] !== Ai);
    const cyc = alts.some((a) => a.length === 1 && a[0] === Ai);
    if (!rec.length) {
      steps.push({ g: cloneG(g), hot: { [Ai]: true }, text: `${Ai}: tidak ada alternatif yang diawali ${Ai} sendiri, jadi tidak ada immediate left recursion. Lanjut.`, quiet: true });
      return;
    }
    const N = fresh(g, Ai);
    g.P.set(Ai, (base.length ? base : [[]]).map((b) => [...b, N]));
    g.P.set(N, [...rec.map((a) => [...a.slice(1), N]), []]);
    insertAfter(g, Ai, N);
    const sp = g.spaced ? ' ' : '';
    steps.push({
      g: cloneG(g), hot: { [Ai]: true, [N]: true },
      ask: `${Ai} → ${alts.map((a) => escHTML(showAlt(g, a))).join(' | ')} punya immediate left recursion. Apa hasilnya?`,
      text: `<b>Immediate left recursion</b> di ${Ai}. Bagi alternatifnya: yang diawali ${Ai} (<b>α</b>: ${rec.map((a) => `<code>${escHTML(showAlt(g, a.slice(1)))}</code>`).join(', ')}) dan yang tidak (<b>β</b>: ${base.map((a) => `<code>${escHTML(showAlt(g, a))}</code>`).join(', ') || '(tidak ada)'}). ${Ai} selalu dimulai dari salah satu β lalu diikuti α nol kali atau lebih, jadi: <code>${Ai} → β${sp}${N}</code> dan <code>${N} → α${sp}${N} | ε</code>.${cyc ? ` Alternatif <code>${Ai} → ${Ai}</code> dibuang karena tidak menghasilkan apa-apa.` : ''}${base.length ? '' : ' Tidak ada β, jadi variabel ini tidak pernah menghasilkan string terminal.'}`,
    });
  });
  steps.push({ g: cloneG(g), done: true, text: 'Selesai: tidak ada variabel yang bisa menurunkan dirinya sendiri di posisi paling kiri. Grammar ini aman untuk parser top-down (recursive descent).' });
  return steps;
}

/* ---------- RE → CFG ---------- */
// form(r) menghasilkan deretan simbol untuk r: simbol tetap simbol, concatenation = deretan berdampingan,
// union dan star butuh variabel baru. Star: X → rX | ε, dan star dari union: X → r1X | r2X | ε.
function reToCFG(ast, u = '|') {
  const P = new Map(), order = [], steps = [];
  let next = 0;
  const names = 'ABCDEFGHIJKLMNOPQRTUVWXYZ';
  const newVar = () => names[next++] || `X${next}`;
  const alts = (n) => (n.t === 'alt' ? [...alts(n.a), ...alts(n.b)] : [n]);
  function define(X, n) {
    const step = { X, re: showRE(n, u) };
    steps.push(step); // didorong sebelum anak-anaknya, jadi urutan langkah dari S ke bawah
    let rhs, why;
    if (n.t === 'star') {
      const body = alts(n.a);
      order.push(X); P.set(X, null);
      rhs = [...body.map((b) => [...form(b), X]), []];
      why = body.length > 1
        ? `<b>Star dari union</b> <code>${escHTML(showRE(n, u))}</code>: setiap putaran memilih salah satu alternatif lalu boleh mengulang (${X} di belakang), atau berhenti (ε).`
        : `<b>Star</b> <code>${escHTML(showRE(n, u))}</code>: ${X} menghasilkan <code>${escHTML(showRE(n.a, u))}</code> lalu ${X} lagi (ulangi), atau ε (berhenti). Sama seperti aturan a* → S → aS | ε.`;
    } else if (n.t === 'alt') {
      order.push(X); P.set(X, null);
      rhs = alts(n).map(form);
      why = `<b>Union</b> <code>${escHTML(showRE(n, u))}</code>: setiap alternatif RE menjadi satu alternatif produksi, dipisah |.`;
    } else {
      order.push(X); P.set(X, null);
      rhs = [form(n)];
      why = `<b>Concatenation</b> <code>${escHTML(showRE(n, u))}</code>: tulis bagian-bagiannya berdampingan. Bagian yang berupa union atau star diwakili variabel baru.`;
    }
    P.set(X, rhs);
    step.why = why;
  }
  function form(n) {
    if (n.t === 'sym') return [n.c];
    if (n.t === 'eps') return [];
    if (n.t === 'cat') return [...form(n.a), ...form(n.b)];
    const X = newVar();
    define(X, n);
    return [X];
  }
  define('S', ast);
  const g = { order: [...order].sort((a, b) => (a === 'S' ? -1 : b === 'S' ? 1 : a < b ? -1 : 1)), P, spaced: false };
  return { g, steps };
}

/* ---------- Parse tree dan derivation ---------- */
// Cari sampai `limit` parse tree berbeda untuk tokens, dengan mencoba semua leftmost derivation.
function findTrees(g, start, tokens, limit = 2, budget = 400000) {
  const NT = new Set(g.P.keys());
  // minLen[A] = panjang string terpendek yang bisa diturunkan A (untuk memangkas pencarian).
  const minLen = new Map([...NT].map((A) => [A, Infinity]));
  for (let changed = true; changed;) {
    changed = false;
    for (const [A, alts] of g.P) for (const a of alts) {
      const L = a.reduce((s, x) => s + (NT.has(x) ? minLen.get(x) : 1), 0);
      if (L < minLen.get(A)) { minLen.set(A, L); changed = true; }
    }
  }
  // Coba alternatif yang tidak left-recursive dan pendek dulu, supaya derivation yang ditemukan tidak bertele-tele.
  const cost = (A, a) => (a[0] === A ? 1000 : 0) + a.reduce((s, x) => s + (NT.has(x) ? minLen.get(x) : 1), 0);
  const tryOrder = new Map([...g.P].map(([A, alts]) => [A, [...alts].sort((a, b) => cost(A, a) - cost(A, b))]));
  const n = tokens.length, found = [];
  let work = 0;
  const path = [];
  const onPath = new Set();
  function dfs(form) {
    if (found.length >= limit || ++work > budget) return;
    let i = 0;
    while (i < form.length && !NT.has(form[i])) { if (i >= n || form[i] !== tokens[i]) return; i++; }
    if (i === form.length) { if (form.length === n) found.push([...path]); return; }
    let need = 0, terms = 0;
    for (const x of form) { need += NT.has(x) ? minLen.get(x) : 1; if (!NT.has(x)) terms++; }
    if (need > n || terms > n || form.length > 2 * n + 6) return;
    const key = form.join('\u0001');
    if (onPath.has(key)) return;
    onPath.add(key);
    const A = form[i];
    for (const alt of tryOrder.get(A)) {
      path.push([A, alt]);
      dfs([...form.slice(0, i), ...alt, ...form.slice(i + 1)]);
      path.pop();
      if (found.length >= limit) break;
    }
    onPath.delete(key);
  }
  if (!NT.has(start)) throw new Error(`Start symbol ${start} tidak punya produksi.`);
  dfs([start]);
  // Leftmost derivation → pohon.
  const trees = found.map((prods) => {
    let id = 0;
    const root = { sym: start, kids: [], id: id++ };
    const frontier = [root];
    prods.forEach(([A, alt]) => {
      const k = frontier.findIndex((x) => NT.has(x.sym) && !x.done);
      const node = frontier[k];
      node.done = true;
      node.kids = alt.length ? alt.map((s) => ({ sym: s, kids: [], id: id++ })) : [{ sym: 'ε', kids: [], id: id++, eps: true }];
      frontier.splice(k, 1, ...node.kids.filter((c) => !c.eps));
    });
    return root;
  });
  return { trees, exhausted: work > budget };
}

// Urutan ekspansi node pada LMD atau RMD, dan sentential form di setiap langkah.
function derivation(g, root, rightmost) {
  const NT = new Set(g.P.keys());
  const order = [], forms = [];
  let frontier = [root];
  forms.push({ syms: [root.sym] });
  for (;;) {
    const idx = frontier.map((x, i) => (NT.has(x.sym) ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) break;
    const k = rightmost ? idx[idx.length - 1] : idx[0];
    const node = frontier[k];
    order.push(node);
    frontier = [...frontier.slice(0, k), ...node.kids.filter((c) => !c.eps), ...frontier.slice(k + 1)];
    forms[forms.length - 1].exp = k; // posisi variabel yang diekspansi di form sebelumnya
    forms.push({ syms: frontier.map((x) => x.sym), at: k, len: node.kids.filter((c) => !c.eps).length });
  }
  return { order, forms };
}

/* ---------- FIRST, FOLLOW, tabel LL(1), dan trace stack ---------- */
// Set FIRST memuat 'ε' kalau bisa kosong. Akhir input = '$'. Start symbol = variabel di baris pertama.
const isEps = (t) => t === 'ε';
function firstSeq(g, F, syms) {
  const out = new Set();
  for (const x of syms) {
    if (!g.P.has(x)) { out.add(x); return out; }
    F.get(x).forEach((t) => { if (!isEps(t)) out.add(t); });
    if (!F.get(x).has('ε')) return out;
  }
  out.add('ε');
  return out;
}
function firstFollow(g) {
  const vars = g.order.filter((A) => g.P.has(A)), terms = [];
  vars.forEach((A) => g.P.get(A).forEach((a) => a.forEach((x) => {
    if (isNT(x) && !g.P.has(x)) throw new Error(`Variabel ${x} dipakai di ruas kanan tapi tidak punya produksi.`);
    if (!g.P.has(x) && !terms.includes(x)) terms.push(x);
  })));
  if (terms.includes('$')) throw new Error('$ dipakai sebagai tanda akhir input, jadi tidak boleh menjadi terminal.');
  const first = new Map(vars.map((A) => [A, new Set()])), follow = new Map(vars.map((A) => [A, new Set()]));
  const grow = (set, xs) => { let ch = false; xs.forEach((t) => { if (!set.has(t)) { set.add(t); ch = true; } }); return ch; };
  for (let ch = true; ch;) { ch = false; vars.forEach((A) => g.P.get(A).forEach((a) => { if (grow(first.get(A), firstSeq(g, first, a))) ch = true; })); }
  follow.get(vars[0]).add('$');
  for (let ch = true; ch;) {
    ch = false;
    vars.forEach((A) => g.P.get(A).forEach((a) => a.forEach((B, i) => {
      if (!g.P.has(B)) return;
      const f = firstSeq(g, first, a.slice(i + 1));
      if (grow(follow.get(B), [...f].filter((t) => !isEps(t)))) ch = true;
      if (f.has('ε') && grow(follow.get(B), follow.get(A))) ch = true;
    })));
  }
  // Urutan seperti slide dosen. Kolom tabel: kata/huruf urut abjad, lalu simbol sesuai urutan muncul, lalu $ (id + * ( ) $).
  // Isi set: simbol dulu, lalu kata/huruf, lalu $ dan ε ({(, id}, {+, ), $}, {*, ε}).
  const words = terms.filter((t) => /^\w+$/.test(t)).sort(), syms = terms.filter((t) => !/^\w+$/.test(t));
  const cols = [...words, ...syms, '$'], inSet = [...syms, ...words, '$', 'ε'];
  const rank = (t) => inSet.indexOf(t);
  return { first, follow, vars, terms, cols, start: vars[0], fmt: (set) => (set.size ? `{${[...set].sort((x, y) => rank(x) - rank(y)).join(', ')}}` : '∅') };
}

// Langkah FIRST (variabel yang dibutuhkan dihitung dulu), lalu FOLLOW (urutan grammar, diulang sampai tidak berubah).
function firstFollowSteps(g) {
  const R = firstFollow(g), { first: F, vars, fmt } = R, steps = [];
  const c = (s) => `<code>${escHTML(s)}</code>`;
  const prod = (A, a) => c(`${A} → ${showAlt(g, a)}`);
  const shownF = new Map(), shownFO = new Map();
  const copy = (m) => new Map([...m].map(([A, s]) => [A, new Set(s)]));
  const snap = (o) => steps.push({ first: copy(shownF), follow: copy(shownFO), ...o });
  snap({ text: 'Mulai dari <b>FIRST</b>: untuk setiap variabel, terminal apa yang bisa muncul paling depan. Kalau sebuah produksi diawali variabel lain, FIRST variabel itu dihitung dulu. Setelah semua FIRST selesai, baru <b>FOLLOW</b>.' });
  const seen = new Set();
  function firstLine(A, a) {
    if (!a.length) return `${prod(A, a)}: ruas kanannya ε, jadi ε masuk.`;
    const parts = [];
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      if (!g.P.has(x)) { parts.push(`${i ? 'terminal' : 'diawali terminal'} ${c(x)}, jadi ${c(x)} masuk`); return `${prod(A, a)}: ${parts.join('. ')}.`; }
      const fx = F.get(x), nul = fx.has('ε');
      parts.push(nul ? `FIRST(${escHTML(x)}) tanpa ε, ${escHTML(fmt(new Set([...fx].filter((t) => !isEps(t)))))}, masuk. ${escHTML(x)} bisa ε, jadi lanjut ke ${escHTML(a[i + 1] || 'akhir')}` : `FIRST(${escHTML(x)}) = ${escHTML(fmt(fx))} masuk`);
      if (!nul) return `${prod(A, a)}: ${parts.join('. ')}.`;
    }
    return `${prod(A, a)}: ${parts.join('. ')}. Semua simbolnya bisa ε, jadi ε masuk.`;
  }
  function visit(A) {
    if (seen.has(A)) return;
    seen.add(A);
    for (const a of g.P.get(A)) for (const x of a) { if (!g.P.has(x)) break; visit(x); if (!F.get(x).has('ε')) break; }
    shownF.set(A, F.get(A));
    snap({
      hot: { A, col: 'first' }, rows: [A],
      ask: `Berapa FIRST(${escHTML(A)})? Lihat simbol paling depan di setiap produksi ${escHTML(A)}.`,
      text: `<b>FIRST(${escHTML(A)}) = ${escHTML(fmt(F.get(A)))}</b>. Lihat setiap produksi ${escHTML(A)}:<br>${g.P.get(A).map((a) => `• ${firstLine(A, a)}`).join('<br>')}`,
    });
  }
  vars.forEach(visit);

  const cur = new Map(vars.map((A) => [A, new Set()]));
  cur.get(R.start).add('$');
  const occ = (A) => vars.flatMap((B) => g.P.get(B).flatMap((a) => a.map((x, i) => (x === A ? { B, a, i } : null)).filter(Boolean)));
  function followOf(A, pass) {
    const out = new Set(cur.get(A)), lines = [];
    if (A === R.start) lines.push(`${escHTML(A)} adalah start symbol, jadi $ masuk (aturan 1).`);
    occ(A).forEach(({ B, a, i }) => {
      const rest = a.slice(i + 1), f = firstSeq(g, F, rest), parts = [];
      if (rest.length) {
        const fs = [...f].filter((t) => !isEps(t));
        fs.forEach((t) => out.add(t));
        parts.push(!g.P.has(rest[0]) ? `tepat setelah ${escHTML(A)} ada terminal ${c(rest[0])}, jadi ${c(rest[0])} masuk (aturan 2)` : `setelah ${escHTML(A)} ada ${c(showAlt(g, rest))}, jadi FIRST-nya tanpa ε, ${escHTML(fmt(new Set(fs)))}, masuk (aturan 2)`);
      }
      if (f.has('ε')) {
        const why = rest.length ? `${c(showAlt(g, rest))} bisa ε, jadi` : `${escHTML(A)} ada di paling kanan, jadi`;
        if (B === A) parts.push(`${why} FOLLOW(${escHTML(A)}) masuk ke dirinya sendiri, tidak menambah apa-apa`);
        else {
          cur.get(B).forEach((t) => out.add(t));
          const later = pass === 1 && vars.indexOf(B) > vars.indexOf(A);
          parts.push(`${why} FOLLOW(${escHTML(B)}) = ${escHTML(fmt(cur.get(B)))} masuk (aturan ${rest.length ? '3b' : '3a'})${later ? `. FOLLOW(${escHTML(B)}) belum dihitung, jadi nanti dicek lagi` : ''}`);
        }
      }
      lines.push(`${prod(B, a)}: ${parts.join('; ')}.`);
    });
    return { out, lines };
  }
  vars.forEach((A) => {
    const { out, lines } = followOf(A, 1);
    cur.set(A, out);
    shownFO.set(A, out);
    snap({
      hot: { A, col: 'follow' }, rows: occ(A).map((o) => o.B),
      ask: `Berapa FOLLOW(${escHTML(A)})? Cari ${escHTML(A)} di ruas kanan semua produksi.`,
      text: `<b>FOLLOW(${escHTML(A)}) = ${escHTML(fmt(out))}</b>. ${lines.length ? `Cari ${escHTML(A)} di ruas kanan:<br>${lines.map((l) => `• ${l}`).join('<br>')}` : `${escHTML(A)} tidak muncul di ruas kanan mana pun, jadi FOLLOW-nya kosong.`}`,
    });
  });
  for (let pass = 2, ch = true; ch && pass < 20; pass++) {
    ch = false;
    vars.forEach((A) => {
      const before = fmt(cur.get(A)), { out, lines } = followOf(A, pass);
      if (out.size === cur.get(A).size) return;
      ch = true;
      cur.set(A, out);
      shownFO.set(A, out);
      snap({ hot: { A, col: 'follow' }, rows: occ(A).map((o) => o.B), text: `<b>Cek ulang FOLLOW(${escHTML(A)})</b>: tadi ${escHTML(before)}. Sekarang FOLLOW variabel lain sudah lengkap, jadi menjadi <b>${escHTML(fmt(out))}</b>.<br>${lines.map((l) => `• ${l}`).join('<br>')}` });
    });
  }
  snap({ done: true, text: 'Selesai. Aturan 3 sudah dicek ulang dengan FOLLOW yang lengkap, dan tidak ada yang bertambah. Ingat: <b>FOLLOW tidak pernah memuat ε</b>, dan FOLLOW start symbol selalu memuat $.' });
  return { steps, ff: R };
}

// Tabel LL(1): A → α masuk ke M[A,a] untuk a di FIRST(α); kalau ε di FIRST(α), ke M[A,b] untuk b di FOLLOW(A).
function ll1TableSteps(g) {
  const ff = firstFollow(g), { vars, fmt } = ff, steps = [];
  const M = new Map(vars.map((A) => [A, new Map()]));
  const c = (s) => `<code>${escHTML(s)}</code>`;
  const snap = (o) => steps.push({ M: new Map([...M].map(([A, r]) => [A, new Map([...r].map(([a, ps]) => [a, [...ps]]))])), ...o });
  snap({ text: 'Setiap produksi <code>A → α</code> diproses satu per satu. Hitung FIRST(α). Untuk setiap terminal a di FIRST(α), tulis produksi itu di sel M[A, a]. Kalau FIRST(α) memuat ε, tulis juga di M[A, b] untuk setiap b di FOLLOW(A).' });
  const conflicts = [];
  vars.forEach((A) => g.P.get(A).forEach((a) => {
    const byCol = (ts) => ts.sort((x, y) => ff.cols.indexOf(x) - ff.cols.indexOf(y));
    const f = firstSeq(g, ff.first, a), viaFirst = byCol([...f].filter((t) => !isEps(t))), viaFollow = f.has('ε') ? byCol([...ff.follow.get(A)].filter((t) => !viaFirst.includes(t))) : [];
    const p = `${A} → ${showAlt(g, a)}`, cells = [...viaFirst, ...viaFollow], clash = [];
    cells.forEach((t) => { const ps = M.get(A).get(t) || []; if (ps.length) clash.push(t); M.get(A).set(t, [...ps, a]); });
    clash.forEach((t) => conflicts.push([A, t]));
    const list = (ts) => ts.map((t) => `M[${escHTML(A)}, ${escHTML(t)}]`).join(', ');
    snap({
      hot: { A, cells }, rows: [A],
      ask: `Produksi ${c(p)} masuk ke sel mana saja?`,
      text: `${c(p)}: FIRST(${escHTML(showAlt(g, a))}) = ${escHTML(fmt(f))}.`
        + (viaFirst.length ? ` Tulis di ${list(viaFirst)}.` : '')
        + (f.has('ε') ? ` FIRST memuat ε, jadi pakai FOLLOW(${escHTML(A)}) = ${escHTML(fmt(ff.follow.get(A)))}: tulis di ${list(viaFollow) || '(tidak ada sel baru)'}.` : '')
        + (clash.length ? ` <b>Conflict:</b> ${list(clash)} sudah berisi produksi lain, jadi sekarang berisi dua produksi.` : ''),
    });
  }));
  snap({
    done: true,
    text: conflicts.length
      ? `Selesai. Ada sel yang berisi lebih dari satu produksi (${conflicts.map(([A, t]) => `M[${escHTML(A)}, ${escHTML(t)}]`).join(', ')}), jadi parser tidak bisa memilih dengan satu token. <b>Grammar ini bukan LL(1).</b>`
      : 'Selesai. Setiap sel berisi paling banyak satu produksi, jadi <b>grammar ini LL(1)</b>. Sel kosong berarti error.',
  });
  return { steps, M, conflicts, ff };
}

// Trace parser LL(1). Stack: indeks 0 = top. Setiap baris = konfigurasi sebelum aksinya dijalankan.
// panic = panic-mode error recovery seperti slide dosen: sel kosong = sync (buang input sampai ketemu simbol di FOLLOW(A),
// lalu pop A); terminal di stack tidak cocok = pop terminal itu ("missing …, inserted").
function ll1Parse(g, tbl, tokens, panic = false) {
  if (tbl.conflicts.length) throw new Error('Tabel LL(1) grammar ini punya sel berisi dua produksi (conflict), jadi trace tidak bisa dijalankan. Grammar-nya bukan LL(1).');
  const { M, ff } = tbl;
  let id = 0;
  const node = (sym, t) => ({ sym, kids: [], id: id++, t });
  const root = node(ff.start, -1), input = [...tokens, '$'], rows = [];
  let stack = [root, { sym: '$' }], pos = 0, errors = 0;
  for (let guard = 0; guard < 500; guard++) {
    const X = stack[0], a = input[pos], row = { stack: stack.map((n) => n.sym), pos, X: X.sym, a, node: X };
    rows.push(row);
    if (X.sym === '$') {
      row.kind = a === '$' ? 'accept' : 'extra';
      if (a !== '$') errors++;
      break;
    }
    if (!g.P.has(X.sym)) {
      if (X.sym === a) { row.kind = 'match'; stack.shift(); pos++; continue; }
      errors++;
      row.kind = 'mismatch';
      if (!panic) break;
      stack.shift();
      X.err = true;
      continue;
    }
    const ps = M.get(X.sym).get(a);
    if (ps && ps.length) {
      const alt = ps[0], t = rows.length - 1;
      X.kids = alt.length ? alt.map((s) => node(s, t)) : [Object.assign(node('ε', t), { eps: true })];
      Object.assign(row, { kind: 'expand', alt });
      stack = [...X.kids.filter((k) => !k.eps), ...stack.slice(1)];
      continue;
    }
    errors++;
    row.kind = 'empty';
    if (!panic) break;
    row.skip = [];
    while (input[pos] !== '$' && !ff.follow.get(X.sym).has(input[pos])) row.skip.push(input[pos++]);
    stack.shift();
    X.err = true;
  }
  return { rows, root, input, errors, accepted: rows[rows.length - 1].kind === 'accept' && !errors };
}

// Parse tree di slide dan notes: <div class="au-fig" data-grammar="E → E+E | id" data-input="id+id" data-which="1"></div>
// (baris grammar dipisah ;). data-which = parse tree ke berapa (0 atau 1) kalau grammar-nya ambiguous.
function renderParseTrees(root = document) {
  root.querySelectorAll('[data-grammar]').forEach((el) => {
    const g = parseGrammar(el.dataset.grammar.replace(/;/g, '\n'));
    const t = findTrees(g, g.order[0], tokenize(g, el.dataset.input)).trees[+(el.dataset.which || 0)];
    el.innerHTML = drawTree(t, { kids: (n) => n.kids, dx: 50, side: 20, label: (n) => n.sym, cls: (n) => (g.P.has(n.sym) ? '' : 'term'), aria: `Parse tree untuk ${el.dataset.input}` });
  });
}

if (typeof module !== 'undefined') module.exports = { tokenize, parseGrammar, showGrammar, showAlt, leftFactorSteps, leftRecursionSteps, reToCFG, findTrees, derivation, isNT, firstFollow, firstFollowSteps, ll1TableSteps, ll1Parse };
