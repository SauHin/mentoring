# Mentoring

Situs statis (GitHub Pages, branch master) berisi notes, slide, dan visualisasi per mata kuliah. Lihat README untuk struktur dan gaya penulisan.

- Sebelum setiap commit yang mengubah `_shared/*.css` atau `_shared/*.js`, jalankan `python tools/cachebust.py`. Tanpa ini, browser memakai CSS/JS lama dari cache selama 10 menit dan halaman tampil rusak.
- Kode C harus jalan di Dev-C++ (compiler C dan C++). Uji full program dengan MinGW gcc dan g++ (Compiler Explorer API), karena tidak ada compiler lokal.

## Membuat materi (matkul apa pun)

**Notes dan slides masing-masing harus self-explanatory.** Mentor memakainya saat mentoring, tapi menti bisa membaca slides saja, notes saja, atau keduanya tanpa mentor. Notes = penjelasan lengkap. Slides = versi visual yang lebih ringkas, tapi tetap utuh tanpa penjelasan lisan dan tanpa notes.

Pembaca: menti dari berbagai semester, ada yang semester 5 dan ada yang mengulang matkul. Anggap mereka malas memperhatikan di kelas, jadi notes dan slides ini harus bisa menjadi sumber utama mereka.

Acuan tampilan: `_shared/gaya.css` (salinan `C:\Users\jonat\Music\belajar\catatan\gaya.css`, warna Notion terang/gelap). Dua perubahan: mode gelap memakai `[data-theme='dark']` dari `theme.js`, supaya tombol tema tetap jalan, dan `--pudar`/`--frasa` diubah supaya kontras teks minimal 4.5:1. Jangan kembalikan ke nilai Notion saat menyalin ulang. Contoh komponen notes: `C:\Users\jonat\Music\belajar\catatan\_contoh.html`.

**Topik acuan gaya catatan** (disetujui 2026-10-08): `algorithm-and-programming/03-repetition/`. Pakai `notes.html` untuk notes, `slides.html` untuk slide, `viz/loop.html` untuk viz. Template kosongnya ada di `_template/NN-nama-materi/`.

**Acuan gaya renggang untuk notes** (diminta user 2026-10-30): catatan Notion user "Speech Recognition > UTS", diterapkan di `deep-learning/00-mid-exam/notes.html`. Notes lama yang padat tidak wajib diubah, tapi notes baru dan notes yang ditulis ulang mengikuti gaya ini.

### Gaya bahasa (notes dan slides)
- Bahasa Indonesia santai, menyapa pembaca dengan "kamu". Istilah teknis tetap dalam bahasa Inggris, tapi **jangan hard translate**: kalau istilahnya lebih umum dalam bahasa Inggris, pakai istilah Inggris.
  - Contoh pemrograman: valid (bukan sah), garbage value (bukan nilai sampah), return value, newline, loop, node, pointer, edge case.
  - Contoh matematika: term, logic gate, predicate, quantifier, statement, truth table, rules of inference.
  - Kata Indonesia yang wajar tetap dipakai: deklarasi, karakter, variabel, negasi, ekuivalen.
