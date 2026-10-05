# Mentoring

Notes, slide, dan visualisasi interaktif untuk tiap materi. Semuanya file HTML.
Klik dua kali untuk membuka di browser. Tidak perlu install apa pun dan tidak perlu internet.

Gaya visual mengikuti Empur (`D:\sem-5\speech-recognition\DESIGN.md`):
latar polos, kartu abu tanpa garis, tombol pil hijau, dan font Lexend.
Mode Siang/Malam mengikuti pengaturan sistem.

## Daftar Materi

| No | Materi | Notes | Slide |
|----|--------|-------|-------|
| 01 | Double linked list | [notes](01-double-linked-list/notes.html) | [slides](01-double-linked-list/slides.html) |

## Struktur

```
mentoring/
├── _shared/          style.css, slides.js, font Lexend, logo Empur
├── _template/        salin folder ini untuk materi baru
│   ├── notes.html
│   ├── slides.html
│   ├── viz/          satu file HTML per konsep interaktif
│   └── assets/       gambar, data, dll.
└── 01-nama-materi/   hasil salinan _template
```

## Membuat Materi Baru

1. Salin folder `_template`, lalu beri nama `NN-nama-materi`.
2. Isi `notes.html`.
3. Edit `slides.html`. Satu `<section class="slide">` = satu slide.
4. Untuk tiap konsep interaktif, salin `viz/contoh.html` ke nama baru di folder `viz/`.
5. Tambahkan baris di tabel Daftar Materi.

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
| Ctrl+P | Cetak / simpan PDF (semua slide) |

Selama laser menyala, klik tetap jalan, termasuk di dalam visualisasi.
Pilihan tema tersimpan dan berlaku untuk slide, notes, dan visualisasi.

Setelah Anda klik di dalam visualisasi, tombol keyboard masuk ke visualisasi tersebut.
Klik di luar visualisasi untuk kembali mengontrol slide.
