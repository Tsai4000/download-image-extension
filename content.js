chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImages') {
    const images = [];
    // Get minDimension from the request, with a default
    const minDimension = request.minDimension || 300;

    document.querySelectorAll('img').forEach(img => {
      // Check if either width or height meets the minDimension
      if (img.naturalWidth >= minDimension || img.naturalHeight >= minDimension) {
        // Ensure the image URL is complete
        let imageUrl = img.src;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          try {
            imageUrl = new URL(imageUrl, window.location.href).href;
          } catch (e) {
            console.warn('Invalid image URL:', imageUrl, e);
            return; // Skip invalid URL
          }
        }
        // Avoid adding duplicates, overly long data URIs, or invalid image sources
        if (imageUrl && !images.includes(imageUrl) && (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))) {
          images.push(imageUrl);
        }
      }
    });
    sendResponse({ images: images });
  }
  return true; // Keep the message channel open for asynchronous sendResponse
});
