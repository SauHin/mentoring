// Notes lama (article.notes): daftar isi otomatis dari setiap <h2>, sorotan bagian yang sedang dibaca,
// tombol daftar isi mengambang (layar sempit), dan tombol kembali ke atas.
// Cukup muat file ini, tidak perlu menulis daftar isi manual.
// Notes gaya catatan (body.catatan): tidak ada daftar isi, karena peta jalur dan section yang
// tertutup sudah jadi outline. Link ke #langkah-N (dari peta jalur atau dari section lain) membuka section itu.
(function () {
  if (!document.body.classList.contains('catatan')) return;
  function openTarget() {
    const t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const d = t && (t.matches('details') ? t : t.querySelector(':scope > details') || t.closest('details'));
    if (!d) return;
    d.open = true;
    t.scrollIntoView();
  }
  addEventListener('hashchange', openTarget);
  openTarget();
  // Klik link ke section yang sedang dibuka tidak memicu hashchange, jadi tangani di sini juga.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) openTarget();
  });

  const up = document.body.appendChild(document.createElement('button'));
  up.className = 'tool to-top';
  up.title = 'Kembali ke atas';
  up.setAttribute('aria-label', 'Kembali ke atas');
  up.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg>';
  up.onclick = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  addEventListener('scroll', () => up.classList.toggle('show', scrollY > 600), { passive: true });
})();

(function () {
  const article = document.querySelector('article.notes');
  if (!article) return;
  const heads = [...article.querySelectorAll('h2')];
  if (!heads.length) return;

  // id dari teks judul: "1. Kenapa butuh ...?" → "1-kenapa-butuh"
  heads.forEach((h) => {
    h.id ||= h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  const links = []; // semua link daftar isi (di halaman dan di popup), untuk sorotan bagian aktif
  function tocInto(el) {
    el.setAttribute('aria-label', 'Daftar isi');
    el.innerHTML = '<strong>Daftar isi</strong><ol></ol>';
    heads.forEach((h, i) => {
      const a = el.querySelector('ol').appendChild(document.createElement('li')).appendChild(document.createElement('a'));
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      (links[i] ||= []).push(a);
    });
    return el;
  }
  const button = (cls, label, svg) => {
    const b = document.body.appendChild(document.createElement('button'));
    b.className = `tool ${cls}`;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = `<svg viewBox="0 0 24 24">${svg}</svg>`;
    return b;
  };

  // Daftar isi di halaman. Layar sempit: di bawah TL;DR. Layar lebar: CSS memindahkannya ke samping.
  const toc = tocInto(document.createElement('nav'));
  toc.className = 'toc';
  (article.querySelector('.tldr') || article.querySelector('.lead')).after(toc);

  // Layar sempit: tombol mengambang membuka daftar isi sebagai popup, dari posisi scroll mana pun.
  const pop = tocInto(document.body.appendChild(document.createElement('nav')));
  pop.className = 'toc-pop';
  pop.id = 'toc-pop';
  pop.popover = 'auto'; // popover bawaan browser: Esc atau klik di luar menutupnya
  pop.addEventListener('click', (e) => e.target.closest('a') && pop.hidePopover());
  button('toc-btn', 'Daftar isi', '<path d="M5 7h14M5 12h14M5 17h9"/>').setAttribute('popovertarget', 'toc-pop');

  const up = button('to-top', 'Kembali ke atas', '<path d="M6 14l6-6 6 6"/>');
  up.onclick = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      up.classList.toggle('show', scrollY > 600);
      // Bagian aktif = judul terakhir yang sudah lewat bagian atas layar.
      let active = -1;
      heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 120) active = i; });
      links.forEach((pair, i) => pair.forEach((a) => a.classList.toggle('on', i === active)));
    });
  }, { passive: true });
})();

