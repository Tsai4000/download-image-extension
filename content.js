chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImages') {
    const images = [];
    // 從請求中獲取 minWidth 和 minHeight，並設置默認值
    const minWidth = request.minWidth || 300;
    const minHeight = request.minHeight || 300;

    document.querySelectorAll('img').forEach(img => {
      if (img.naturalWidth >= minWidth && img.naturalHeight >= minHeight) {
        // 確保圖片 URL 是完整的
        let imageUrl = img.src;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          try {
            imageUrl = new URL(imageUrl, window.location.href).href;
          } catch (e) {
            console.warn('Invalid image URL:', imageUrl, e);
            return; // 跳過無效的 URL
          }
        }
        // 避免重複加入 data URI 過長的圖片，或無效的圖片源
        if (imageUrl && !images.includes(imageUrl) && (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))) {
          images.push(imageUrl);
        }
      }
    });
    sendResponse({ images: images });
  }
  return true; // 保持 message channel 開啟以供異步 sendResponse
});
