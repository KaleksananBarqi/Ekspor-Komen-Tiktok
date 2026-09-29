# Palette's Journal - Critical Learnings Only

This journal records critical UX and accessibility learnings, user behavior insights, and reusable patterns discovered during UX enhancements. Routine work is not logged here.

## 2026-09-29 - Full-Card Labeling for Compact Toggle Rows & Avoiding Invalid Nested Labels
**Learning:** Pada komponen kartu toggle berukuran kecil/kompak (seperti `.toggle-row`) yang memiliki styling `:hover` visual pada seluruh kartu, pengguna cenderung mengklik area teks atau kontainer kartu secara langsung (Fitts's Law). Menjadikan kartu pembungkus sebagai `<label for="...">` dengan `cursor: pointer; user-select: none;` memperluas target sentuh dan interaksi tanpa JavaScript tambahan. Namun, penting untuk mengubah elemen switch visual internal dari `<label>` menjadi `<span>` agar tidak menghasilkan *nested interactive labels* (invalid HTML) yang memicu duplikasi event *click*. Selain itu, integrasi `aria-labelledby` dan `aria-describedby` memastikan screen reader membacakan judul dan deskripsi konteks secara otomatis saat input difokuskan.
**Action:** Saat membuat baris toggle interaktif pada form/popup kecil, jadikan elemen baris terluar sebagai `<label>` dengan `user-select: none`, ubah switch visual di dalamnya menjadi `<span>`, dan asosiasikan elemen deskripsi pembantu dengan `aria-describedby`.
