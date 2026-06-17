chrome.action.onClicked.addListener((tab) => {
  // Pastikan URL-nya mengandung tiktok.com
  if (tab.url && tab.url.includes("tiktok.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } else {
    // Memberikan alert jika bukan di TikTok (opsional karena kita butuh DOM)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert("Ekstensi ini hanya berfungsi di halaman TikTok.");
      }
    });
  }
});
