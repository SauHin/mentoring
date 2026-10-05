// Mesin logika proposisi untuk visualisasi Discrete mathematics.
// parseLogic("~(p ∧ q) -> r") → pohon ekspresi. Penulisan yang diterima:
//   not: ~ ¬ !     and: ∧ ^ & and     or: ∨ | or     xor: ⊕ xor
//   implies: → -> =>     iff: ↔ <-> <=>     konstanta: T F     variabel: p, q, RK, GC, ...
// Urutan operasi mengikuti Epp: ~ dulu, lalu ∧ ∨ ⊕ (setara), lalu → ↔ (setara).
// Operator yang setara tidak boleh dicampur tanpa kurung, karena hasilnya ambigu.

const LOGIC_SYM = { not: '~', and: '∧', or: '∨', xor: '⊕', imp: '→', iff: '↔' };

function logicTokens(src) {
  const out = [];
  const single = { '~': 'not', '¬': 'not', '!': 'not', '∧': 'and', '^': 'and', '&': 'and', '∨': 'or', '|': 'or', '⊕': 'xor', '→': 'imp', '↔': 'iff', '(': '(', ')': ')' };
  const words = { and: 'and', or: 'or', not: 'not', xor: 'xor' };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
    if (three === '<->' || three === '<=>') { out.push({ t: 'iff' }); i += 3; continue; }
    if (two === '->' || two === '=>') { out.push({ t: 'imp' }); i += 2; continue; }
    if (two === '&&') { out.push({ t: 'and' }); i += 2; continue; }
    if (two === '||') { out.push({ t: 'or' }); i += 2; continue; }
    if (single[c]) { out.push({ t: single[c] }); i++; continue; }
    const m = src.slice(i).match(/^[A-Za-z]\w*/);
    if (m) {
      const w = m[0];
      if (words[w.toLowerCase()]) out.push({ t: words[w.toLowerCase()] });
      else if (w === 'T' || w === 'F') out.push({ t: 'const', v: w === 'T' });
      else out.push({ t: 'var', name: w });
      i += w.length;
      continue;
    }
    throw new Error(`Karakter "${c}" tidak dikenal.`);
  }
  return out;
}

function parseLogic(src) {
  const toks = logicTokens(src);
  let k = 0;
  const peek = () => toks[k] && toks[k].t;
  const name = (t) => LOGIC_SYM[t];

  function primary() {
    const tok = toks[k++];
    if (!tok) throw new Error('Ekspresi belum lengkap.');
    if (tok.t === 'not') return { op: 'not', a: primary() };
    if (tok.t === 'var') return { op: 'var', name: tok.name };
    if (tok.t === 'const') return { op: 'const', v: tok.v };
    if (tok.t === '(') {
      const e = cond();
      if (toks[k++]?.t !== ')') throw new Error('Kurung tutup ")" kurang.');
      return e;
    }
    throw new Error(`Tidak bisa diawali "${name(tok.t) || tok.t}".`);
  }
  // ∧ ∨ ⊕: boleh berantai dengan operator yang sama (p ∧ q ∧ r), tapi tidak dicampur.
  function andOr() {
    let left = primary();
    const first = peek();
    while (['and', 'or', 'xor'].includes(peek())) {
      const op = toks[k++].t;
      if (op !== first) throw new Error(`"${name(first)}" dan "${name(op)}" setingkat. Pakai kurung, misalnya (p ${name(first)} q) ${name(op)} r.`);
      left = { op, a: left, b: primary() };
    }
    return left;
  }
  // → ↔: tidak boleh berantai tanpa kurung (→ tidak asosiatif).
  function cond() {
    const left = andOr();
    if (peek() !== 'imp' && peek() !== 'iff') return left;
    const op = toks[k++].t;
    const node = { op, a: left, b: andOr() };
    if (peek() === 'imp' || peek() === 'iff') throw new Error(`"${name(op)}" lalu "${name(peek())}" tanpa kurung itu ambigu. Tulis (p ${name(op)} q) ${name(peek())} r atau p ${name(op)} (q ${name(peek())} r).`);
    return node;
  }
  if (!toks.length) throw new Error('Ekspresi masih kosong.');
  const tree = cond();
  if (k < toks.length) throw new Error(toks[k].t === ')' ? 'Ada kurung tutup ")" tanpa pasangan.' : `Ada sisa yang tidak terbaca mulai dari "${name(toks[k].t) || toks[k].name || toks[k].t}".`);
  return tree;
}

// Tulis ulang pohon dengan kurung seperlunya: (p ∧ q) ∨ r, ~(p → q), p ∧ q ∧ r.
function showLogic(n) {
  if (n.op === 'var') return n.name;
  if (n.op === 'const') return n.v ? 'T' : 'F';
  const sub = (c, parent) => {
    if (c.op === 'var' || c.op === 'const' || c.op === 'not') return showLogic(c);
    if (c.op === parent && ['and', 'or', 'xor'].includes(parent)) return showLogic(c);
    return `(${showLogic(c)})`;
  };
  if (n.op === 'not') return '~' + sub(n.a, 'not');
  return `${sub(n.a, n.op)} ${LOGIC_SYM[n.op]} ${sub(n.b, n.op)}`;
}

function evalLogic(n, env) {
  switch (n.op) {
    case 'var': return env[n.name];
    case 'const': return n.v;
    case 'not': return !evalLogic(n.a, env);
    case 'and': return evalLogic(n.a, env) && evalLogic(n.b, env);
    case 'or': return evalLogic(n.a, env) || evalLogic(n.b, env);
    case 'xor': return evalLogic(n.a, env) !== evalLogic(n.b, env);
    case 'imp': return !evalLogic(n.a, env) || evalLogic(n.b, env);
    case 'iff': return evalLogic(n.a, env) === evalLogic(n.b, env);
  }
}

function logicVars(...trees) {
  const set = new Set();
  const walk = (n) => { if (n.op === 'var') set.add(n.name); if (n.a) walk(n.a); if (n.b) walk(n.b); };
  trees.forEach(walk);
  return [...set].sort((x, y) => x.localeCompare(y));
}

// Langkah pengerjaan: setiap sub-ekspresi (selain variabel) jadi satu kolom, dari dalam ke luar.
function logicSteps(tree) {
  const seen = new Map();
  const walk = (n) => {
    if (n.a) walk(n.a);
    if (n.b) walk(n.b);
    if (n.op !== 'var' && n.op !== 'const') { const s = showLogic(n); if (!seen.has(s)) seen.set(s, n); }
  };
  walk(tree);
  return [...seen.entries()].map(([label, node]) => ({ label, node }));
}

// Semua kombinasi nilai, urutan seperti di buku: baris pertama semuanya T.
function logicRows(vars) {
  const rows = [];
  for (let i = 0; i < 2 ** vars.length; i++) {
    const env = {};
    vars.forEach((v, j) => (env[v] = !((i >> (vars.length - 1 - j)) & 1)));
    rows.push(env);
  }
  return rows;
}

const TF = (b) => (b ? 'T' : 'F');