- **Masalah dulu, istilah kemudian.** Buka dengan masalah atau pertanyaan dan contoh sehari-hari, baru beri nama istilahnya ("Cara menebak seperti ini disebut noisy channel model"). Rumus datang paling akhir.
- Definisi ditulis satu kalimat dengan pola "X adalah …" atau "Ini merupakan …", lalu dijelaskan dengan bahasa santai ("kita", "udah", "kayak").
- Jelaskan setiap istilah dengan bahasa biasa saat pertama muncul. Jangan anggap mentor akan menjelaskannya.
- Setiap pernyataan umum langsung diikuti contoh konkret. Pakai **satu contoh sehari-hari yang dipakai ulang** di seluruh topik (misalnya "saya pergi ke bank"), bukan contoh baru di setiap bagian.
- Analogi selalu disertai satu kalimat tentang di mana analogi itu tidak berlaku.
- Jangan melompati langkah dalam hitungan, turunan, atau trace kode.
- Fokus pada pemahaman, bukan hafalan. Tunjukkan cara menurunkan konsep atau kode sendiri.
- **Satu kalimat per baris.** Di notes, setiap kalimat menjadi `<p>` sendiri (atau satu poin list), supaya catatan renggang dan mudah dibaca. Jangan gabung beberapa kalimat dalam satu paragraf. Di slide, poin tetap pendek.
- **Inti dulu, detail di bawahnya.** Setiap poin dibuka dengan satu kalimat inti yang ditebalkan. Penjelasan, contoh, dan alasannya ditaruh di kotak abu `div.detail` atau toggle tepat di bawah poin itu.
- **Aturan utama sebelum detail.** Kalau ada beberapa pilihan alat atau metode (optimizer, loss, tipe autoencoder, dan sejenisnya), mulai dengan `aside.aturan` berisi `h4` dan tabel satu baris per pilihan: pilihan, pakai kalau, alasan. Detail setiap pilihan ditulis di bawahnya.
- Boleh ada catatan penulis `p.bisik` (miring, pudar) untuk batas cakupan atau saran belajar, misalnya "Ini esai, jadi cukup intinya" atau "Detail lengkapnya ada di PPT sesi 2".
- Pakai poin dengan label tebal + titik dua (**Efek:**, **Kelebihan:**). Ringkas: pakai bold, list pendek, tabel, `code`, dan callout, bukan paragraf panjang.
- Panah → dipakai untuk **satu** sebab-akibat ("update lupa → loop tidak berhenti") dan untuk "makin X → makin Y". Rantai 3 panah atau lebih tanpa penjelasan kenapa tetap dilarang. Salah: "Lupa & → alamat acak → crash". Benar: "Kalau & lupa ditulis, scanf menulis ke alamat sembarang, dan program bisa crash."
  - Di discrete mathematics dan compilation technique, → adalah simbol (conditional, transisi, produksi). Di sana jangan pakai → sebagai sebab-akibat di kalimat biasa. Tulis "jadi", "artinya", atau "menghasilkan".
- Simbol dan operator (`<`, `<=`, `i++`, `;`) selalu ditulis dengan `code`, supaya tidak menyatu dengan kata biasa. Keyword (`while`, `for`) pakai `code` di judul slide dan saat menunjuk kode, tapi boleh polos di kalimat biasa. Rumus diberi kurung, misalnya "(b − a + 1) kali", atau ditaruh di tabel bersama alasannya. Salah: "Dengan < loop jalan b − a kali, dengan <= jalan b − a + 1 kali".
- Kalau konsepnya berupa urutan tahap, jelaskan kenapa tiap tahap ada di posisinya dan apa yang rusak kalau urutannya ditukar.
- Untuk soal analisis, beri template kalimat kesimpulan beserta rentang nilainya.
- Kalau menjelaskan sesuatu di luar materi dosen, katakan terus terang.
- Tabel kesalahan memuat penyebab atau perbaikannya, bukan hanya gejala.

