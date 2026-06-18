// popup.js — Mengatur interaksi UI popup ekstensi

const exportBtn        = document.getElementById('exportBtn');
const statusText       = document.getElementById('statusText');
const statusArea       = document.getElementById('statusArea');
const statusBadge      = document.getElementById('statusBadge');
const progressWrap     = document.getElementById('progressWrap');
const progressFill     = document.getElementById('progressFill');
const progressLabel    = document.getElementById('progressLabel');
const autoScrollToggle = document.getElementById('autoScrollToggle');
const modeLabel        = document.getElementById('modeLabel');

// =============================================
// Muat setting tersimpan dari chrome.storage.local
// =============================================
chrome.storage.local.get(['autoScroll'], (result) => {
  // Default: true (auto-scroll aktif) jika belum pernah disimpan
  autoScrollToggle.checked = result.autoScroll !== undefined ? result.autoScroll : true;
  updateModeLabel();
});

// =============================================
// Update label Mode sesuai state toggle & simpan ke storage
// =============================================
function updateModeLabel() {
  modeLabel.textContent = autoScrollToggle.checked ? 'Auto-Scroll' : 'Manual';
}
autoScrollToggle.addEventListener('change', () => {
  chrome.storage.local.set({ autoScroll: autoScrollToggle.checked });
  updateModeLabel();
});
updateModeLabel(); // inisialisasi awal (sebelum storage selesai load)

// =============================================
// Helper UI
// =============================================
function setStatus(type, icon, message, badge) {
  statusArea.className = `status-area ${type}`;
  document.querySelector('.status-icon').textContent = icon;
  statusText.textContent = message;
  statusBadge.className  = `badge ${type}`;
  statusBadge.textContent = badge;
}

function setProgress(percent, label) {
  progressWrap.style.display = 'flex';
  progressFill.style.width   = `${percent}%`;
  progressLabel.textContent  = label;
}

// =============================================
// Tombol Ekspor
// =============================================
exportBtn.addEventListener('click', async () => {
  // Dapatkan tab aktif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes('tiktok.com')) {
    setStatus(
      'error', '⚠️',
      'Buka halaman video TikTok terlebih dahulu, lalu klik tombol ini kembali.',
      'Bukan TikTok'
    );
    return;
  }

  const autoScroll = autoScrollToggle.checked;

  exportBtn.disabled = true;
  exportBtn.querySelector('.btn-text').textContent = 'Sedang Berjalan...';
  setStatus(
    'loading', '⏳',
    autoScroll
      ? 'Proses ekstraksi dimulai. Harap tunggu, jangan tutup popup ini. Progres bisa dilihat langsung di halaman TikTok.'
      : 'Mode manual: langsung mengekstrak komentar yang sudah dimuat...',
    'Memproses'
  );
  setProgress(20, 'Menginjeksi skrip...');

  try {
    /**
     * Inject content.js sebagai fungsi (bukan file) agar bisa meneruskan
     * parameter `autoScroll` ke dalam fungsi tiktokExporterMain().
     * Pendekatan ini menghindari keterbatasan injeksi file statis.
     */
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    // Setelah fungsi terdefinisi di halaman, jalankan dengan argumen
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (options) => {
        if (typeof tiktokExporterMain === 'function') {
          tiktokExporterMain(options);
        }
      },
      args: [{ autoScroll }],
    });

    setProgress(50, 'Skrip berjalan di halaman...');

    // Dengarkan pesan dari content.js
    chrome.runtime.onMessage.addListener(function listener(message) {
      if (message.source !== 'tiktok-exporter') return;

      if (message.type === 'progress') {
        setProgress(message.percent || 60, message.text || 'Memuat komentar...');
        setStatus('loading', '⏳', message.text, 'Memproses');
      } else if (message.type === 'done') {
        setProgress(100, `${message.count} komentar diekspor!`);
        setStatus(
          'done', '✅',
          `Berhasil! ${message.count} komentar telah diunduh sebagai file CSV.`,
          'Selesai'
        );
        exportBtn.disabled = false;
        exportBtn.querySelector('.btn-text').textContent = 'Ekspor Lagi';
        chrome.runtime.onMessage.removeListener(listener);
      } else if (message.type === 'error') {
        setProgress(0, 'Gagal');
        progressWrap.style.display = 'none';
        setStatus('error', '❌', message.text, 'Error');
        exportBtn.disabled = false;
        exportBtn.querySelector('.btn-text').textContent = 'Coba Lagi';
        chrome.runtime.onMessage.removeListener(listener);
      }
    });

  } catch (err) {
    setStatus(
      'error', '❌',
      `Gagal menjalankan skrip: ${err.message}. Pastikan Anda berada di halaman video TikTok.`,
      'Error'
    );
    exportBtn.disabled = false;
    exportBtn.querySelector('.btn-text').textContent = 'Coba Lagi';
    progressWrap.style.display = 'none';
  }
});
