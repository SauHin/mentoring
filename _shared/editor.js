// Editor admin: ubah isi notes, slide, dan halaman daftar langsung di halaman, lalu simpan sebagai commit ke GitHub.
// Login = fine-grained token GitHub milik admin (hanya repo ini, izin Contents: Read and write), disimpan di
// localStorage perangkat ini. Buka halaman mana saja dengan ?admin untuk login. Tanpa token, halaman hanya bisa
// dilihat: pengunjung tidak bisa menyimpan, karena GitHub menolak tulisan tanpa izin.
// Yang bisa diedit: blok teks paling dalam (judul, paragraf, poin, sel tabel, summary, keterangan, blok kode).
// Gambar dari mesin viz (.au-fig) dan halaman viz tidak bisa diedit.
// Toolbar format seperti Notion: ubah jenis blok, warna teks dan latar, tebal, miring, garis bawah, coret, kode, link.
// Simpan hanya menulis ulang blok yang berubah di file sumber. Blok dicari lewat posisinya di pohon HTML
// (tag dan urutannya), lalu teks aslinya dicocokkan dengan versi di GitHub, supaya tidak menimpa bagian yang salah.
(function () {
  if (parent !== window || document.body.classList.contains('viz')) return;
  const REPO = 'SauHin/mentoring', BRANCH = 'master', KEY = 'mentoring-admin-token', RECENT = 'mentoring-editor-recent';
  const API = `https://api.github.com/repos/${REPO}`;
  const BLOCKS = 'h1, h2, h3, h4, p, li, td, th, dt, dd, figcaption, summary, pre, span.judul';
  const SKIP = '.au-fig, svg, iframe, nav.toc, .toc-pop, .topbar, .toolbar, .reveal-bar, button, dialog, .edit-ui';
  const ROOTS = 'body > header, body > main, body > article, body > section.slide';

  const local = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} return null; };
  let token = local(KEY);

  // Path file di repo, dari alamat halaman relatif ke root situs (folder di atas _shared).
  const site = new URL('../', document.querySelector('link[href*="style.css"]').href);
  let file = decodeURIComponent(location.pathname.slice(site.pathname.length));
  if (!file || file.endsWith('/')) file += 'index.html';

  /* ---------- Blok yang bisa diedit dan posisinya ---------- */
  function blocks() {
    const out = [];
    document.querySelectorAll(ROOTS).forEach((root) => root.querySelectorAll(BLOCKS).forEach((el) => {
      if (el.closest(SKIP) || el.querySelector(`${BLOCKS}, .au-fig, svg, iframe`)) return; // hanya blok paling dalam
      if (el.matches('pre') && el.querySelector('.blk')) return; // full code bertahap (notes.js) sudah diubah bentuknya
      out.push(el);
    }));
    return out;
  }
  // "html:1/body:1/main:1/section:3/details:1/p:2": tag dan urutan di antara saudara dengan tag yang sama.
  function pathOf(el) {
    const parts = [];
    for (let n = el; n; n = n.parentElement) {
      let i = 1;
      for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.localName === n.localName) i++;
      parts.unshift(`${n.localName}:${i}`);
    }
    return parts.join('/');
  }
  // Posisi setiap elemen di teks sumber (isi: start–end, seluruh tag: outerStart–outerEnd), dengan path yang sama
  // seperti pathOf. Sumber ditulis rapi (semua tag ditutup), jadi cukup meniru tbody yang disisipkan browser di <table>.
  const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
  const RAW = new Set(['script', 'style', 'textarea', 'title']);
  function indexSource(src) {
    const map = new Map(), stack = [{ tag: '', key: '', counts: new Map() }];
    const open = (tag, at, outer) => {
      const top = stack[stack.length - 1], c = (top.counts.get(tag) || 0) + 1;
      top.counts.set(tag, c);
      stack.push({ tag, key: `${top.key ? top.key + '/' : ''}${tag}:${c}`, counts: new Map(), start: at, outerStart: outer });
    };
    const close = (at, outerEnd) => { const n = stack.pop(); map.set(n.key, { start: n.start, end: at, outerStart: n.outerStart, outerEnd }); };
    let i = 0;
    while (i < src.length) {
      const lt = src.indexOf('<', i);
      if (lt < 0) break;
      if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
      const m = /^<(\/?)([a-zA-Z][\w:-]*)/.exec(src.slice(lt, lt + 64));
      if (!m) { i = src[lt + 1] === '!' ? src.indexOf('>', lt) + 1 : lt + 1; continue; }
      let j = lt + m[0].length, q = null; // ujung tag = '>' pertama di luar tanda kutip
      for (; j < src.length; j++) { const ch = src[j]; if (q) { if (ch === q) q = null; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '>') break; }
      const tag = m[2].toLowerCase();
      i = j + 1;
      if (m[1]) {
        const k = stack.map((n) => n.tag).lastIndexOf(tag);
        if (k > 0) { while (stack.length > k + 1) close(lt, lt); close(lt, i); }
        continue;
      }
      if (tag === 'tr' && stack[stack.length - 1].tag === 'table') open('tbody', lt, lt);
      open(tag, i, lt);
      if (VOID.has(tag) || src[j - 1] === '/') close(i, i);
      else if (RAW.has(tag)) {
        const e = src.toLowerCase().indexOf(`</${tag}`, i);
        i = src.indexOf('>', e) + 1;
        close(e, i);
      }
    }
    return map;
  }

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  function textOf(html) { const t = document.createElement('template'); t.innerHTML = html; return norm(t.content.textContent); }
  const unwrap = (n) => { const kids = [...n.childNodes]; n.replaceWith(...kids); return kids; };
  const FMT = 'b, strong, i, em, u, s, strike, del, mark, code, a, span[class^="tx-"]'; // format inline
  const STYLES = 'b, strong, i, em, u, s, strike, del, mark, code, span[class^="tx-"]'; // yang dihapus Tx (link tetap)
  // Nama jenis blok: tag dan class, tanpa class sementara editor.
  const tagOf = (el) => [el.localName, ...[...el.classList].filter((c) => !c.startsWith('edit-'))].join('.');
  // HTML yang ditulis ke file: buang warna sintaks (theme.js), style dari browser, span kosong, dan gabungkan
  // format sama yang bersebelahan (<strong>a</strong><strong>b</strong> jadi satu).
  function clean(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('span[class^="sx-"], span:not([class]), font').forEach(unwrap);
    c.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
    c.querySelectorAll(FMT).forEach((n) => {
      if (!n.textContent) return n.remove();
      for (let nx = n.nextSibling; nx && nx.nodeType === 1 && nx.localName === n.localName && nx.className === n.className && nx.getAttribute('href') === n.getAttribute('href'); nx = n.nextSibling) {
        n.append(...nx.childNodes);
        nx.remove();
      }
    });
    let h = c.innerHTML.replace(/ |&nbsp;/g, ' ');
    if (el.matches('pre')) h = h.replace(/<br>/g, '\n'); // Enter di blok kode: browser menyisipkan <br>, file menyimpan baris baru
    else h = h.replace(/(<br>\s*)+$/, '');
    return h;
  }
  function outer(el) {
    const cls = [...el.classList].filter((c) => !c.startsWith('edit-')).join(' ');
    return `<${el.localName}${el.id ? ` id="${el.id}"` : ''}${cls ? ` class="${cls}"` : ''}>${clean(el)}</${el.localName}>`;
  }

  /* ---------- GitHub ---------- */
  async function gh(path, opt = {}) {
    const r = await fetch(API + path, { ...opt, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    if (!r.ok) {
      const why = r.status === 401 ? 'token tidak valid atau sudah kedaluwarsa'
        : r.status === 403 || r.status === 404 ? 'token tidak punya akses Contents: Read and write ke repo ini'
          : r.status === 409 ? 'file berubah di GitHub saat menyimpan, coba simpan lagi' : `GitHub menjawab ${r.status}`;
      throw new Error(why);
    }
    return r.json();
  }
  const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  function toB64(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
    return btoa(bin);
  }
  const contentsUrl = `/contents/${file.split('/').map(encodeURIComponent).join('/')}`;

  /* ---------- Login dan bar admin ---------- */
  const ui = (html, cls) => { const d = document.createElement('div'); d.className = `edit-ui ${cls}`; d.innerHTML = html; document.body.append(d); return d; };

  function login() {
    const dlg = document.createElement('dialog');
    dlg.className = 'edit-ui edit-login';
    dlg.innerHTML = `<form method="dialog">
      <h2>Login admin</h2>
      <p>Tempel <strong>fine-grained token</strong> GitHub untuk repo <code>${REPO}</code> dengan izin <strong>Contents: Read and write</strong>. Token hanya disimpan di browser ini.</p>
      <p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Buat token di GitHub</a></p>
      <label class="edit-field">Token<input type="password" class="field" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></label>
      <p class="edit-msg" aria-live="polite"></p>
      <div class="ops"><button class="btn" value="cancel">Batal</button><button class="btn btn-go" value="ok">Masuk</button></div>
    </form>`;
    document.body.append(dlg);
    const input = dlg.querySelector('input'), msg = dlg.querySelector('.edit-msg');
    dlg.querySelector('form').addEventListener('submit', async (e) => {
      if (e.submitter && e.submitter.value === 'cancel') return;
      e.preventDefault();
      token = input.value.trim();
      msg.textContent = 'Mengecek token…';
      try {
        await gh('');
        local(KEY, token);
        dlg.close();
        bar();
      } catch (err) { token = null; msg.textContent = `Gagal: ${err.message}.`; }
    });
    dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal();
  }

  let editing = false, panel, tools;
  const state = new Map(); // elemen → { key, raw, base, text, tag, node0 }

  function bar() {
    panel = ui('', 'edit-bar');
    render();
    panel.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]') && e.target.closest('[data-k]').dataset.k;
      if (k === 'edit') start();
      if (k === 'save') save();
      if (k === 'done') stop();
      if (k === 'logout' && confirm('Keluar dari mode admin di browser ini? Token akan dihapus dari browser ini.')) { local(KEY, null); token = null; stop(true); panel.remove(); }
    });
  }
  function render(msg) {
    const n = dirty().length;
    panel.innerHTML = editing
      ? `<span class="label">${msg || (n ? `${n} blok berubah` : 'Klik teks untuk mengubah')}</span>
         <button class="btn btn-go btn-sm" data-k="save"${n ? '' : ' disabled'}>Simpan</button>
         <button class="btn btn-sm" data-k="done">Selesai</button>`
      : `<span class="label">${msg || 'Admin'}</span>
         <button class="btn btn-go btn-sm" data-k="edit">Edit halaman</button>
         <button class="btn btn-sm" data-k="logout">Keluar</button>`;
  }
  const isDirty = (el, s) => clean(el) !== s.base || tagOf(el) !== s.tag;
  const dirty = () => [...state].filter(([el, s]) => isDirty(el, s));

  function start() {
    editing = true;
    document.documentElement.classList.add('editing');
    blocks().forEach((el) => {
      if (!state.has(el)) state.set(el, { key: pathOf(el), raw: el.innerHTML, base: clean(el), text: norm(el.textContent), tag: tagOf(el), node0: el });
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
    tools = tools || toolbar();
    render();
  }
  function stop(force) {
    const d = dirty();
    if (!force && d.length && !confirm(`${d.length} blok belum disimpan. Buang perubahan itu?`)) return;
    d.forEach(([el, s]) => {
      const n = s.node0;
      if (n !== el) { el.replaceWith(n); state.delete(el); state.set(n, s); } // jenis blok diubah: kembalikan elemen asli
      n.innerHTML = s.raw;
      n.classList.remove('edit-changed', 'edit-bad');
    });
    state.forEach((s, el) => el.removeAttribute('contenteditable'));
    editing = false;
    document.documentElement.classList.remove('editing');
    closePops();
    if (tools) tools.hidden = true;
    if (panel && panel.isConnected) render();
  }
  function changed(el) {
    const s = state.get(el);
    if (!s) return;
    el.classList.toggle('edit-changed', isDirty(el, s));
    el.classList.remove('edit-bad');
    render();
  }

  /* ---------- Toolbar format (seperti Notion) ---------- */
  const COLORS = [['', 'Default'], ['abu', 'Abu-abu'], ['coklat', 'Coklat'], ['oranye', 'Oranye'], ['kuning', 'Kuning'], ['hijau', 'Hijau'], ['biru', 'Biru'], ['ungu', 'Ungu'], ['pink', 'Pink'], ['merah', 'Merah']];
  // Latar kuning, hijau, biru, dan pink = stabilo gaya.css yang artinya tetap (legenda di header notes).
  const MARK = { kuning: ['', 'istilah baru'], hijau: ['kaitan', 'kaitan'], biru: ['kunci', 'wajib diingat'], pink: ['jebakan', 'jebakan'] };
  const markCls = (c) => (MARK[c] ? MARK[c][0] : c);
  const TURN = [['p', '', 'Teks'], ['h3', '', 'Judul 3'], ['h4', '', 'Judul 4'], ['p', 'intinya', 'Intinya 🔑']];
  const BLOCKNAME = { li: 'Poin', td: 'Sel tabel', th: 'Kepala tabel', h1: 'Judul 1', h2: 'Judul 2', summary: 'Toggle', pre: 'Kode', figcaption: 'Keterangan', dt: 'Istilah', dd: 'Penjelasan', span: 'Judul langkah' };
  const KIND = { bold: ['strong', 'b, strong'], italic: ['i', 'i, em'], underline: ['u', 'u'], strike: ['s', 's, strike, del'], code: ['code', 'code'] };
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

  function toolbar() {
    const t = ui(`<div class="row">
        <button class="tool turn" data-a="turn" title="Ubah jenis blok"><span class="nm"></span>${icon('M9 6l6 6-6 6')}</button>
        <span class="sep"></span>
        <button class="tool" data-a="color" title="Warna teks dan latar"><span class="a">A</span></button>
        <button class="tool" data-a="bold" title="Tebal (Ctrl+B)"><strong>B</strong></button>
        <button class="tool" data-a="italic" title="Miring (Ctrl+I)"><i>I</i></button>
        <button class="tool" data-a="underline" title="Garis bawah (Ctrl+U)"><u>U</u></button>
        <button class="tool" data-a="strike" title="Coret (Ctrl+Shift+S)"><s>S</s></button>
        <button class="tool" data-a="code" title="Kode (Ctrl+E)">${icon('M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14')}</button>
        <button class="tool" data-a="link" title="Link (Ctrl+K)">${icon('M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1')}</button>
        <button class="tool" data-a="clear" title="Hapus format">T<sub>x</sub></button>
      </div>
      <div class="edit-pop menu" data-p="turn" hidden>${TURN.map(([, , n], i) => `<button class="item" data-turn="${i}">${n}</button>`).join('')}</div>
      <div class="edit-pop" data-p="color" hidden></div>
      <form class="edit-pop link" data-p="link" hidden><input class="field" type="text" spellcheck="false" autocomplete="off" placeholder="https://… atau ../folder/notes.html">
        <button class="btn btn-go btn-sm">Pasang</button><button type="button" class="btn btn-sm" data-unlink>Hapus link</button></form>`, 'edit-tools');
    t.hidden = true;
    t.addEventListener('mousedown', (e) => { if (!e.target.closest('input')) e.preventDefault(); }); // seleksi teks jangan hilang
    t.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a) act(b.dataset.a);
      else if (b.dataset.turn) turn(TURN[b.dataset.turn]);
      else if (b.dataset.c !== undefined) paint(b.dataset.c);
      else if ('unlink' in b.dataset) link('');
    });
    t.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); link(t.querySelector('form input').value.trim()); });
    return t;
  }

  const hostOf = (node) => (node && (node.nodeType === 1 ? node : node.parentElement)?.closest('[contenteditable="true"]')) || null;
  let saved = null; // range teks yang diseleksi, disimpan saat pop (warna, link, jenis blok) terbuka
  const pinned = () => tools && !!tools.querySelector('.edit-pop:not([hidden])');
  function cur() {
    let r = saved;
    if (!r) { const s = getSelection(); r = s.rangeCount ? s.getRangeAt(0) : null; }
    const host = r && hostOf(r.commonAncestorContainer);
    return host && state.has(host) ? { r, host } : null;
  }
  function closePops() {
    if (!tools) return;
    tools.querySelectorAll('.edit-pop').forEach((p) => (p.hidden = true));
    if (saved) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); }
    saved = null;
  }
  function textsIn(r, host) {
    const out = [], w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (n.data.trim() && r.intersectsNode(n)) out.push(n);
    return out;
  }
  const within = (n, sel, host) => { const e = n.parentElement.closest(sel); return e && e !== host && host.contains(e) ? e : null; };
  const isOn = (sel, r, host) => { const ns = textsIn(r, host); return ns.length > 0 && ns.every((n) => within(n, sel, host)); };

  function place() {
    if (!tools || pinned()) return; // pop terbuka: toolbar diam di tempat
    const sel = getSelection();
    const host = editing && sel.rangeCount && !sel.isCollapsed && hostOf(sel.anchorNode);
    tools.hidden = !host || host !== hostOf(sel.focusNode);
    if (tools.hidden) return;
    sync();
    const r = sel.getRangeAt(0).getBoundingClientRect();
    tools.style.top = `${Math.max(8, r.top - tools.offsetHeight - 8)}px`;
    tools.style.left = `${Math.max(8, Math.min(innerWidth - tools.offsetWidth - 8, r.left + r.width / 2 - tools.offsetWidth / 2))}px`;
  }
  // Tombol yang aktif (seperti Notion): format yang sudah menutupi seluruh seleksi, jenis blok, dan warna teks.
  function sync() {
    const c = cur();
    if (!c) return;
    Object.entries(KIND).forEach(([k, [, sel]]) => tools.querySelector(`[data-a="${k}"]`).classList.toggle('on', isOn(sel, c.r, c.host)));
    tools.querySelector('[data-a="link"]').classList.toggle('on', isOn('a', c.r, c.host));
    const can = c.host.matches('p, h3, h4'), now = TURN.find(([tag, cls]) => tagOf(c.host) === (cls ? `${tag}.${cls}` : tag));
    const turnBtn = tools.querySelector('[data-a="turn"]');
    turnBtn.disabled = !can;
    turnBtn.querySelector('.nm').textContent = now ? now[2] : can ? 'Teks' : BLOCKNAME[c.host.localName] || 'Teks';
    const first = textsIn(c.r, c.host)[0], tx = first && within(first, 'span[class^="tx-"]', c.host);
    tools.querySelector('.a').className = `a ${tx ? tx.className : ''}`;
  }

  // Undo untuk format: Ctrl+Z setelah klik toolbar mengembalikan isi blok sebelum format itu.
  // Begitu ada ketikan baru, Ctrl+Z kembali memakai undo bawaan browser.
  const undoStack = [];
  const snap = (host) => undoStack.push([host, host.innerHTML]);

  // Bungkus isi seleksi dengan span sementara, supaya bisa diformat ulang lalu diseleksi lagi.
  function hold(r) { const t = document.createElement('span'); t.append(r.extractContents()); r.insertNode(t); return t; }
  // Keluarkan node dari setiap leluhur yang cocok dengan sel: leluhur dipecah menjadi bagian sebelum dan sesudah node.
  function lift(node, sel, host) {
    for (let A = node.parentElement.closest(sel); A && A !== host && host.contains(A); A = node.parentElement.closest(sel)) {
      const before = document.createRange(), after = document.createRange();
      before.setStart(A, 0);
      before.setEndBefore(node);
      after.setStartAfter(node);
      after.setEnd(A, A.childNodes.length);
      const b = A.cloneNode(false), a = A.cloneNode(false);
      b.append(before.extractContents());
      a.append(after.extractContents());
      if (b.textContent) A.before(b);
      if (a.textContent) A.after(a);
      unwrap(A);
    }
  }
  // Format ulang seleksi: hapus format sel dari isi seleksi, lalu (kalau wrap ada) bungkus dengan elemen baru.
  function reformat(sel, wrap) {
    const c = cur();
    if (!c || c.r.collapsed) return;
    snap(c.host);
    const t = hold(c.r);
    t.querySelectorAll(sel).forEach(unwrap);
    lift(t, sel, c.host);
    if (wrap) { t.before(wrap); wrap.append(t); }
    const kids = unwrap(t);
    c.host.querySelectorAll(FMT).forEach((n) => { if (!n.textContent) n.remove(); }); // sisa pecahan yang kosong
    saved = null;
    if (kids.length) {
      const nr = document.createRange();
      nr.setStartBefore(kids[0]);
      nr.setEndAfter(kids[kids.length - 1]);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(nr);
    }
    changed(c.host);
    closePops();
    place();
  }
  const make = (tag, cls, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };

  function act(a) {
    const c = cur();
    if (!c) return;
    if (KIND[a]) { const [tag, sel] = KIND[a]; reformat(sel, isOn(sel, c.r, c.host) ? null : make(tag)); }
    else if (a === 'clear') reformat(STYLES, null);
    else openPop(a);
  }
  function openPop(p) {
    const c = cur();
    if (!c) return;
    const pop = tools.querySelector(`[data-p="${p}"]`), wasOpen = !pop.hidden;
    tools.querySelectorAll('.edit-pop').forEach((x) => (x.hidden = true));
    if (wasOpen) return closePops();
    saved = c.r.cloneRange();
    if (p === 'color') colorPanel(pop);
    if (p === 'turn') pop.querySelectorAll('[data-turn]').forEach((b) => { const [tag, cls] = TURN[b.dataset.turn]; b.classList.toggle('on', tagOf(c.host) === (cls ? `${tag}.${cls}` : tag)); });
    pop.hidden = false;
    if (p === 'link') {
      const first = textsIn(c.r, c.host)[0], a = first && within(first, 'a', c.host);
      const input = pop.querySelector('input');
      input.value = a ? a.getAttribute('href') : '';
      pop.querySelector('[data-unlink]').hidden = !a;
      input.focus();
      input.select();
    }
    const r = tools.getBoundingClientRect(); // pop melebihi bawah layar: naikkan toolbar
    if (r.bottom > innerHeight - 8) tools.style.top = `${Math.max(8, innerHeight - 8 - r.height)}px`;
  }
  const recent = () => { try { return JSON.parse(local(RECENT) || '[]'); } catch (e) { return []; } };
  function colorPanel(pop) {
    const btn = (v) => {
      const [k, c] = v.split(':'), name = COLORS.find(([x]) => x === c)[1];
      const title = `${k === 't' ? 'Teks' : 'Latar'} ${name.toLowerCase()}${k === 'b' && MARK[c] ? ` (stabilo ${MARK[c][1]})` : ''}`;
      const inner = k === 't' ? `<span class="${c ? `tx-${c}` : ''}">A</span>` : `<mark class="${c ? markCls(c) : 'none'}"></mark>`;
      return `<button class="sw" data-c="${v}" title="${title}" aria-label="${title}">${inner}</button>`;
    };
    const rec = recent();
    pop.innerHTML = (rec.length ? `<h5>Terakhir dipakai</h5><div class="sws">${rec.map(btn).join('')}</div>` : '')
      + `<h5>Warna teks</h5><div class="sws">${COLORS.map(([c]) => btn(`t:${c}`)).join('')}</div>`
      + `<h5>Warna latar</h5><div class="sws">${COLORS.map(([c]) => btn(`b:${c}`)).join('')}</div>`;
  }
  function paint(v) {
    const [k, c] = v.split(':');
    if (c) local(RECENT, JSON.stringify([v, ...recent().filter((x) => x !== v)].slice(0, 5)));
    if (k === 't') reformat('span[class^="tx-"]', c ? make('span', `tx-${c}`) : null);
    else reformat('mark', c ? make('mark', markCls(c)) : null);
  }
  function link(url) {
    if (url && !/^(https?:|mailto:|#|\/|\.)/i.test(url)) url = `https://${url}`; // tanpa skema: anggap web. javascript: tidak lolos
    reformat('a', url ? make('a', '', { href: url }) : null);
  }
  function turn([tag, cls]) {
    const c = cur();
    if (!c || !c.host.matches('p, h3, h4')) return;
    const old = c.host, n = make(tag, cls);
    if (old.id) n.id = old.id;
    n.innerHTML = old.innerHTML;
    n.contentEditable = 'true';
    n.spellcheck = false;
    const s = state.get(old);
    state.delete(old);
    state.set(n, s);
    saved = null;
    old.replaceWith(n);
    changed(n);
    closePops();
    tools.hidden = true;
  }

  /* ---------- Simpan ---------- */
  async function save() {
    const d = dirty();
    if (!d.length) return;
    render('Menyimpan…');
    panel.querySelectorAll('button').forEach((b) => (b.disabled = true));
    try {
      const res = await gh(`${contentsUrl}?ref=${BRANCH}`);
      const src = fromB64(res.content), map = indexSource(src), edits = [], bad = [];
      d.forEach(([el, s]) => {
        const at = map.get(s.key);
        if (!at || textOf(src.slice(at.start, at.end)) !== s.text) return bad.push(el);
        // Jenis blok berubah (misalnya p jadi h3): tulis ulang seluruh tag. Kalau tidak, isinya saja.
        if (tagOf(el) !== s.tag) edits.push({ start: at.outerStart, end: at.outerEnd, html: outer(el) });
        else edits.push({ start: at.start, end: at.end, html: clean(el) });
      });
      let out = src;
      edits.sort((a, b) => b.start - a.start).forEach((e) => { out = out.slice(0, e.start) + e.html + out.slice(e.end); });
      if (edits.length) {
        await gh(contentsUrl, { method: 'PUT', body: JSON.stringify({ message: `Edit ${file} lewat web`, content: toB64(out), sha: res.sha, branch: BRANCH }) });
        // File di GitHub sekarang sama dengan halaman (kecuali blok merah), jadi posisi semua blok dihitung ulang.
        state.forEach((s, el) => {
          s.key = pathOf(el);
          if (bad.includes(el)) return;
          Object.assign(s, { raw: el.innerHTML, base: clean(el), text: norm(el.textContent), tag: tagOf(el), node0: el });
          el.classList.remove('edit-changed');
        });
      }
      bad.forEach((el) => el.classList.add('edit-bad'));
      render(!bad.length ? 'Tersimpan. Situs ter-update dalam ±1–2 menit.'
        : `${edits.length ? `${edits.length} blok tersimpan. ` : ''}${bad.length} blok merah tidak disimpan, karena berbeda dengan versi di GitHub. Salin isinya, muat ulang halaman, lalu edit lagi.`);
    } catch (err) {
      render(`Gagal menyimpan: ${err.message}.`);
    }
  }

  /* ---------- Perilaku selama mode edit ---------- */
  document.addEventListener('selectionchange', place);
  addEventListener('scroll', () => { if (!pinned()) place(); }, { passive: true });
  document.addEventListener('input', (e) => { const h = hostOf(e.target); if (editing && h) { undoStack.length = 0; changed(h); } });
  document.addEventListener('mousedown', (e) => { if (pinned() && !e.target.closest('.edit-tools')) { saved = null; closePops(); } });
  document.addEventListener('keydown', (e) => {
    if (!editing) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === 'escape' && pinned()) { e.preventDefault(); closePops(); return place(); }
    const host = hostOf(e.target);
    if (!host) return;
    const hot = { b: 'bold', i: 'italic', u: 'underline', e: 'code' };
    if (mod && !e.shiftKey && hot[k]) { e.preventDefault(); act(hot[k]); }
    else if (mod && e.shiftKey && k === 's') { e.preventDefault(); act('strike'); }
    else if (mod && !e.shiftKey && k === 'k') { e.preventDefault(); place(); openPop('link'); }
    else if (mod && !e.shiftKey && k === 's') { e.preventDefault(); save(); }
    else if (mod && !e.shiftKey && k === 'z' && undoStack.length && undoStack[undoStack.length - 1][0] === host) {
      e.preventDefault();
      host.innerHTML = undoStack.pop()[1];
      changed(host);
    } else if (k === 'enter') {
      // Enter tidak membuat blok baru: di kode jadi baris baru, di paragraf jadi <br>, di judul diabaikan.
      e.preventDefault();
      if (host.matches('pre')) document.execCommand('insertText', false, '\n');
      else if (!host.matches('h1, h2, h3, h4, summary, th, dt, span.judul')) document.execCommand('insertLineBreak');
    }
  }, true);
  document.addEventListener('paste', (e) => {
    const host = editing && hostOf(e.target);
    if (!host) return;
    e.preventDefault(); // tempel sebagai teks biasa, tanpa format dari halaman lain
    const t = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, host.matches('pre') ? t : t.replace(/\s*\n\s*/g, ' '));
  });
  // Klik teks di dalam summary atau link: edit, bukan buka toggle atau pindah halaman.
  // Segitiga toggle ada di kiri isi summary, jadi klik di sana tetap membuka atau menutup.
  document.addEventListener('click', (e) => {
    if (!editing || !hostOf(e.target)) return;
    const s = e.target.closest('summary');
    if (e.target.closest('a') || (s && e.clientX > s.getBoundingClientRect().left)) e.preventDefault();
  }, true);
  addEventListener('beforeunload', (e) => { if (editing && dirty().length) e.preventDefault(); });

  if (token) bar();
  else if (new URLSearchParams(location.search).has('admin')) login();
  window.mentoringEditor = { blocks, pathOf, indexSource, textOf, clean, norm }; // untuk cek otomatis
})();
