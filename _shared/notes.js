// Notes: daftar isi otomatis dari setiap <h2>, sorotan bagian yang sedang dibaca,
// dan tombol kembali ke atas. Cukup muat file ini, tidak perlu menulis daftar isi manual.
(function () {
  const article = document.querySelector('.notes');
  const heads = [...article.querySelectorAll('h2')];
  if (!heads.length) return;

  // id dari teks judul: "1. Kenapa butuh ...?" → "1-kenapa-butuh"
  heads.forEach((h) => {
    h.id ||= h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  const toc = document.createElement('nav');
  toc.className = 'toc';
  toc.setAttribute('aria-label', 'Daftar isi');
  toc.innerHTML = '<strong>Daftar isi</strong><ol></ol>';
  const links = heads.map((h) => {
    const a = toc.querySelector('ol').appendChild(document.createElement('li')).appendChild(document.createElement('a'));
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    return a;
  });
  // Di layar sempit, daftar isi tampil di bawah TL;DR. Di layar lebar, CSS memindahkannya ke samping.
  (article.querySelector('.tldr') || article.querySelector('.lead')).after(toc);

  const up = document.body.appendChild(document.createElement('button'));
  up.className = 'tool to-top';
  up.title = 'Kembali ke atas';
  up.setAttribute('aria-label', up.title);
  up.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg>';
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
      links.forEach((a, i) => a.classList.toggle('on', i === active));
    });
  }, { passive: true });
})();
