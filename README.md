# Ekspor Komentar TikTok (Chrome & Brave Extension)

Ekstensi peramban (browser extension) sederhana untuk Google Chrome dan Brave yang berfungsi untuk mengekspor semua komentar beserta balasannya dari video TikTok ke format **CSV/Excel** hanya dengan **satu klik**!

---

## 🚀 Fitur Utama
* **Ekspor 1-Klik:** Cukup klik ikon ekstensi di toolbar browser Anda.
* **Auto-Scroll Otomatis:** Ekstensi akan menggulir halaman secara otomatis ke bawah untuk memuat komentar baru (lazy load) dan mengklik tombol balasan jika ada.
* **Data yang Diekspor:**
  * Nama User (Username)
  * Isi Komentar (termasuk emoji)
  * Waktu Komentar
* **Format Output Excel-Friendly:** Menggunakan UTF-8 BOM agar emoji dan karakter khusus terbaca dengan rapi saat file `.csv` dibuka di Microsoft Excel atau Google Sheets.

---

## 🛠️ Cara Instalasi (Chrome & Brave)

Ikuti langkah mudah berikut untuk memasang ekstensi ini secara manual:

1. **Unduh Repositori Ini:**
   * Klik tombol **Code** (berwarna hijau) di bagian atas halaman GitHub ini, lalu pilih **Download ZIP**.
   * Ekstrak file ZIP tersebut ke folder di komputer Anda (misal: `C:\Ekspor-Komen-Tiktok`).
   * *Alternatif (jika menggunakan Git):* Jalankan `git clone https://github.com/KaleksananBarqi/Ekspor-Komen-Tiktok.git` di terminal Anda.

2. **Buka Halaman Ekstensi Browser:**
   * Di browser Chrome atau Brave Anda, buka tab baru dan akses alamat berikut:
     ```text
     chrome://extensions/
     ```

3. **Aktifkan Developer Mode:**
   * Di pojok kanan atas halaman ekstensi, aktifkan tombol **Developer mode** (Mode pengembang) menjadi posisi **ON**.

4. **Muat Ekstensi:**
   * Klik tombol **Load unpacked** (Muat yang belum dikemas) di pojok kiri atas halaman.
   * Pilih folder hasil ekstrak atau folder repositori lokal Anda (folder yang berisi file `manifest.json`).

5. **Pin Ekstensi (Sangat Direkomendasikan):**
   * Klik ikon *puzzle* (Extensions) di kanan atas toolbar browser Anda, lalu klik ikon **Pin** di sebelah "Ekspor Komentar TikTok" agar ikonnya selalu muncul di layar.

---

## 📈 Cara Menggunakan

1. Buka situs [TikTok](https://www.tiktok.com) di browser Anda.
2. Cari dan buka video yang ingin Anda ambil komentarnya.
3. Klik ikon ekstensi **Ekspor Komentar TikTok** di sudut kanan atas browser Anda.
4. Sebuah panel status hitam akan muncul di pojok kiri bawah halaman web TikTok untuk menginformasikan proses yang sedang berjalan.
5. Ekstensi akan melakukan auto-scroll otomatis untuk memuat komentar. Tunggu hingga proses selesai.
6. File `.csv` yang berisi daftar komentar akan otomatis terunduh ke komputer Anda.

---

## 📝 Catatan & Batasan
* Batas maksimal scroll default diatur sebanyak 15 kali untuk menjaga stabilitas memori browser. Anda dapat menyesuaikan nilai `maxScrollAttempts` di file `content.js` jika diperlukan untuk video yang memiliki puluhan ribu komentar.
* Ekstensi ini hanya membaca elemen yang berhasil dimuat di browser secara aman tanpa melanggar kebijakan API TikTok.