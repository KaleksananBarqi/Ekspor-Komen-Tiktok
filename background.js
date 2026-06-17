// background.js — Service worker ekstensi TikTok Exporter

chrome.runtime.onInstalled.addListener(() => {
  console.log('Ekspor Komentar TikTok: Ekstensi terpasang.');
});

/**
 * Listener untuk pesan dari content script.
 * Menangani permintaan download file CSV menggunakan chrome.downloads API
 * agar tidak terblokir oleh Content Security Policy (CSP) TikTok.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source !== 'tiktok-exporter') return;

  if (message.type === 'download') {
    const { csvData, filename } = message;

    /**
     * Konversi string CSV (Unicode/emoji-safe) ke base64 data URL.
     *
     * ⚠️ btoa() hanya support Latin-1 — akan crash untuk emoji dan
     *    karakter non-ASCII (misalnya komentar TikTok bahasa Indonesia
     *    yang mengandung 🔥💰😂 dll).
     *
     * Solusi: pakai TextEncoder → Uint8Array → loop ke string binary → btoa()
     * TextEncoder tersedia di service worker MV3.
     */
    const encoder = new TextEncoder();
    const bytes   = encoder.encode(csvData); // UTF-8 byte array, aman untuk emoji
    let binary    = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64  = btoa(binary);
    const dataUrl = `data:text/csv;charset=utf-8;base64,${base64}`;

    chrome.downloads.download(
      { url: dataUrl, filename: filename, saveAs: false },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[TikTok Exporter] Download gagal:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[TikTok Exporter] Download dimulai, ID:', downloadId);
          sendResponse({ success: true, downloadId });
        }
      }
    );

    // Kembalikan true agar sendResponse bisa dipanggil secara async
    return true;
  }
});
