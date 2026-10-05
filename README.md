# Mentoring

Online: https://sauhin.github.io/mentoring/

Notes, slide, dan visualisasi interaktif untuk tiap materi. Semuanya file HTML.
Klik dua kali untuk membuka di browser. Tidak perlu install apa pun dan tidak perlu internet.

Gaya visual mengikuti Empur (`D:\sem-5\speech-recognition\DESIGN.md`):
latar polos, kartu abu tanpa garis, tombol pil hijau, dan font Lexend.
Mode Siang/Malam bisa diganti (tombol tema), awalnya ikut pengaturan sistem.

## Daftar Materi

Home (`index.html`) berisi daftar mata kuliah. Tiap matkul punya `index.html` sendiri berisi daftar materinya.

### Algorithm and programming

Semua kode C untuk Dev-C++. Visualisasi memakai mesin bersama `_shared/cviz.js` (memory, pointer, buffer keyboard, trace table, mode tebak).

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Algoritma dan struktur program C | [notes](algorithm-and-programming/01-algoritma-dan-struktur-c/notes.html) | [slides](algorithm-and-programming/01-algoritma-dan-struktur-c/slides.html) |
| 02 | Variabel, tipe data, dan input/output | [notes](algorithm-and-programming/02-variabel-tipe-data-io/notes.html) | [slides](algorithm-and-programming/02-variabel-tipe-data-io/slides.html) |
| 03 | Repetition (loop) | [notes](algorithm-and-programming/03-repetition/notes.html) | [slides](algorithm-and-programming/03-repetition/slides.html) |
| 04 | Pointer dan array | [notes](algorithm-and-programming/04-pointer-dan-array/notes.html) | [slides](algorithm-and-programming/04-pointer-dan-array/slides.html) |

### Data structure

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Single linked list | [notes](data-structure/01-single-linked-list/notes.html) | [slides](data-structure/01-single-linked-list/slides.html) |
| 02 | Double linked list | [notes](data-structure/02-double-linked-list/notes.html) | [slides](data-structure/02-double-linked-list/slides.html) |

### Discrete mathematics

Notasi mengikuti Epp: negasi `~`, nilai T/F, dan 1/0 untuk rangkaian. Visualisasi logika memakai mesin bersama `_shared/logic.js` dan `logic.css` (parser, truth table, urutan operasi Epp).

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Logika proposisi | [notes](discrete-mathematics/01-logika-proposisi/notes.html) | [slides](discrete-mathematics/01-logika-proposisi/slides.html) |
| 02 | Argumen dan aturan inferensi | [notes](discrete-mathematics/02-argumen-dan-inferensi/notes.html) | [slides](discrete-mathematics/02-argumen-dan-inferensi/slides.html) |
| 03 | Rangkaian logika dan K-map | [notes](discrete-mathematics/03-rangkaian-logika-dan-kmap/notes.html) | [slides](discrete-mathematics/03-rangkaian-logika-dan-kmap/slides.html) |
| 04 | Predikat dan kuantor | [notes](discrete-mathematics/04-predikat-dan-kuantor/notes.html) | [slides](discrete-mathematics/04-predikat-dan-kuantor/slides.html) |
| 05 | Inferensi kuantor dan teknik pembuktian | [notes](discrete-mathematics/05-inferensi-kuantor-dan-pembuktian/notes.html) | [slides](discrete-mathematics/05-inferensi-kuantor-dan-pembuktian/slides.html) |

### Compilation technique

Belum ada materi.

## Struktur

```
mentoring/
├── index.html                  home: daftar mata kuliah
├── _shared/                    style.css, theme.js, slides.js, notes.js, scratch.js, listviz.js/css, cviz.js/css, logic.js/css, font, logo
├── _template/
│   └── NN-nama-materi/         salin folder ini untuk materi baru
├── algorithm-and-programming/
│   ├── index.html
│   └── 01-… sampai 04-…
├── data-structure/
│   ├── index.html              daftar materi data structure
│   ├── 01-single-linked-list/
│   └── 02-double-linked-list/
├── discrete-mathematics/
│   ├── index.html
│   └── 01-… sampai 05-…
└── compilation-technique/
    └── index.html              daftar materi (masih kosong)
```

## Membuat Materi Baru

1. Salin `_template/NN-nama-materi` ke folder matkul, misalnya `compilation-technique/01-lexical-analysis`.
2. Isi `notes.html` dan `slides.html`. Satu `<section class="slide">` = satu slide.
3. Untuk tiap konsep interaktif, salin `viz/contoh.html` ke nama baru di `viz/`.
4. Tambahkan kartu materi di `index.html` milik matkul itu, lalu perbarui jumlah materi di kartu matkul di home.
5. Tambahkan baris di tabel di atas.

