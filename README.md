# Mentoring

Online: https://sauhin.github.io/mentoring/

Notes, slide, dan visualisasi interaktif untuk tiap materi. Semuanya file HTML.
Klik dua kali untuk membuka di browser. Tidak perlu install apa pun dan tidak perlu internet.

Gaya visual mengikuti Empur (`D:\sem-5\speech-recognition\DESIGN.md`):
latar polos, kartu abu tanpa garis, tombol pil hijau, dan font Lexend.
Mode Siang/Malam bisa diganti (tombol tema), awalnya ikut pengaturan sistem.

## Daftar Materi

### Data structure

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 02 | Double linked list | [notes](data-structure/02-double-linked-list/notes.html) | [slides](data-structure/02-double-linked-list/slides.html) |

## Struktur

```
mentoring/
├── index.html              homepage: daftar materi per matkul
├── _shared/                style.css, theme.js, slides.js, font, logo
├── _template/
│   └── NN-nama-materi/     salin folder ini untuk materi baru
│       ├── notes.html
│       ├── slides.html
│       ├── viz/            satu file HTML per konsep interaktif
│       └── assets/         gambar, data, dll.
└── data-structure/         satu folder per matkul
    └── 02-double-linked-list/
```

## Membuat Materi Baru

1. Salin `_template/NN-nama-materi` ke folder matkul, misalnya `data-structure/01-single-linked-list`.
2. Di `notes.html`, ganti `matkul` di breadcrumb dengan nama folder matkul.
3. Isi `notes.html` dan `slides.html`. Satu `<section class="slide">` = satu slide.
4. Untuk tiap konsep interaktif, salin `viz/contoh.html` ke nama baru di `viz/`.
5. Tambahkan kartu di `index.html` (di `<section>` matkul-nya) dan baris di tabel di atas.

Matkul baru: buat folder baru, lalu tambahkan `<section class="matkul" id="nama-folder">` di `index.html`.

## Gaya Penulisan

- Bahasa Indonesia, tetapi istilah yang lebih umum dalam bahasa Inggris tetap Inggris: node, pointer, insert, delete, traverse, edge case.
- Singkat. Pakai **bold**, list pendek, tabel, `code`, dan callout, bukan paragraf panjang.
- Notes dibuka dengan kotak TL;DR.

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
| `.crumbs` | Breadcrumb ke homepage |

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
| T | Tema Siang/Malam |
| G, atau klik nomor slide | Pilih slide dari daftar judul |
| Tombol rumah (kanan bawah) | Kembali ke homepage |
| Ctrl+P | Cetak / simpan PDF (semua slide) |

Selama laser menyala, klik tetap jalan, termasuk di dalam visualisasi.
Pilihan tema tersimpan dan berlaku untuk slide, notes, dan visualisasi.

Setelah Anda klik di dalam visualisasi, tombol keyboard masuk ke visualisasi tersebut.
Klik di luar visualisasi untuk kembali mengontrol slide.
