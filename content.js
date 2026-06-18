/**
 * content.js — Skrip utama TikTok Comment Exporter
 *
 * Diinjeksi oleh popup.js via chrome.scripting.executeScript dengan func + args.
 * Menerima parameter: { autoScroll: boolean }
 *
 * @param {Object} options
 * @param {boolean} options.autoScroll - Apakah perlu scroll otomatis sebelum ekstraksi
 */
async function tiktokExporterMain({ autoScroll = true } = {}) {
  // Mencegah script berjalan ganda jika tombol diklik berkali-kali
  if (window.__tiktokExporterRunning) {
    chrome.runtime.sendMessage({
      source: 'tiktok-exporter',
      type: 'error',
      text: 'Proses ekspor sudah sedang berjalan. Tunggu hingga selesai.',
    });
    return;
  }
  window.__tiktokExporterRunning = true;
  window.__tiktokExporterStop = false;

  // =============================================
  // 1. UI OVERLAY PREMIUM (Floating Card)
  // =============================================
  const existingOverlay = document.getElementById('__tiktok-exporter-overlay__');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = '__tiktok-exporter-overlay__';
  overlay.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 2147483647;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    width: 300px;
    padding: 16px 18px;
    background: linear-gradient(145deg, rgba(13,13,26,0.97), rgba(10,10,15,0.97));
    border: 1px solid rgba(105, 201, 208, 0.25);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 60px rgba(105,201,208,0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: #e2e8f0;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,rgba(105,201,208,0.2),rgba(238,29,82,0.2));border:1px solid rgba(105,201,208,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">📤</div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#f1f5f9;letter-spacing:-0.2px;">TikTok Eksport</div>
        <div id="__exporter-status__" style="font-size:10px;color:#94a3b8;margin-top:1px;">Memulai...</div>
      </div>
      <div id="__exporter-badge__" style="margin-left:auto;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;background:rgba(251,191,36,0.1);color:#fbbf24;border:1px solid rgba(251,191,36,0.2);white-space:nowrap;">Berjalan</div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(100,116,139,0.2),transparent);margin-bottom:10px;"></div>
    <div id="__exporter-progress-bar-wrap__" style="height:4px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:6px;">
      <div id="__exporter-progress__" style="height:100%;width:10%;background:linear-gradient(90deg,#69C9D0,#EE1D52);border-radius:99px;transition:width 0.5s ease;"></div>
    </div>
    <div id="__exporter-detail__" style="font-size:10px;color:#64748b;text-align:right;">Menginisialisasi...</div>
    <div style="margin-top:12px;display:flex;justify-content:center;">
      <button id="__exporter-stop-btn__" style="background:linear-gradient(135deg,#EE1D52,#c01642);color:white;border:none;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(238,29,82,0.3);">
        Berhenti &amp; Unduh
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('__exporter-stop-btn__').addEventListener('click', () => {
    window.__tiktokExporterStop = true;
    updateOverlay(
      'Menghentikan...',
      'Menyiapkan unduhan dari komentar yang sudah dimuat',
      progressEl.style.width.replace('%', '')
    );
    const stopBtn = document.getElementById('__exporter-stop-btn__');
    stopBtn.innerText = 'Menyiapkan...';
    stopBtn.disabled = true;
  });

  // Animate in
  requestAnimationFrame(() => {
    setTimeout(() => {
      overlay.style.transform = 'translateY(0)';
      overlay.style.opacity = '1';
    }, 50);
  });

  const statusEl  = document.getElementById('__exporter-status__');
  const detailEl  = document.getElementById('__exporter-detail__');
  const progressEl = document.getElementById('__exporter-progress__');
  const badgeEl   = document.getElementById('__exporter-badge__');

  function updateOverlay(status, detail, progressPct, state = 'loading') {
    statusEl.textContent  = status;
    detailEl.textContent  = detail;
    progressEl.style.width = `${progressPct}%`;
    if (state === 'done') {
      badgeEl.style.background   = 'rgba(74,222,128,0.1)';
      badgeEl.style.color        = '#4ade80';
      badgeEl.style.borderColor  = 'rgba(74,222,128,0.2)';
      badgeEl.textContent        = 'Selesai ✓';
      overlay.style.borderColor  = 'rgba(74,222,128,0.25)';
    } else if (state === 'error') {
      badgeEl.style.background   = 'rgba(238,29,82,0.1)';
      badgeEl.style.color        = '#EE1D52';
      badgeEl.style.borderColor  = 'rgba(238,29,82,0.2)';
      badgeEl.textContent        = 'Error';
      overlay.style.borderColor  = 'rgba(238,29,82,0.25)';
    }
  }

  function removeOverlay(afterMs = 4000) {
    setTimeout(() => {
      overlay.style.transform = 'translateY(20px)';
      overlay.style.opacity   = '0';
      setTimeout(() => {
        overlay.remove();
        window.__tiktokExporterRunning = false;
      }, 400);
    }, afterMs);
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // =============================================
  // 2. FUNGSI HELPER: Kirim update ke popup
  // =============================================
  function sendMsg(type, data = {}) {
    try {
      chrome.runtime.sendMessage({ source: 'tiktok-exporter', type, ...data });
    } catch (_) { /* popup mungkin sudah ditutup */ }
  }

  // =============================================
  // 3. SELECTOR COMMENT CONTAINER (terpusat)
  // =============================================
  /**
   * Mengembalikan elemen-elemen yang merupakan scroll container komentar TikTok.
   * Menggunakan blacklist untuk menghindari video player dan elemen tidak relevan.
   */
  function getCommentScrollContainers() {
    // ─── Selector spesifik untuk panel komentar TikTok ───
    const specificSelectors = [
      '[class*="DivCommentListContainer"]',
      '[class*="comment-list-container"]',
      '[data-e2e="comment-list"]',
      '.comment-list',
      '[class*="DivCommentContainer"]',
      '[class*="DivScrollContainer"]',
    ];

    const candidates = document.querySelectorAll(specificSelectors.join(', '));

    if (candidates.length > 0) return Array.from(candidates);

    // ─── Fallback: cari div yang posisinya di sisi kanan layar ───
    // (panel komentar TikTok selalu ada di sisi kanan, bukan tengah/kiri)
    // Tambahkan blacklist ketat untuk menghindari video player.
    const VIDEO_BLACKLIST_KEYWORDS = [
      'video', 'player', 'xgplayer', 'swiper', 'feed', 'recommend',
      'DivVideoContainer', 'VideoCard', 'xg-video', 'DivBrowse',
    ];

    const viewportWidth = window.innerWidth;
    const fallback = [];

    document.querySelectorAll('div, section').forEach((el) => {
      // Elemen harus punya scrollbar vertikal
      if (el.scrollHeight <= el.clientHeight || el.clientHeight <= 0) return;
      // Cukup tinggi untuk menjadi panel komentar
      if (el.clientHeight < 300) return;

      // Blacklist: jika class atau id mengandung kata kunci video player
      const identifier = (el.className + ' ' + el.id).toLowerCase();
      const isVideoElement = VIDEO_BLACKLIST_KEYWORDS.some((kw) =>
        identifier.includes(kw.toLowerCase())
      );
      if (isVideoElement) return;

      // Hanya ambil elemen yang berada di 60% sisi kanan layar
      const rect = el.getBoundingClientRect();
      if (rect.left < viewportWidth * 0.4) return;

      fallback.push(el);
    });

    return fallback;
  }

  // =============================================
  // 4. AUTO-SCROLL untuk memuat komentar
  // =============================================
  if (autoScroll) {
    updateOverlay('Menggulir halaman...', 'Memuat semua komentar via scroll otomatis', 15);
    sendMsg('progress', { percent: 15, text: 'Menggulir halaman untuk memuat komentar...' });

    let previousHeight = 0;
    let stuckCount     = 0;
    const maxStuck     = 20;
    let totalScrolls   = 0;

    while (stuckCount < maxStuck && !window.__tiktokExporterStop) {
      // Hanya scroll container komentar yang telah difilter
      const commentContainers = getCommentScrollContainers();
      commentContainers.forEach((el) => {
        el.scrollBy(0, 2000);
      });

      await delay(1800);

      if (window.__tiktokExporterStop) break;

      // Klik tombol "lihat lebih banyak balasan"
      const replyButtons = Array.from(document.querySelectorAll(
        '[data-e2e="view-more-replies"], [class*="PReplyActionText"], ' +
        '[class*="view-more-reply"], [class*="ViewMoreReplies"], ' +
        'div[role="button"], p[role="button"], span[role="button"]'
      ));

      const validReplyBtns = replyButtons.filter((btn) => {
        const text = (btn.innerText || '').toLowerCase();
        return (
          text.includes('balasan') ||
          text.includes('reply') ||
          text.includes('replies') ||
          text.includes('lihat') ||
          text.includes('view')
        );
      });

      if (validReplyBtns.length > 0) {
        validReplyBtns.forEach((btn) => {
          try { btn.click(); } catch (e) {}
        });
        // Tunggu lebih lama agar DOM sempat render reply yang baru dimuat
        await delay(1500);

        // Scroll sedikit di container komentar agar reply baru ter-render
        const commentContainersAfterClick = getCommentScrollContainers();
        commentContainersAfterClick.forEach((el) => {
          el.scrollBy(0, 500);
        });
        await delay(800);
      }

      // Hitung ketinggian total untuk deteksi stuck
      let containerHeight = 0;
      getCommentScrollContainers().forEach((el) => { containerHeight += el.scrollHeight; });
      const totalHeight = document.body.scrollHeight + containerHeight;

      const foundCount = document.querySelectorAll(
        '[class*="DivCommentItemContainer"], [class*="comment-item"], ' +
        '[data-e2e="comment-level-1"], [data-e2e="comment-level-2"], ' +
        '[class*="CommentItemWrapper"], [class*="comment-item-wrapper"]'
      ).length;

      totalScrolls++;
      const approxPercent = Math.min(
        15 + Math.round((totalScrolls / (totalScrolls + maxStuck - stuckCount)) * 55),
        70
      );
      updateOverlay('Memuat komentar...', `Ditemukan ${foundCount} komentar sejauh ini`, approxPercent);
      sendMsg('progress', { percent: approxPercent, text: `Memuat komentar... Ditemukan ${foundCount} komentar` });

      if (totalHeight === previousHeight) {
        stuckCount++;
      } else {
        stuckCount     = 0;
        previousHeight = totalHeight;
      }
    }
  } else {
    // Lewati autoscroll — langsung ekstrak komentar yang sudah dimuat
    updateOverlay('Mode Manual', 'Melewati scroll otomatis, mengekstrak komentar yang terlihat...', 70);
    sendMsg('progress', { percent: 70, text: 'Mode manual: mengekstrak komentar yang sudah dimuat...' });
    await delay(500);
  }

  // =============================================
  // 5. EKSTRAKSI DATA KOMENTAR (Dual-Pass)
  // =============================================
  updateOverlay('Mengekstrak data...', 'Memproses semua node komentar yang ditemukan', 75);
  sendMsg('progress', { percent: 75, text: 'Mengekstrak data komentar...' });
  await delay(500);

  /**
   * Strategi DUAL-PASS EXTRACTION:
   *
   * PASS 1 — Container-first:
   *   Cari semua container komentar individual (level-1 DAN level-2/reply)
   *   via selector spesifik TikTok. Ini memastikan reply yang bersarang
   *   di dalam komentar induk tetap terambil sebagai entri terpisah.
   *
   * PASS 2 — Fallback heuristik (link profil):
   *   Scan semua a[href*="/@"] yang BELUM tercakup oleh Pass 1.
   *   Ini menjaga backward compatibility jika DOM TikTok berubah.
   */

  const seen = new Set();
  const rows = [['Nama User', 'Komentar', 'Waktu', 'Tipe']];
  const processedNodes = new WeakSet(); // Track container yang sudah diproses

  const panels = getCommentScrollContainers();
  const commentPanel = panels.length > 0 ? panels[0] : document;

  /**
   * Helper: Ekstrak data dari satu container komentar.
   * @param {HTMLElement} container - Container komentar individual
   * @param {string} forceTipe - Paksa tipe ('Balasan' atau 'Komentar'), atau null untuk auto-detect
   * @returns {boolean} true jika berhasil diekstrak
   */
  function extractFromContainer(container, forceTipe = null) {
    try {
      if (processedNodes.has(container)) return false;

      // -- Ekstrak Username --
      const userLink = container.querySelector('a[href*="/@"]');
      if (!userLink) return false;
      const usernameRaw = (userLink.innerText || userLink.textContent || '').trim();
      if (!usernameRaw) return false;

      // -- Ekstrak Komentar --
      let textEl = container.querySelector(
        'p[data-e2e="comment-level-1"], p[data-e2e="comment-level-2"], ' +
        '[class*="CommentText"], [class*="comment-text"]'
      );

      let text = '';
      if (textEl) {
        text = (textEl.innerText || textEl.textContent || '').trim();
      } else {
        // Fallback Heuristik: Cari tag p atau span dengan teks terpanjang
        const candidates = Array.from(container.querySelectorAll('p, span'));
        let longest = '';
        candidates.forEach(el => {
          const t = (el.innerText || el.textContent || '').trim();
          if (
            t.length > longest.length &&
            t !== usernameRaw &&
            !t.includes('Balas') &&
            !t.includes('Reply') &&
            !t.includes('replies') &&
            !t.includes('balasan') &&
            !t.includes('View') &&
            !t.includes('Lihat') &&
            !t.includes('Hide')
          ) {
            longest = t;
          }
        });
        text = longest;
      }

      // -- Ekstrak Waktu --
      const timeEl = container.querySelector('time, [class*="time"], [class*="CreatedTime"]');
      let time = timeEl ? (timeEl.innerText || timeEl.textContent || timeEl.getAttribute('datetime') || '').trim() : '';

      if (!time) {
        const spanT = Array.from(container.querySelectorAll('span')).find(s => {
          const txt = (s.innerText || '').trim().toLowerCase();
          return txt.includes('ago') || txt.includes('hari') || txt.includes('jam') ||
                 txt.includes('menit') || /^(just now|\d+[mhdw] ago|\d+-\d+)$/.test(txt);
        });
        if (spanT) time = (spanT.innerText || '').trim();
      }

      if (!text || text === usernameRaw) return false;

      // -- Tentukan Tipe (Komentar / Balasan) --
      let tipe = 'Komentar';
      if (forceTipe) {
        tipe = forceTipe;
      } else {
        // Deteksi reply berdasarkan atribut, class, atau posisi dalam DOM
        const isLevel2 = container.matches && (
          container.matches('[data-e2e="comment-level-2"]') ||
          container.matches('[class*="ReplyItem"]') ||
          container.matches('[class*="reply-item"]') ||
          container.matches('[class*="ReplyContainer"]')
        );
        const hasLevel2Attr = container.querySelector('[data-e2e="comment-level-2"]');
        const classHasReply = container.className && typeof container.className === 'string' &&
                              container.className.toLowerCase().includes('reply');
        // Cek apakah container ini berada DI DALAM komentar level-1 (tanda pasti reply)
        const insideLevel1 = container.closest &&
          container.closest('[data-e2e="comment-level-1"]') !== null &&
          !container.matches('[data-e2e="comment-level-1"]');

        if (isLevel2 || hasLevel2Attr || classHasReply || insideLevel1) {
          tipe = 'Balasan';
        }
      }

      // -- Escape CSV & Deduplikasi --
      let usernameSafe = usernameRaw.replace(/"/g, '""');
      let textSafe     = text.replace(/"/g, '""').replace(/\n/g, ' ');
      let timeSafe     = time.replace(/"/g, '""');

      const key = `${usernameSafe}||${textSafe}`;
      if (!seen.has(key)) {
        seen.add(key);
        rows.push([`"${usernameSafe}"`, `"${textSafe}"`, `"${timeSafe}"`, `"${tipe}"`]);
      }

      processedNodes.add(container);
      return true;
    } catch (e) {
      console.warn('[TikTok Exporter] Error parsing container:', e);
      return false;
    }
  }

  // ─── PASS 1: Container-first (prioritas tinggi) ───
  // Cari semua container komentar individual, termasuk reply level-2
  const containerSelectors = [
    '[data-e2e="comment-level-2"]',  // Reply — proses duluan agar tidak tertimpa parent
    '[data-e2e="comment-level-1"]',  // Komentar utama
    '[class*="DivCommentItemContainer"]',
    '[class*="CommentItemWrapper"]',
    '[class*="comment-item-wrapper"]',
    '[class*="comment-item"]',
  ];

  // Proses reply (level-2) terlebih dahulu
  const level2Containers = Array.from(
    commentPanel.querySelectorAll(
      '[data-e2e="comment-level-2"], [class*="ReplyItem"], [class*="reply-item"], [class*="ReplyContainer"]'
    )
  );
  level2Containers.forEach((container) => {
    extractFromContainer(container, 'Balasan');
  });

  // Lalu proses semua container komentar (level-1 dan sisa yang belum tercakup)
  const allContainers = Array.from(
    commentPanel.querySelectorAll(containerSelectors.join(', '))
  );
  allContainers.forEach((container) => {
    // Skip jika sudah diproses di level-2
    if (processedNodes.has(container)) return;
    extractFromContainer(container);
  });

  console.log(`[TikTok Exporter] Pass 1 (container): ${rows.length - 1} komentar ditemukan`);

  // ─── PASS 2: Fallback heuristik via link profil ───
  // Tangkap komentar yang mungkin terlewat oleh Pass 1
  const userLinks = Array.from(commentPanel.querySelectorAll('a[href*="/@"]'));

  userLinks.forEach((link) => {
    try {
      const usernameRaw = (link.innerText || link.textContent || '').trim();
      if (!usernameRaw) return;

      // Naik ke parent untuk menemukan container komentar
      let node = link.parentElement;
      for (let i = 0; i < 5; i++) {
        if (node && node.tagName === 'DIV' && (node.innerText || '').length > usernameRaw.length) {
          break;
        }
        if (node && node.parentElement) node = node.parentElement;
      }

      if (!node) return;
      // Skip jika container ini sudah diproses oleh Pass 1
      if (processedNodes.has(node)) return;

      extractFromContainer(node);
    } catch (e) {
      console.warn('[TikTok Exporter] Error parsing heuristik (fallback):', e);
    }
  });

  console.log('[TikTok Exporter] Total komentar yang berhasil diekstrak:', rows.length - 1);

  // =============================================
  // 6. VALIDASI & DOWNLOAD CSV
  // =============================================
  if (rows.length <= 1) {
    updateOverlay(
      'Komentar tidak ditemukan',
      'Pastikan komentar sudah tampil di halaman video',
      0,
      'error'
    );
    sendMsg('error', {
      text: 'Gagal mengekstrak komentar. Pastikan komentar sudah tampil dan Anda berada di halaman video TikTok.',
    });
    removeOverlay(5000);
    window.__tiktokExporterRunning = false;
    return;
  }

  updateOverlay('Menyiapkan file CSV...', `${rows.length - 1} komentar siap diunduh`, 90);
  sendMsg('progress', { percent: 90, text: `Menyiapkan unduhan ${rows.length - 1} komentar...` });
  await delay(400);

  // Bangun string CSV dengan BOM UTF-8
  const csvString = '\ufeff' + rows.map((r) => r.join(',')).join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename  = `tiktok_comments_${timestamp}.csv`;

  /**
   * Strategi download:
   * Mengirimkan data ke background.js via chrome.downloads API
   * agar tidak terblokir oleh Content Security Policy (CSP) halaman TikTok.
   */
  try {
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { source: 'tiktok-exporter', type: 'download', csvData: csvString, filename },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Download gagal'));
          }
        }
      );
    });
    console.log('[TikTok Exporter] Download via background berhasil.');
  } catch (bgErr) {
    console.error('[TikTok Exporter] Proses download gagal:', bgErr);
    updateOverlay('Gagal mengunduh', bgErr.message, 0, 'error');
    sendMsg('error', { text: `Gagal mengunduh file: ${bgErr.message}` });
    removeOverlay(5000);
    window.__tiktokExporterRunning = false;
    return;
  }

  // =============================================
  // 7. SELESAI
  // =============================================
  updateOverlay('Ekspor berhasil! 🎉', `${rows.length - 1} komentar telah diunduh`, 100, 'done');
  sendMsg('done', { count: rows.length - 1 });
  removeOverlay(5000);
}
