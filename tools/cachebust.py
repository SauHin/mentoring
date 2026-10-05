"""Cache busting untuk GitHub Pages.

GitHub Pages menyuruh browser menyimpan CSS/JS selama 10 menit. Setelah deploy, HTML baru bisa
dipasangkan dengan style.css lama, sehingga halaman tampil rusak. Script ini menambahkan
?v=<hash isi file> ke setiap rujukan _shared/*.css dan _shared/*.js. Begitu isi file berubah,
alamatnya berubah, dan browser langsung mengambil versi baru.

Jalankan sebelum commit:  python tools/cachebust.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHARED = ROOT / '_shared'
REF = re.compile(r'(_shared/)([\w.-]+\.(?:css|js))(\?v=\w+)?')


def file_hash(p):
    return hashlib.md5(p.read_bytes()).hexdigest()[:8]


def stamp(text, hashes):
    return REF.sub(lambda m: f'{m[1]}{m[2]}?v={hashes[m[2]]}' if m[2] in hashes else m[0], text)


def main():
    assets = [p for p in SHARED.iterdir() if p.suffix in ('.css', '.js')]
    # theme.js memuat scratch.js sendiri, jadi rujukan di dalam file _shared diberi versi dulu,
    # baru hash semua file dihitung (isi theme.js ikut berubah karena versi scratch.js).
    hashes = {p.name: file_hash(p) for p in assets}
    for p in assets:
        text = p.read_text(encoding='utf-8')
        new = stamp(text, hashes)
        if new != text:
            p.write_text(new, encoding='utf-8')
    hashes = {p.name: file_hash(p) for p in assets}

    changed = 0
    for html in ROOT.rglob('*.html'):
        text = html.read_text(encoding='utf-8')
        new = stamp(text, hashes)
        if new != text:
            html.write_text(new, encoding='utf-8')
            changed += 1
    print(f'{changed} file HTML diperbarui. Versi: ' + ', '.join(f'{k}={v}' for k, v in sorted(hashes.items())))


if __name__ == '__main__':
    main()
