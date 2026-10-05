// Notes: daftar isi otomatis dari setiap <h2>, sorotan bagian yang sedang dibaca,
// tombol daftar isi mengambang (layar sempit), dan tombol kembali ke atas.
// Cukup muat file ini, tidak perlu menulis daftar isi manual.
(function () {
  const article = document.querySelector('.notes');
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