### Notes
- Struktur halaman mengikuti `_contoh.html`: `header` (h1, `p.tujuan`, `ul.legenda`, `nav.peta`) lalu `main` berisi `section.langkah`. Peta jalur berisi link ke tiap section. `notes.js` membuka section yang diklik.
- Satu konsep = satu section toggle bernomor (keycap 1️⃣). **Semua section tertutup secara default**, seperti outline Notion.
- Urutan isi: masalah dan contoh sehari-hari → nama istilah dan definisi → aturan utama kalau ada beberapa pilihan → detail per poin (kalimat inti tebal + `div.detail`) → rumus → visualisasi kalau membantu → contoh soal dan soal latihan → "Jangan sampai salah" (jebakan) di toggle. Analogi boleh dipakai, selalu dengan batasnya.
- Satu bentuk per ide. Jangan ulang ide yang sama sebagai rumus, resep, hitungan, tabel, kode, dan gambar sekaligus. Kode atau gambar hanya kalau menunjukkan hal baru.
- Yang langsung terlihat hanya kalimat inti. Penjelasan panjang, keterangan simbol, contoh hitungan, dan trace ada di `div.detail` atau toggle.
- Rumus penting di tengah (`p.rumus`), langsung diikuti arti tiap simbol dalam list pendek, lalu cara membaca hasilnya.
- **Bentuk soal tetap:** semua contoh soal dan soal latihan memakai `div.soal-kotak`: `p.label` ("Contoh soal" atau "Soal latihan", boleh ditambah tingkat seperti "susahan dikit"), teks soal, lalu `details` "Lihat jawaban" berisi langkah berlabel tebal dan `p.kesimpulan`. Template kalimat jawaban ujian ditaruh di `blockquote`.
- Notes ujian: kisi-kisi (dan bobot kalau ada) dalam satu callout di atas, lalu satu section per soal kisi-kisi. Tanpa section strategi dan tanpa contoh esai panjang. Rujukan slide secukupnya, jangan di setiap kalimat.
- Algoritma: definisi satu kalimat → cara kerja bernomor → output, kelebihan, kekurangan. Metode yang mirip dibandingkan dalam tabel.
- Soal hitungan: langkah berlabel tebal, nilai antara ditaruh di tabel.
- Teks tebal berwarna punya arti tetap. `<b>` (kuning) = frasa kunci, dan boleh banyak: membaca bagian tebal saja harus memberi ringkasan. `b.tx-merah` = salah atau masalah, `b.tx-hijau` = benar atau solusi, `b.tx-biru` dan `b.tx-oranye` = dua pilihan atau jalur yang dibandingkan. Label poin pakai `<strong>`.
- Stabilo latar dipakai jarang: kuning (`mark`) = istilah baru saat pertama muncul, pink (`mark.jebakan`) = jebakan, biru (`mark.kunci`) = wajib diingat, hijau (`mark.kaitan`) = kaitan.
- Tabel biasa: gaya tabel Notion, baris pertama dan kolom pertama abu-abu, tanpa warna per baris (sudah diatur `gaya.css`).
- Notes ditutup dengan daftar pustaka (`ol.refs`).
- Setiap `<details>` yang judulnya memuat "full code" otomatis punya mode **Bertahap** (`notes.js`).

### Slides
- Format deck tetap (`body.deck`, satu `section.slide` = satu slide, `slides.js`), tapi warna, font, dan komponen dari `gaya.css` (stabilo, `aside.catatan`, `aside.jebakan`, `p.intinya`, tabel).
- Satu slide = satu ide. Judul slide (`<h2>`) berupa **kalimat kesimpulan**, bukan topik. Contoh: "Learning rate terlalu besar membuat w makin menjauh", bukan "Learning rate".
- Di atas judul ada `p.kicker` berisi nomor section notes yang terkait dan nama topiknya, misalnya "Notes 3️⃣ · while".
- Di bawah judul ada kalimat pembuka `<p class="sub">`, satu kalimat, yang menjelaskan konteks atau cara membaca bukti di slide.
- Isi slide adalah bukti untuk judulnya: visualisasi, tabel, atau contoh angka, ditambah maksimal 3 poin pendek. Sekitar 60 kata terlihat.
- Semua yang penting ada di slide, bukan di speaker notes. Setiap diagram punya label dan satu kalimat keterangan.
- Istilah, contoh, dan penomoran sama dengan notes.
- Sisipkan slide `.full` berisi iframe visualisasi kalau ada konsep yang bisa dicoba.
- Akhiri dengan slide ringkasan dan slide soal latihan. Jawabannya ada di slide berikutnya.
- Setiap slide harus muat di layar 1280×720. Cek di browser sebelum commit.

