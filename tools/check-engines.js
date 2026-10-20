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

// FIRST, FOLLOW, tabel LL(1), dan trace: slide Top Down Parsing (sesi 11–13).
const ll = (t) => { const g = gr.parseGrammar(t), tb = gr.ll1TableSteps(g); return { g, tb, ff: tb.ff }; };
const sets = ({ ff }, k) => ff.vars.map((A) => `${A}=${ff.fmt(ff[k].get(A))}`);
const cells = ({ g, tb, ff }) => ff.vars.map((A) => ff.cols.map((c) => (tb.M.get(A).get(c) || []).map((a) => gr.showAlt(g, a)).join('/') || '.').join(' '));
const run = (G, s, panic) => gr.ll1Parse(G.g, G.tb, gr.tokenize(G.g, s), panic);
const ex = ll("E → TE'\nE' → +TE' | ε\nT → FT'\nT' → *FT' | ε\nF → (E) | id");
assert.deepEqual(sets(ex, 'first'), ['E={(, id}', "E'={+, ε}", 'T={(, id}', "T'={*, ε}", 'F={(, id}']);
assert.deepEqual(sets(ex, 'follow'), ['E={), $}', "E'={), $}", 'T={+, ), $}', "T'={+, ), $}", 'F={+, *, ), $}']);
assert.deepEqual(cells(ex), ["TE' . . TE' . .", ". +TE' . . ε ε", "FT' . . FT' . .", ". ε *FT' . ε ε", 'id . . (E) . .']);
const okRun = run(ex, 'id+id');
assert.equal(okRun.rows.length, 13);
assert.ok(okRun.accepted);
assert.equal(run(ex, 'id/id+id').rows.at(-1).X, "T'");
assert.equal(run(ex, 'id*(+id)').rows.at(-1).X, 'E');
const aba = ll('S → aBa\nB → bB | ε');
assert.deepEqual(run(aba, 'abba').rows.filter((r) => r.alt).map((r) => gr.showAlt(aba.g, r.alt)), ['aBa', 'bB', 'bB', 'ε']);
assert.deepEqual(ll('S → iCtSE | a\nE → eS | ε\nC → b').tb.conflicts, [['E', 'e']]);
const pm = ll('S → AbS | e | ε\nA → a | cAd');
assert.deepEqual(sets(pm, 'follow'), ['S={$}', 'A={b, d}']);
assert.deepEqual(run(pm, 'aab', true).rows.map((r) => r.kind), ['expand', 'expand', 'match', 'mismatch', 'expand', 'expand', 'match', 'match', 'expand', 'accept']);
assert.deepEqual(run(pm, 'ceadb', true).rows.find((r) => r.skip).skip, ['e', 'a']);
const lat = ll('S → ABC\nA → aA | C\nB → b\nC → c');
assert.deepEqual(sets(lat, 'follow'), ['S={$}', 'A={b}', 'B={c}', 'C={b, $}']);
assert.equal(run(lat, 'aabc').accepted, false);

// Simulasi Mid Exam (00-mid-exam): jawaban soal 1–6.
assert.equal(au.thompson(au.parseRE('(ab|b)*a')).A.states.length, 12);
const fpS = au.followposSteps(au.parseRE('(a|bb)*ab'));
assert.deepEqual(fpS.follow, [[1, 2, 4], [3], [1, 2, 4], [5], [6], []]);
assert.deepEqual(fpS.steps.at(-1).rows.map(row), ['A={1,2,4}:B,C', 'B={1,2,4,5}:B,D', 'C={3}:∅,A', 'D={3,6}:∅,A']);
const mx = au.parseTable(`0 1
→A C B
B D B
C D B
D E F
E C C
*F E E`);
for (const m of ['table', 'part']) assert.deepEqual(au.minimizeSteps(mx, m).groups.map((g) => g.join('')).sort(), ['AE', 'BC', 'D', 'F']);
assert.deepEqual(au.minimizeSteps(au.parseTable(`a b
→1 2 3
2 2 3
3 4 3
*4 2 3`), 'table').groups.map((g) => g.join('')).sort(), ['12', '3', '4']);
assert.deepEqual(cfg('(ab|c)*b(a|b)*'), ['S → AbB', 'A → abA | cA | ε', 'B → aB | bB | ε']);
assert.deepEqual(lf('S → abS | abA | aB | c\nA → d\nB → e'), ["S → aS' | c", "S' → bS'' | B", "S'' → S | A", 'A → d', 'B → e']);
assert.deepEqual(lr('S → Ab | c\nA → Ad | Sa | e', ['S', 'A']), ['S → Ab | c', "A → caA' | eA'", "A' → dA' | baA' | ε"]);
assert.deepEqual(lr('S → AA | 0\nA → SS | 1', ['S', 'A']), ['S → AA | 0', "A → 0SA' | 1A'", "A' → ASA' | ε"]);
const sim = ll('S → aBDh\nB → cC\nC → bC | ε\nD → EF\nE → g | ε\nF → f | ε');
assert.deepEqual(sets(sim, 'first'), ['S={a}', 'B={c}', 'C={b, ε}', 'D={f, g, ε}', 'E={g, ε}', 'F={f, ε}']);
assert.deepEqual(sets(sim, 'follow'), ['S={$}', 'B={f, g, h}', 'C={f, g, h}', 'D={h}', 'E={f, h}', 'F={h}']);
assert.deepEqual(cells(sim), ['aBDh . . . . . .', '. . cC . . . .', '. bC . ε ε ε .', '. . . EF EF EF .', '. . . ε g ε .', '. . . f . ε .']);
assert.equal(sim.tb.conflicts.length, 0);
assert.equal(run(sim, 'acbgh').rows.length, 13);
assert.ok(run(sim, 'acbgh').accepted);
assert.ok(run(ex, 'id*id').accepted);
