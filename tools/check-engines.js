// Cek mesin viz Compilation technique terhadap jawaban di slide dosen.
// Jalankan: node tools/check-engines.js   (tidak ada output = semua benar)
const assert = require('assert/strict');
const au = require('../_shared/automata.js');

const row = (r) => `${r.name}=${au.showSet(r.set)}:${Object.values(r.trans).join(',')}`;

// RE parser: + dan | sama-sama union, concatenation rapat ke kiri.
assert.equal(au.showRE(au.parseRE('(0+1)*1(0+1)'), '+'), '(0+1)*1(0+1)');
assert.equal(au.showRE(au.parseRE('(a|b)*abb')), '(a|b)*abb');
assert.throws(() => au.parseRE('(b|a)+'), /union/);

// Thompson (gaya Hopcroft): 2 state per simbol, +2 per union/star.
const t = au.thompson(au.parseRE('(0+1)*1(0+1)'));
assert.equal(t.A.states.length, 16);
for (const [s, ok] of [['1', false], ['10', true], ['011', true], ['0110', true], ['0101', false]]) assert.equal(au.accepts(t.A, s), ok, s);

// Subset construction, slide DFA & NFA (Hopcroft 2.3.1 dan 2.5.1).
const ex1 = au.parseTable(`0 1
→p {p,q} {p}
q {r} {r}
r {s} -
*s {s} {s}`);
assert.equal(au.subsetSteps(ex1).rows.length, 8);
const eps = au.parseTable(`ε a b c
→p - {p} {q} {r}
q {p} {q} {r} -
*r {q} {r} - {p}`);
assert.deepEqual(au.subsetSteps(eps).rows.map(row), ['A={p}:A,B,C', 'B={p,q}:B,C,C', 'C={p,q,r}:C,C,C']);
// ε-NFA bilangan desimal (slide 25–33): 6 state DFA.
const dec = au.parseTable(`ε + - . d
→q0 {q1} {q1} {q1} - -
q1 - - - {q2} {q1,q4}
q2 - - - - {q3}
q3 {q5} - - - {q3}
q4 - - - {q3} -
*q5 - - - - -`);
assert.deepEqual(au.subsetSteps(dec).rows.map((r) => au.showSet(r.set)), ['{q0,q1}', '{q1}', '{q2}', '{q1,q4}', '{q3,q5}', '{q2,q3,q5}']);
const tr = au.traceSteps(dec, '5.6'.replace(/\d/g, 'd'));
assert.equal(tr[tr.length - 1].verdict, true);
assert.equal(au.traceSteps(dec, '-dd').pop().verdict, false);

// RE → DFA langsung, slide RE to DFA: (a|b)*abb → 4 state, followpos seperti di slide.
const f = au.followposSteps(au.parseRE('(a|b)*abb'));
assert.deepEqual(f.follow, [[1, 2, 3], [1, 2, 3], [4], [5], [6], []]);
assert.deepEqual(f.steps.at(-1).rows.map(row), ['A={1,2,3}:B,A', 'B={1,2,3,4}:B,C', 'C={1,2,3,5}:B,D', 'D={1,2,3,6}:B,A']);
const f2 = au.followposSteps(au.parseRE('(a|ε)bc*'));
assert.deepEqual(f2.follow, [[2], [3, 4], [3, 4], []]);

// Minimisasi, slide DFA Minimization: contoh Hopcroft A–H → {A,E} {B,H} {C} {D,F} {G}.
const hop = au.parseTable(`0 1
→A B F
B G C
*C A C
D C G
E H F
F C G
G G E
H G C`);
for (const m of ['table', 'part']) assert.deepEqual(au.minimizeSteps(hop, m).groups.map((g) => g.join('')).sort(), ['AE', 'BH', 'C', 'DF', 'G']);
const four = au.parseTable(`a b
→1 2 3
2 2 3
3 4 3
*4 2 3`);
assert.deepEqual(au.minimizeSteps(four, 'part').groups.map((g) => g.join('')).sort(), ['12', '3', '4']);

// Grammar: jawaban slide Context-Free Grammar dan Parsing Fundamentals.
const gr = require('../_shared/grammar.js');
const pr = (g) => gr.showGrammar(g).map((r) => `${r.A} → ${r.alts.join(' | ')}`);
const lf = (t) => pr(gr.leftFactorSteps(gr.parseGrammar(t)).at(-1).g);
const lr = (t, o) => pr(gr.leftRecursionSteps(gr.parseGrammar(t), o).at(-1).g);
assert.deepEqual(lf('A → abB | aB | cdg | cdeB | cdfB | h'), ["A → aA' | cdA'' | h", "A' → bB | B", "A'' → g | eB | fB"]);
assert.deepEqual(lf('A → ad | a | ab | abc | b'), ["A → aA' | b", "A' → d | ε | bA''", "A'' → ε | c"]);
assert.deepEqual(lr('S → Aa | b\nA → Ac | Sd | f'), ['S → Aa | b', "A → bdA' | fA'", "A' → cA' | adA' | ε"]);
assert.deepEqual(lr('S → Aa | b\nA → Ac | Sd | f', ['A', 'S']), ["S → fA'aS' | bS'", "S' → dA'aS' | ε", "A → SdA' | fA'", "A' → cA' | ε"]);
assert.deepEqual(lr('E → E+T | T\nT → T*F | F\nF → id | (E)'), ["E → TE'", "E' → +TE' | ε", "T → FT'", "T' → *FT' | ε", 'F → id | (E)']);
const cfg = (r) => pr(gr.reToCFG(au.parseRE(r)).g);
assert.deepEqual(cfg('(ab+ba)*(abb)*'), ['S → AB', 'A → abA | baA | ε', 'B → abbB | ε']);
const trees = (t, s) => { const g = gr.parseGrammar(t); return gr.findTrees(g, g.order[0], gr.tokenize(g, s)).trees.length; };
assert.equal(trees('E → E+T | T\nT → T*F | F\nF → (E) | id', 'id+id*id'), 1);
assert.equal(trees('E → E+E | E*E | (E) | id', 'id+id*id'), 2);
assert.equal(trees('S → AB | C\nA → aAb | ab\nB → cBd | cd\nC → aCd | aDd\nD → bDc | bc', 'aabbccdd'), 2);
