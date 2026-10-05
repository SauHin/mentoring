# Mentoring

Situs statis (GitHub Pages, branch master) berisi notes, slide, dan visualisasi per mata kuliah. Lihat README untuk struktur dan gaya penulisan.

- Sebelum setiap commit yang mengubah `_shared/*.css` atau `_shared/*.js`, jalankan `python tools/cachebust.py`. Tanpa ini, browser memakai CSS/JS lama dari cache selama 10 menit dan halaman tampil rusak.
- Kode C harus jalan di Dev-C++ (compiler C dan C++). Uji full program dengan MinGW gcc dan g++ (Compiler Explorer API), karena tidak ada compiler lokal.