### Visualisasi (viz)
- Pertahankan semua visualisasi yang ada dan pastikan tetap berfungsi setelah diubah.
- Viz yang dibuka sendiri (bukan di iframe slide) otomatis punya tombol **Kembali**, Home, dan nama matkul (`theme.js`). Link ke viz dari notes dan slide dibuka di tab yang sama, supaya Kembali mengarah ke halaman asal.
- Satu viz untuk satu konsep. Mentee harus langsung tahu apa yang perlu diklik.
- Setiap viz punya tiga hal: satu kalimat tentang apa yang ditunjukkan, `p.coba` ("Coba: …", apa yang digeser atau diklik), dan `p.perhatikan` ("Perhatikan: …", apa yang harus dilihat dan kesimpulannya). Di `cviz`, isi `perhatikan` per program.
- Sumbu, satuan, dan nilai yang sedang dipilih selalu terlihat.
- Warna dan font mengikuti `gaya.css`, di mode terang dan gelap.
- Kalau notes membahas konsep yang sama, tautkan viz yang sama di notes. `cviz` bisa langsung membuka program tertentu lewat hash, misalnya `viz/loop.html#nested`.
- Pakai mesin bersama kalau cocok: `_shared/cviz.js` (program C), `listviz.js` (linked list), `logic.js` (logika), `automata.js` dan `grammar.js` (automata dan grammar), `diagram.js` (flowchart, hierarchy chart, DFD, dan kanvas latihan PDM). Mesin ini sudah mengikuti aturan di bawah.
- Setelah mengubah `automata.js` atau `grammar.js`, jalankan `node tools/check-engines.js`. Script ini mencocokkan hasil mesin dengan jawaban di slide dosen.
- Simulasi bertahap selalu punya tombol **Kembali** di sebelah **Langkah berikutnya**.
- Pilihan contoh lebih dari 4: pakai dropdown (`label.pick` + `select.field`), bukan deretan tombol. Pilihan paling banyak 4: grup tombol `.seg`.
- Jangan menumpuk kotak. Baris kontrol tanpa latar (`.controls`), paling banyak satu kartu untuk penjelasan langkah dan satu panel untuk state. Jangan ada kartu di dalam kartu.
- Sembunyikan yang jarang dipakai: ubah input di `<details>`, pengaturan sekunder (mode tebak) sebagai `label.check` kecil di kanan atas.
- Label input diletakkan di atas kolom, jangan terlipat di sampingnya.
- Cek di desktop, HP (375px), dan mode gelap sebelum commit. Contoh viz yang sudah sesuai: `algorithm-and-programming/03-repetition/viz/loop.html`.

### Pemeriksaan akhir (tiap topik)
Baca ulang slides saja, lalu notes saja, sebagai menti yang belajar sendiri tanpa mentor. Cari istilah yang belum dijelaskan, langkah yang dilompati, visualisasi tanpa petunjuk, dan bagian yang hanya bisa dipahami kalau dijelaskan lisan. Perbaiki semuanya sebelum lanjut ke topik berikutnya. Buka hasilnya di browser dan cek semua visualisasi interaktif masih berfungsi.

Langkah teknis untuk materi baru ada di README, bagian "Membuat Materi Baru". Matkul baru juga butuh kartu di home (`index.html`).

**Editor web admin** (`_shared/editor.js`, README bagian "Mengedit Lewat Web"): admin bisa mengedit isi halaman langsung di situs, dan setiap simpan menjadi commit di `master`. Jadi `git pull` dulu sebelum mengubah file. Halaman baru (selain viz) harus memuat `editor.js` setelah `theme.js`, seperti di `_template/`. Tulis blok teks yang bisa diedit sebagai elemen paling dalam (`p`, `li`, `td`, judul), jangan teks lepas di samping elemen blok lain.
