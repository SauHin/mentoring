# Mentoring

Situs statis (GitHub Pages, branch master) berisi notes, slide, dan visualisasi per mata kuliah. Lihat README untuk struktur dan gaya penulisan.

- Sebelum setiap commit yang mengubah `_shared/*.css` atau `_shared/*.js`, jalankan `python tools/cachebust.py`. Tanpa ini, browser memakai CSS/JS lama dari cache selama 10 menit dan halaman tampil rusak.
- Kode C harus jalan di Dev-C++ (compiler C dan C++). Uji full program dengan MinGW gcc dan g++ (Compiler Explorer API), karena tidak ada compiler lokal.

## Membuat materi (matkul apa pun)

**Slide adalah materi utama.** Slide berisi ringkasan pelajaran yang bisa dipahami mentee sendiri, tanpa penjelasan mentor dan tanpa membaca notes. Notes hanya tambahan: penurunan lengkap, contoh lebih banyak, latihan dengan jawaban, dan daftar pustaka.

Aturan slide:
- Setiap slide punya judul (`<h2>`) dan kalimat pembuka `<p class="sub">` (1–2 kalimat) yang menjelaskan isi slide dan alasannya.
- Tulis poin sebagai kalimat lengkap yang menjelaskan **kenapa**, bukan rantai panah. Salah: "Lupa & → crash". Benar: "Kalau & lupa ditulis, scanf menulis ke alamat sembarang, dan program bisa crash."
- Tabel kesalahan memuat penyebab atau perbaikannya, bukan hanya gejala.
- Fokus pada pemahaman, bukan hafalan. Tunjukkan cara menurunkan konsep atau kode sendiri.
- Akhiri deck dengan slide Ringkasan. Sisipkan slide `.full` berisi iframe visualisasi kalau ada konsep yang bisa dicoba.
- Setiap slide harus muat di layar 1280×720. Cek di browser sebelum commit.
- Contoh deck yang sudah sesuai aturan: `data-structure/01-single-linked-list/slides.html`.

Aturan visualisasi (viz):
- Satu viz untuk satu konsep. Mentee harus langsung tahu apa yang perlu diklik.
- Pakai mesin bersama kalau cocok: `_shared/cviz.js` (program C), `listviz.js` (linked list), `logic.js` (logika). Mesin ini sudah mengikuti aturan di bawah.
- Simulasi bertahap selalu punya tombol **Kembali** di sebelah **Langkah berikutnya**.
- Pilihan contoh lebih dari 4: pakai dropdown (`label.pick` + `select.field`), bukan deretan tombol. Pilihan paling banyak 4: grup tombol `.seg`.
- Jangan menumpuk kotak. Baris kontrol tanpa latar (`.controls`), paling banyak satu kartu untuk penjelasan langkah dan satu panel untuk state. Jangan ada kartu di dalam kartu.
- Sembunyikan yang jarang dipakai: ubah input di `<details>`, pengaturan sekunder (mode tebak) sebagai `label.check` kecil di kanan atas.
- Label input diletakkan di atas kolom, jangan terlipat di sampingnya.
- Cek di desktop, HP (375px), dan mode gelap sebelum commit. Contoh viz yang sudah sesuai: `algorithm-and-programming/03-repetition/viz/loop.html`.

Aturan bahasa:
- Bahasa Indonesia, tapi **jangan hard translate**. Kalau istilahnya lebih umum dalam bahasa Inggris, pakai istilah Inggris.
- Contoh pemrograman: valid (bukan sah), garbage value (bukan nilai sampah), return value, newline, loop, node, pointer, edge case.
- Contoh matematika: term, logic gate, predicate, quantifier, statement, truth table, rules of inference.
- Kata Indonesia yang wajar tetap dipakai: deklarasi, karakter, variabel, negasi, ekuivalen.
- Ringkas. Pakai bold, list pendek, tabel, `code`, dan callout, bukan paragraf panjang.

Langkah teknis untuk materi baru ada di README, bagian "Membuat Materi Baru". Matkul baru juga butuh kartu di home (`index.html`).
