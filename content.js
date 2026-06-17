(async function() {
  // Mencegah script berjalan ganda jika tombol diklik berkali-kali
  if (window.hasRunTiktokScraper) return;
  window.hasRunTiktokScraper = true;

  // 1. Membuat UI Overlay untuk status
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.left = '20px';
  overlay.style.padding = '15px 25px';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  overlay.style.color = 'white';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '9999999';
  overlay.style.fontFamily = 'sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
  overlay.innerText = 'Memulai ekstraksi komentar TikTok...';
  document.body.appendChild(overlay);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let previousHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 15; // Jumlah maksimal percobaan scroll sebelum menyerah

  // 2. Fungsi Auto-Scroll untuk memuat seluruh komentar
  overlay.innerText = 'Menggulir halaman untuk memuat komentar... Harap tunggu.';
  
  while (scrollAttempts < maxScrollAttempts) {
    // Kadang komentar di-scroll dari body utama
    window.scrollTo(0, document.body.scrollHeight);
    
    // Kadang TikTok menggunakan container khusus untuk list komentar
    const scrollableDivs = document.querySelectorAll('[class*="DivCommentListContainer"], [class*="comment-list"]');
    scrollableDivs.forEach(div => {
      div.scrollTop = div.scrollHeight;
    });

    await delay(1500); // Waktu tunggu agar data baru termuat (lazy loading)

    // Klik tombol "View more replies" jika ada untuk memuat balasan
    const viewMoreButtons = document.querySelectorAll('[data-e2e="view-more-replies"], [class*="PReplyActionText"]');
    if (viewMoreButtons.length > 0) {
      viewMoreButtons.forEach(btn => btn.click());
      await delay(1000); // Tunggu sebentar setelah klik balasan
    }

    const currentHeight = document.body.scrollHeight;
    let containerHeight = 0;
    scrollableDivs.forEach(div => containerHeight += div.scrollHeight);
    const totalHeight = currentHeight + containerHeight;

    const currentCommentsCount = document.querySelectorAll('[class*="DivCommentItemContainer"], [class*="comment-item"]').length;
    overlay.innerText = `Memuat komentar... Menemukan ${currentCommentsCount} komentar sejauh ini.`;

    if (totalHeight === previousHeight) {
      scrollAttempts++;
    } else {
      scrollAttempts = 0; // Reset percobaan jika halaman berhasil scroll ke bawah
      previousHeight = totalHeight;
    }
  }

  overlay.innerText = 'Ekstraksi selesai! Sedang memproses data...';

  // 3. Ekstraksi Data Komentar
  const commentNodes = document.querySelectorAll('[class*="DivCommentItemContainer"], [class*="comment-item"], [data-e2e="comment-level-1"], [data-e2e="comment-level-2"]');
  
  const commentsSet = new Set(); // Set untuk mencegah adanya duplikasi komentar
  const csvData = [];
  
  // Header tabel CSV
  csvData.push(['Nama User', 'Komentar', 'Waktu']);

  commentNodes.forEach(node => {
    try {
      // Strategi multiple-selector untuk mencocokkan berbagai versi interface TikTok
      const usernameEl = node.querySelector('[data-e2e="comment-username-1"], [data-e2e="comment-username-2"], [class*="SpanUserNameText"], a[href*="/@"]');
      const textEl = node.querySelector('[data-e2e="comment-level-1"] > p, [data-e2e="comment-level-2"] > p, p[data-e2e="comment-level-1"], p[data-e2e="comment-level-2"], [class*="SpanCommentContent"], [class*="PCommentText"]');
      const timeEl = node.querySelector('[data-e2e="comment-time-1"], [data-e2e="comment-time-2"], [class*="SpanCreatedTime"]');

      if (usernameEl && textEl) {
        let username = usernameEl.innerText.trim();
        let text = textEl.innerText.trim();
        let time = timeEl ? timeEl.innerText.trim() : '';

        // Menghindari karakter kutip rusak di dalam file CSV dengan memberinya double quote
        username = username.replace(/"/g, '""');
        text = text.replace(/"/g, '""').replace(/\n/g, ' ');

        const rowKey = `${username}-${text}`;
        if (!commentsSet.has(rowKey)) {
          commentsSet.add(rowKey);
          // Tambahkan row data dengan diapit tanda kutip agar separator koma di teks tidak merusak format kolom
          csvData.push([`"${username}"`, `"${text}"`, `"${time}"`]);
        }
      }
    } catch (e) {
      console.error("Terjadi error saat memproses salah satu komentar", e);
    }
  });

  if (csvData.length <= 1) {
    overlay.innerText = 'Gagal mengekstrak komentar. Pastikan Anda berada di halaman video TikTok yang memiliki komentar.';
    setTimeout(() => {
      document.body.removeChild(overlay);
      window.hasRunTiktokScraper = false;
    }, 5000);
    return;
  }

  // 4. Proses konversi ke format CSV dan otomatisasi Download File
  const csvString = csvData.map(row => row.join(',')).join('\n');
  
  // Menambahkan byte-order-mark (\ufeff) agar Excel bisa membaca karakter UTF-8 dengan baik (misal emoji)
  const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' }); 
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  // Menamai file dengan imbuhan timestamp
  a.setAttribute('download', `tiktok_comments_${new Date().getTime()}.csv`);
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  overlay.innerText = `Selesai! ${csvData.length - 1} komentar berhasil diunduh.`;
  
  // Hapus overlay setelah selesai
  setTimeout(() => {
    document.body.removeChild(overlay);
    window.hasRunTiktokScraper = false;
  }, 4000);

})();
