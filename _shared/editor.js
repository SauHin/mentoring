// Editor admin: ubah isi notes, slide, dan halaman daftar langsung di halaman, lalu simpan sebagai commit ke GitHub.
// Login = fine-grained token GitHub milik admin (hanya repo ini, izin Contents: Read and write), disimpan di
// localStorage perangkat ini. Buka halaman mana saja dengan ?admin untuk login. Tanpa token, halaman hanya bisa
// dilihat: pengunjung tidak bisa menyimpan, karena GitHub menolak tulisan tanpa izin.
// Yang bisa diedit: blok teks paling dalam (judul, paragraf, poin, sel tabel, summary, keterangan, blok kode).
// Gambar dari mesin viz (.au-fig) dan halaman viz tidak bisa diedit.
// Simpan hanya menulis ulang isi blok yang berubah di file sumber. Blok dicari lewat posisinya di pohon HTML
// (tag dan urutannya), lalu teks aslinya dicocokkan dengan versi di GitHub, supaya tidak menimpa bagian yang salah.
(function () {
  if (parent !== window || document.body.classList.contains('viz')) return;
  const REPO = 'SauHin/mentoring', BRANCH = 'master', KEY = 'mentoring-admin-token';
  const API = `https://api.github.com/repos/${REPO}`;
  const BLOCKS = 'h1, h2, h3, h4, p, li, td, th, dt, dd, figcaption, summary, pre, span.judul';
  const SKIP = '.au-fig, svg, iframe, nav.toc, .toc-pop, .topbar, .toolbar, .reveal-bar, button, dialog, .edit-ui';
  const ROOTS = 'body > header, body > main, body > article, body > section.slide';

  const store = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) {}

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
  // Posisi isi setiap elemen di teks sumber, dengan path yang sama seperti pathOf di DOM.
  // Sumber ditulis rapi (semua tag ditutup), jadi cukup meniru tbody yang disisipkan browser di dalam <table>.
  const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
  const RAW = new Set(['script', 'style', 'textarea', 'title']);
  function indexSource(src) {
    const map = new Map(), stack = [{ tag: '', key: '', counts: new Map() }];
    const open = (tag, at) => {
      const top = stack[stack.length - 1], c = (top.counts.get(tag) || 0) + 1;
      top.counts.set(tag, c);
      const n = { tag, key: `${top.key ? top.key + '/' : ''}${tag}:${c}`, counts: new Map(), start: at };
      stack.push(n);
      return n;
    };
    const close = (at) => { const n = stack.pop(); map.set(n.key, { start: n.start, end: at }); };
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
        if (k > 0) while (stack.length > k) close(lt);
        continue;
      }
      if (tag === 'tr' && stack[stack.length - 1].tag === 'table') open('tbody', lt);
      open(tag, i);
      if (VOID.has(tag) || src[j - 1] === '/') close(i);
      else if (RAW.has(tag)) {
        const e = src.toLowerCase().indexOf(`</${tag}`, i);
        close(e);
        i = src.indexOf('>', e) + 1;
      }
    }
    return map;
  }

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  function textOf(html) { const t = document.createElement('template'); t.innerHTML = html; return norm(t.content.textContent); }
  const unwrap = (n) => { const kids = [...n.childNodes]; n.replaceWith(...kids); return kids; };
  const FMT = 'b, strong, i, em, mark, code, u'; // format inline dari toolbar dan dari sumber
  // HTML yang ditulis ke file: buang warna sintaks (theme.js), style dari browser, dan span kosong.
  function clean(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('span[class^="sx-"], span:not([class]), font').forEach(unwrap);
    c.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
    c.querySelectorAll(FMT).forEach((n) => { if (!n.textContent) n.remove(); }); // format kosong
    let h = c.innerHTML.replace(/\u00a0|&nbsp;/g, ' ');
    if (el.matches('pre')) h = h.replace(/<br>/g, '\n'); // Enter di blok kode: browser menyisipkan <br>, file menyimpan baris baru
    else h = h.replace(/(<br>\s*)+$/, '');
    return h;
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

  /* ---------- Tampilan: login, bar admin, toolbar format ---------- */
  const ui = (html, cls) => { const d = document.createElement('div'); d.className = `edit-ui ${cls}`; d.innerHTML = html; document.body.append(d); return d; };

  function login() {
    const dlg = document.createElement('dialog');
    dlg.className = 'edit-ui edit-login';
    dlg.innerHTML = `<form method="dialog">
      <h2>Login admin</h2>
      <p>Tempel <b>fine-grained token</b> GitHub untuk repo <code>${REPO}</code> dengan izin <b>Contents: Read and write</b>. Token hanya disimpan di browser ini.</p>
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
        store(token);
        dlg.close();
        bar();
      } catch (err) { token = null; msg.textContent = `Gagal: ${err.message}.`; }
    });
    dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal();
  }

  let editing = false, panel, tools;
  const state = new Map(); // elemen → { key, raw, base, text }

  function bar() {
    panel = ui('', 'edit-bar');
    render();
    panel.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]') && e.target.closest('[data-k]').dataset.k;
      if (k === 'edit') start();
      if (k === 'save') save();
      if (k === 'done') stop();
      if (k === 'logout' && confirm('Keluar dari mode admin di browser ini? Token akan dihapus dari browser ini.')) { store(null); token = null; stop(true); panel.remove(); }
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
  const dirty = () => [...state].filter(([el, s]) => clean(el) !== s.base);

  function start() {
    editing = true;
    document.documentElement.classList.add('editing');
    blocks().forEach((el) => {
      if (!state.has(el)) state.set(el, { key: pathOf(el), raw: el.innerHTML, base: clean(el), text: norm(el.textContent) });
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
    tools = tools || toolbar();
    render();
  }
  function stop(force) {
    const d = dirty();
    if (!force && d.length && !confirm(`${d.length} blok belum disimpan. Buang perubahan itu?`)) return;
    d.forEach(([el, s]) => { el.innerHTML = s.raw; el.classList.remove('edit-changed', 'edit-bad'); });
    state.forEach((s, el) => el.removeAttribute('contenteditable'));
    editing = false;
    document.documentElement.classList.remove('editing');
    if (tools) tools.hidden = true;
    if (panel && panel.isConnected) render();
  }

  // Toolbar format, muncul di atas teks yang diseleksi.
  const FORMATS = [
    ['b', '', '<b>B</b>', 'Frasa kunci (tebal)'],
    ['mark', '', '<span class="sw"></span>', 'Stabilo kuning: istilah baru'],
    ['mark', 'kaitan', '<span class="sw kaitan"></span>', 'Stabilo hijau: kaitan'],
    ['mark', 'jebakan', '<span class="sw jebakan"></span>', 'Stabilo pink: jebakan'],
    ['mark', 'kunci', '<span class="sw kunci"></span>', 'Stabilo biru: wajib diingat'],
    ['code', '', '<code>&lt;/&gt;</code>', 'Kode'],
    ['clear', '', '✕', 'Hapus format'],
  ];
  function toolbar() {
    const t = ui(FORMATS.map(([tag, cls, label, title], i) => `<button class="tool" data-f="${i}" title="${title}" aria-label="${title}">${label}</button>`).join(''), 'edit-tools');
    t.hidden = true;
    t.addEventListener('mousedown', (e) => e.preventDefault()); // seleksi teks jangan hilang
    t.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) format(...FORMATS[b.dataset.f]); });
    return t;
  }
  const hostOf = (node) => (node && (node.nodeType === 1 ? node : node.parentElement)?.closest('[contenteditable="true"]')) || null;
  function place() {
    const sel = getSelection();
    const host = editing && sel.rangeCount && !sel.isCollapsed && hostOf(sel.anchorNode);
    if (!tools) return;
    tools.hidden = !host || host !== hostOf(sel.focusNode);
    if (tools.hidden) return;
    const r = sel.getRangeAt(0).getBoundingClientRect();
    tools.style.top = `${Math.max(8, r.top - tools.offsetHeight - 8)}px`;
    tools.style.left = `${Math.max(8, Math.min(innerWidth - tools.offsetWidth - 8, r.left + r.width / 2 - tools.offsetWidth / 2))}px`;
  }
  function format(tag, cls) {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0), host = hostOf(r.commonAncestorContainer);
    if (!host || r.collapsed) return;
    // Setelah format dipasang atau dilepas, teks yang sama tetap terseleksi, supaya bisa langsung diberi format lain.
    const reselect = (nodes) => {
      const ns = nodes.filter((n) => n.isConnected && host.contains(n)).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      if (!ns.length) return;
      const nr = document.createRange();
      nr.setStartBefore(ns[0]);
      nr.setEndAfter(ns[ns.length - 1]);
      sel.removeAllRanges();
      sel.addRange(nr);
    };
    if (tag === 'clear') {
      const ns = [...host.querySelectorAll(FMT)].filter((n) => r.intersectsNode(n)); // dikumpulkan dulu, karena range ikut berubah
      reselect(ns.flatMap(unwrap));
    } else {
      const want = cls ? `${tag}.${cls}` : `${tag}:not([class])`, text = r.toString();
      const node = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
      const anc = node.closest(want);
      const same = (anc && anc !== host && host.contains(anc) && anc) || [...host.querySelectorAll(want)].find((n) => r.intersectsNode(n) && n.textContent === text);
      if (same) reselect(unwrap(same)); // sudah berformat sama: lepas
      else {
        const w = document.createElement(tag);
        if (cls) w.className = cls;
        w.append(r.extractContents());
        r.insertNode(w);
        const nr = document.createRange();
        nr.selectNodeContents(w);
        sel.removeAllRanges();
        sel.addRange(nr);
      }
    }
    changed(host);
  }
  function changed(el) {
    const s = state.get(el);
    if (!s) return;
    el.classList.toggle('edit-changed', clean(el) !== s.base);
    el.classList.remove('edit-bad');
    render();
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
        if (!at || textOf(src.slice(at.start, at.end)) !== s.text) bad.push(el);
        else edits.push({ el, s, start: at.start, end: at.end, html: clean(el) });
      });
      let out = src;
      edits.sort((a, b) => b.start - a.start).forEach((e) => { out = out.slice(0, e.start) + e.html + out.slice(e.end); });
      if (edits.length) {
        await gh(contentsUrl, { method: 'PUT', body: JSON.stringify({ message: `Edit ${file} lewat web`, content: toB64(out), sha: res.sha, branch: BRANCH }) });
        edits.forEach(({ el, s, html }) => { s.base = html; s.raw = el.innerHTML; s.text = norm(el.textContent); el.classList.remove('edit-changed'); });
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
  addEventListener('scroll', place, { passive: true });
  document.addEventListener('input', (e) => { const h = hostOf(e.target); if (editing && h) changed(h); });
  document.addEventListener('keydown', (e) => {
    const host = editing && hostOf(e.target);
    if (!host) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'b') { e.preventDefault(); format('b', ''); }
    else if ((e.ctrlKey || e.metaKey) && k === 'e') { e.preventDefault(); format('code', ''); }
    else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save(); }
    else if (k === 'enter') {
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