// Full code bertahap: setiap <details> yang judulnya memuat "full code" bisa dibuka sekaligus
// atau per blok. Blok = potongan kode yang dipisah baris kosong (satu fungsi, satu bagian main).
// Baris pertama blok (plus komentar di sekitarnya) tetap tampil sebagai soal, dan isinya
// disembunyikan, supaya pembaca mencoba menulisnya sendiri sebelum membuka jawabannya.
(function () {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const isComment = (l) => /^\s*(\/\/|\/\*)/.test(l);
  // Panjang "soal" sebuah blok: komentar di atas + baris kode pertama + komentar tepat sesudahnya.
  function promptLen(b) {
    let i = 0;
    while (i < b.length - 1 && isComment(b[i])) i++;
    i++;
    while (i < b.length && isComment(b[i])) i++;
    return i;
  }

  document.querySelectorAll('.notes details, .catatan details').forEach((d) => {
    const code = d.querySelector('pre > code');
    if (!code || !/full code/i.test(d.querySelector('summary')?.textContent || '')) return;
    const pre = code.parentElement;

    const blocks = [];
    let cur = [];
    for (const line of code.textContent.replace(/\n+$/, '').split('\n')) {
      if (line.trim()) cur.push(line);
      else if (cur.length) { blocks.push(cur); cur = []; }
    }
    if (cur.length) blocks.push(cur);

    code.innerHTML = blocks.map((b) => {
      const k = promptLen(b);
      const hl = window.hlC || esc; // warna sintaks dari theme.js
      const head = hl(b.slice(0, k).join('\n'));
      if (k === b.length) return `<span class="blk open">${head}</span>`;
      const indent = b[k].match(/^\s*/)[0];
      return `<span class="blk" data-step><span class="head">${head}</span>\n` +
        `<span class="body">${hl(b.slice(k).join('\n'))}</span>` +
        `<span class="ph">${indent}... ${b.length - k} baris: tulis sendiri dulu</span></span>`;
    }).join('\n\n');

    const steps = [...code.querySelectorAll('[data-step]')];
    const bar = document.createElement('div');
    bar.className = 'reveal-bar';
    bar.innerHTML = `<div class="seg">
        <button class="btn btn-sm sel" data-mode="all">Tampil semua</button>
        <button class="btn btn-sm" data-mode="step">Bertahap</button>
      </div>
      <button class="btn btn-sm push" data-back hidden>Kembali</button>
      <button class="btn btn-go btn-sm" data-next hidden>Langkah berikutnya</button>
      <p class="label" aria-live="polite"></p>`;
    pre.before(bar);
    const [allBtn, stepBtn] = bar.querySelectorAll('[data-mode]');
    const back = bar.querySelector('[data-back]'), next = bar.querySelector('[data-next]');
    const label = bar.querySelector('.label');
    let stepwise = false, at = 0;

    function render(scroll) {
      steps.forEach((s, i) => {
        s.classList.toggle('open', !stepwise || i < at);
        s.classList.toggle('now', stepwise && i === at);
      });
      allBtn.classList.toggle('sel', !stepwise);
      stepBtn.classList.toggle('sel', stepwise);
      back.hidden = next.hidden = !stepwise;
      back.disabled = at === 0;
      next.disabled = at === steps.length;
      label.textContent = !stepwise ? ''
        : at < steps.length ? `Blok ${at + 1} dari ${steps.length}: tulis isi blok yang disorot sendiri, lalu cocokkan.`
        : `Semua ${steps.length} blok sudah tampil. Bandingkan dengan tulisanmu.`;
      // Blok yang disorot harus terlihat, tapi halaman hanya digeser kalau blok itu keluar layar.
      const now = code.querySelector('.now > .head');
      if (scroll && now) {
        const r = now.getBoundingClientRect();
        if (r.top < bar.getBoundingClientRect().bottom + 8 || r.bottom > innerHeight - 24) now.scrollIntoView({ block: 'center' });
      }
    }
    allBtn.onclick = () => { stepwise = false; render(); };
    stepBtn.onclick = () => { stepwise = true; at = 0; render(true); };
    back.onclick = () => { at--; render(true); };
    next.onclick = () => { at++; render(true); };
    render();
  });
})();