Tombol Home, breadcrumb "/ Nama matkul", dan scratch pad dibuat otomatis oleh `theme.js` dari nama folder.

**Matkul baru:** buat folder (nama pakai tanda hubung, misalnya `operating-system`), salin `compilation-technique/index.html` ke dalamnya, lalu tambahkan kartu di home.

## Sebelum Commit

Jalankan `python tools/cachebust.py`. Script ini menambahkan `?v=<hash>` ke setiap rujukan `_shared/*.css` dan `*.js`, supaya browser langsung memakai versi terbaru setelah deploy. Tanpa ini, GitHub Pages bisa memasangkan HTML baru dengan CSS lama selama 10 menit, dan halaman tampil rusak.

## Gaya Penulisan

- Bahasa Indonesia, tetapi istilah yang lebih umum dalam bahasa Inggris tetap Inggris: node, pointer, insert, delete, traverse, edge case.
- Singkat. Pakai **bold**, list pendek, tabel, `code`, dan callout, bukan paragraf panjang.
- Bahasa pemrograman per matkul: **algorithm and programming dan data structure pakai C** untuk Dev-C++. Kode harus jalan di compiler C dan C++. Data structure memakai (`malloc`/`free`, `NULL`, `printf`), dan harus juga jalan di compiler C++ (cast `(Node*)malloc(...)`).
- Fokus pada **pemahaman kode**: tiap operasi diturunkan (sebelum → sesudah → panah yang berubah → urutan → edge case → kode), latihan berupa trace, cari bug, dan turunkan sendiri.
- Visualisasi linked list memakai mesin bersama `_shared/listviz.js` (termasuk mode tebak).
- Notes dibuka dengan kotak TL;DR dan ditutup dengan daftar pustaka.
- Daftar isi dan tombol kembali ke atas dibuat otomatis oleh `notes.js` dari setiap `<h2>`.

## Kelas Gaya

| Kelas / tag | Hasil |
|-------------|-------|
| `<mark>` | Sorotan stabilo kuning untuk istilah penting |
| `<blockquote>` | Kutipan dengan garis kiri biru muda |
| `<details>` | Lipatan, misalnya untuk jawaban latihan |
| `.card` | Kartu abu tanpa garis |
| `.panel` | Kartu putih dengan garis tipis |
| `.btn`, `.btn-go`, `.btn-stop` | Tombol pil biasa, hijau, merah |
| `.chip`, `.label` | Pil kecil, teks kecil abu |
| `.controls` | Wadah slider dan tombol di visualisasi |
| `.callout`, `.callout.tip`, `.callout.warn` | Kotak catatan biru, tips hijau, peringatan merah |
| `.card.tldr` | Kotak ringkasan di awal notes |
| `.crumbs` | Nama matkul di sebelah tombol Home (dibuat otomatis) |
| `ol.refs` | Daftar pustaka |

Warna untuk seri data di visualisasi: `--go-ink`, `--c-jingga`, `--c-biru`, `--c-pink`, `--c-mint`, `--c-lilac`.

Aturan gaya Empur: huruf kalimat biasa (tidak ada teks kapital penuh), tidak ada garis luar tebal, dan bayangan hanya untuk benda yang melayang.

## Kontrol Slide

| Tombol | Fungsi |
|--------|--------|
| Panah kanan / Space | Slide berikutnya |
| Panah kiri | Slide sebelumnya |
| Mouse di tepi kiri/kanan | Tombol slide sebelumnya/berikutnya muncul |
| F | Layar penuh |
| L | Laser pointer (nyala/mati) |
| D, atau tombol pena di sebelah Home | Scratch pad: coret-coret di slide atau notes (Esc selesai, Ctrl+Z undo) |
| Saat mode coret: P / S / E | Pena / pilih (klik coretan atau tarik kotak, lalu geser) / penghapus |
| Saat ada coretan terpilih | Delete = hapus, klik warna atau ketebalan = ubah coretan itu |
| T | Tema Siang/Malam |
| G, atau klik nomor slide | Pilih slide dari daftar judul |
| Tombol Home / nama matkul (kiri atas) | Kembali ke home / daftar materi matkul |
| Ctrl+P | Cetak / simpan PDF (semua slide) |

Selama laser menyala, klik tetap jalan, termasuk di dalam visualisasi.
Pilihan tema tersimpan dan berlaku untuk slide, notes, dan visualisasi.
Coretan scratch pad di slide disimpan per slide, di notes ikut ter-scroll. Coretan hilang saat halaman di-reload.

Setelah Anda klik di dalam visualisasi, tombol keyboard masuk ke visualisasi tersebut.
Klik di luar visualisasi untuk kembali mengontrol slide.
