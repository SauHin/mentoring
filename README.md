# Mentoring

Online: https://sauhin.github.io/mentoring/

Notes, slide, dan visualisasi interaktif untuk tiap materi. Semuanya file HTML.
Klik dua kali untuk membuka di browser. Tidak perlu install apa pun dan tidak perlu internet.

Tampilan mengikuti gaya catatan Notion (`_shared/gaya.css`, salinan dari `belajar/catatan/gaya.css`):
warna Notion terang/gelap, font sistem, callout, toggle, dan tabel belang.
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
| 03 | Stack dan queue | [notes](data-structure/03-stack-dan-queue/notes.html) | [slides](data-structure/03-stack-dan-queue/slides.html) |
| 04 | Priority queue | [notes](data-structure/04-priority-queue/notes.html) | [slides](data-structure/04-priority-queue/slides.html) |
| 05 | Mengerjakan soal kasus | [notes](data-structure/05-soal-kasus/notes.html) | [slides](data-structure/05-soal-kasus/slides.html) |

### Discrete mathematics

Notasi mengikuti Epp: negasi `~`, nilai T/F, dan 1/0 untuk circuit. Visualisasi logika memakai mesin bersama `_shared/logic.js` dan `logic.css` (parser, truth table, urutan operasi Epp).

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Logika proposisi | [notes](discrete-mathematics/01-logika-proposisi/notes.html) | [slides](discrete-mathematics/01-logika-proposisi/slides.html) |
| 02 | Argumen dan rules of inference | [notes](discrete-mathematics/02-argumen-dan-inferensi/notes.html) | [slides](discrete-mathematics/02-argumen-dan-inferensi/slides.html) |
| 03 | Logic circuit dan K-map | [notes](discrete-mathematics/03-rangkaian-logika-dan-kmap/notes.html) | [slides](discrete-mathematics/03-rangkaian-logika-dan-kmap/slides.html) |
| 04 | Predicate dan quantifier | [notes](discrete-mathematics/04-predikat-dan-kuantor/notes.html) | [slides](discrete-mathematics/04-predikat-dan-kuantor/slides.html) |
| 05 | Inference dengan quantifier dan teknik pembuktian | [notes](discrete-mathematics/05-inferensi-kuantor-dan-pembuktian/notes.html) | [slides](discrete-mathematics/05-inferensi-kuantor-dan-pembuktian/slides.html) |

### Compilation technique

Satu materi untuk setiap tipe soal ujian, bukan mengikuti urutan sesi dosen. Visualisasi memakai mesin bersama `_shared/automata.js` (RE, Thompson, subset construction, followpos, minimisasi, gambar diagram) dan `_shared/grammar.js` (RE → CFG, derivation, left factoring, left recursion), dengan gaya `automata.css`. Setiap viz menerima soal buatan sendiri (menu "Ubah …") dan punya mode tebak. Slide dan notes menggambar diagram dengan mesin yang sama (`renderFigures`, `renderParseTrees`).

Jawaban di mesin dicek terhadap contoh dan latihan di slide dosen: `node tools/check-engines.js` (tidak ada output = benar).

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Regular expression | [notes](compilation-technique/01-regular-expression/notes.html) | [slides](compilation-technique/01-regular-expression/slides.html) |
| 02 | RE → ε-NFA (Thompson) | [notes](compilation-technique/02-re-ke-nfa-thompson/notes.html) | [slides](compilation-technique/02-re-ke-nfa-thompson/slides.html) |
| 03 | NFA → DFA (subset construction) | [notes](compilation-technique/03-nfa-ke-dfa/notes.html) | [slides](compilation-technique/03-nfa-ke-dfa/slides.html) |
| 04 | RE → DFA langsung (followpos) | [notes](compilation-technique/04-re-ke-dfa-langsung/notes.html) | [slides](compilation-technique/04-re-ke-dfa-langsung/slides.html) |
| 05 | Minimisasi DFA | [notes](compilation-technique/05-minimisasi-dfa/notes.html) | [slides](compilation-technique/05-minimisasi-dfa/slides.html) |
| 06 | Context-free grammar dan RE → CFG | [notes](compilation-technique/06-re-ke-cfg/notes.html) | [slides](compilation-technique/06-re-ke-cfg/slides.html) |
| 07 | Derivation, parse tree, dan ambiguity | [notes](compilation-technique/07-derivation-dan-ambiguity/notes.html) | [slides](compilation-technique/07-derivation-dan-ambiguity/slides.html) |
| 08 | Left factoring | [notes](compilation-technique/08-left-factoring/notes.html) | [slides](compilation-technique/08-left-factoring/slides.html) |
| 09 | Eliminasi left recursion | [notes](compilation-technique/09-left-recursion/notes.html) | [slides](compilation-technique/09-left-recursion/slides.html) |

## Struktur

```
mentoring/
├── index.html                  home: daftar mata kuliah
├── _shared/                    gaya.css, style.css, theme.js, slides.js, notes.js, scratch.js, listviz.js/css, cviz.js/css, logic.js/css, automata.js/css, grammar.js, logo
├── _template/
│   └── NN-nama-materi/         salin folder ini untuk materi baru
├── algorithm-and-programming/
│   ├── index.html
│   └── 01-… sampai 04-…
├── data-structure/
│   ├── index.html              daftar materi data structure
│   └── 01-… sampai 05-…        05 = cara mengerjakan soal kasus
├── discrete-mathematics/
│   ├── index.html
│   └── 01-… sampai 05-…
├── compilation-technique/
│   ├── index.html
│   └── 01-… sampai 09-…        satu materi per tipe soal
└── tools/                      cachebust.py, check-engines.js
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
- Aturan lengkap gaya bahasa, notes, slide, dan visualisasi ada di `CLAUDE.md`. Ringkasnya: notes dan slide masing-masing harus bisa dibaca sendiri tanpa mentor.
- Singkat. Pakai **bold**, list pendek, tabel, `code`, dan callout, bukan paragraf panjang.
- Pakai istilah Inggris kalau padanan Indonesianya terdengar janggal. Contoh: valid (bukan sah), garbage value (bukan nilai sampah), return value, newline, term, logic gate, predicate, quantifier, truth table.
- Bahasa pemrograman per matkul: **algorithm and programming dan data structure pakai C** untuk Dev-C++. Kode harus jalan di compiler C dan C++. Data structure memakai (`malloc`/`free`, `NULL`, `printf`), dan harus juga jalan di compiler C++ (cast `(Node*)malloc(...)`).
- Fokus pada **pemahaman kode**: tiap operasi diturunkan (sebelum → sesudah → panah yang berubah → urutan → edge case → kode), latihan berupa trace, cari bug, dan turunkan sendiri.
- Visualisasi linked list, stack, queue, dan priority queue memakai mesin bersama `_shared/listviz.js` (termasuk mode tebak). Opsi `head`, `tail`, `pos`, `tag`, dan `noun` di `listViz()` mengatur nama pointer, input posisi, dan label di bawah node.
- Notes gaya catatan (`body.catatan`): header berisi tujuan, legenda stabilo, dan peta jalur, lalu satu section toggle bernomor per konsep (semua tertutup). Link `#langkah-N` membuka section-nya (`notes.js`). Notes ditutup dengan daftar pustaka.
- Notes lama (`article.notes`, belum diubah): kotak TL;DR di awal, daftar isi otomatis dari setiap `<h2>`.
- Setiap `<details>` yang judulnya memuat "full code" otomatis punya pilihan **Tampil semua** atau **Bertahap** (`notes.js`). Mode bertahap memotong kode di baris kosong menjadi blok, menampilkan baris pertama tiap blok sebagai soal, dan membuka isinya satu per satu. Jadi pisahkan fungsi dan bagian `main` dengan baris kosong.

## Kelas Gaya

Dari `gaya.css` (notes dan slide):

| Kelas / tag | Hasil |
|-------------|-------|
| `section.langkah > details > summary > h2` | Section toggle bernomor keycap (1️⃣). Nomor 10 ke atas: kotak biru |
| `p.tujuan`, `ul.legenda`, `nav.peta` | Header notes: tujuan, legenda stabilo, peta jalur |
| `p.rantai` + `span.dari` / `span.ke` | Kaitan: berangkat dari apa, dipakai untuk apa |
| `aside.analogi` + `p.batas` | Analogi bergaya kutipan, diikuti batas analogi |
| `mark`, `mark.kaitan`, `mark.jebakan`, `mark.kunci` | Stabilo kuning (istilah baru), hijau (kaitan), pink (jebakan), biru (wajib diingat) |
| `<b>`, `<strong>` | Frasa kunci (tebal kuning), label poin ("Kelebihan:") |
| `p.rumus` + `details.keterangan` | Rumus di tengah, lalu arti simbol (tertutup) |
| `aside.catatan`, `aside.jebakan`, `aside.hitung`, `p.intinya` | Callout 💡, ⚠️, 📌 (contoh hitungan dalam toggle), 🔑 |
| `details.soal` | Soal latihan, jawabannya tertutup |
| `pre.kode`, `<table>`, `figure` + `figcaption` | Kode, tabel belang, gambar dengan keterangan |

Dari `style.css`:

| Kelas / tag | Hasil |
|-------------|-------|
| `aside.coba` | Callout 🧪 ajakan mencoba visualisasi |
| `a.no`, `span.no` | Rujukan ke section 10 ke atas (kotak biru) |
| `p.kicker` | Di slide: nomor section notes di atas judul ("Notes 3️⃣ · while") |
| `p.sub` | Di slide: satu kalimat pembuka di bawah judul |
| `p.coba`, `p.perhatikan` | Di viz: petunjuk "Coba:" dan "Perhatikan:" |
| `.card`, `.panel` | Kartu abu tanpa garis, kartu putih bergaris tipis |
| `.btn`, `.btn-go` | Tombol datar putih, tombol biru untuk aksi utama |
| `.chip`, `.label` | Label kecil, teks kecil abu |
| `.controls` | Baris kontrol di visualisasi, tanpa kotak |
| `label.pick` + `select.field` | Dropdown "Contoh"/"Program" untuk lebih dari 4 pilihan |
| `.seg` + `.btn.sel` | Grup tombol pilihan (maksimal 4), yang aktif berlatar biru muda |
| `label.check` | Pengaturan sekunder kecil, misalnya mode tebak |
| `.callout`, `.callout.tip`, `.callout.warn` | Callout lama (materi yang belum diubah) |
| `.crumbs` | Nama matkul di sebelah tombol Home (dibuat otomatis) |
| `ol.refs` | Daftar pustaka |

Warna untuk seri data di visualisasi: `--go-ink`, `--c-jingga`, `--c-biru`, `--c-pink`, `--c-mint`, `--c-lilac`.

Viz yang dibuka di dalam iframe slide mendapat kelas `embed` di `<html>` (dari `theme.js`), dan judulnya disembunyikan karena slide sudah punya judul.

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
